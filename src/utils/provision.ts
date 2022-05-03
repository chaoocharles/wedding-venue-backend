import nodemailer from "nodemailer";

export const provision = (user: any) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "chaoocharles2@gmail.com",
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  const mailOptions = {
    from: '"Wedding Venues" <chaoocharles2@gmail.com>',
    to: user.email,
    subject: "Subscription successful!",
    html: `<p>Hello ${user.firstName}, you have successfully subscribed to our wedding venues platform. Use the link below to share your venue.</p>
      <a href ='${process.env.CLIENT_URL}/add-venue'>Tell Us About Your Venue</a>
      `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Provision email sent");
    }
  });
};
