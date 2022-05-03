import express from "express";
import Stripe from "stripe";
import { User } from "../models/userModel";
import { provision } from "../utils/provision";

const router = express.Router();

const privateKey: any = process.env.STRIPE_PRIVATE_KEY;
const myStripe = new Stripe(privateKey, { apiVersion: "2020-08-27" });

router.post("/create-checkout-session", async (req, res) => {
  try {
    const customer = await myStripe.customers.create({
      metadata: {
        uid: req.body.uid,
      },
    });

    const session = await myStripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price: req.body.value,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/add-venue`,
      cancel_url: `${process.env.CLIENT_URL}/profile`,
    });
    res.json({ url: session.url });
  } catch (e: any) {
    console.log(e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    const webhookSecret: any = process.env.STRIPE_WEB_HOOK_SECRET;
    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      let signature: any = req.headers["stripe-signature"];

      try {
        event = myStripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }

    switch (eventType) {
      case "checkout.session.completed":
        myStripe.customers
          .retrieve(req.body.data.object.customer)
          .then(async (customer: any) => {
            try {
              let user: any = await User.findById(customer.metadata.uid);
              user.isSubscribed = true;
              user.customer_id = customer.id;
              user.customer_email = customer.email;

              user = await user.save();

              provision(user);
            } catch (err: any) {
              console.log(err.message);
            }
          })
          .catch((err) => console.log(err.message));

        // Payment is successful and the subscription is created.
        // You should provision the subscription and save the customer ID to your database.
        break;
      case "invoice.paid":
        // Continue to provision the subscription as payments continue to be made.
        // Store the status in your database and check when a user accesses your service.
        // This approach helps you avoid hitting rate limits.
        break;
      case "invoice.payment_failed":
        // The payment failed or the customer does not have a valid payment method.
        // The subscription becomes past_due. Notify your customer and send them to the
        // customer portal to update their payment information.
        break;
      default:
      // Unhandled event type
    }

    res.status(200).end();
  }
);

export default router;
