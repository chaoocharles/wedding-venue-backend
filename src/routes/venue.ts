import express, { Response, Request } from "express";
import { Venue } from "../models/venueModel";
import auth from "../middlewares/auth";
import RequestWithUser from "../interfaces/requestWithUser";
import Joi from "joi";
import cloudinary from "../utils/cloudinary";

const router: any = express.Router();

router.get("/venues", async (req: Request, res: Response) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.send(venues);
  } catch (error: any) {
    res.status(500).send("Error: " + error.message);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findById(req.params.id);
    res.send(venue);
  } catch (error: any) {
    res.status(500).send("Error: " + error.message);
  }
});

router.post("/add-venue", auth, async (req: RequestWithUser, res: Response) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(3).max(100).required(),
      description: Joi.string().min(20).max(10000).required(),
      services: Joi.array().required(),
      phone: Joi.string(),
      email: Joi.string().min(3).max(200).required().email(),
      isDraft: Joi.boolean(),
      isPublished: Joi.boolean(),
      coverImg: Joi.string().required(),
    });
    const { error } = schema.validate(req.body);

    const user: any = req.user;

    if (!user.isAdmin) {
      if (!user.isSubscribed)
        return res.status(401).send("To share your venue, please subscribe...");
    }

    if (error) return res.status(400).send(error.details[0].message);

    const {
      name,
      description,
      services,
      phone,
      email,
      isDraft,
      isPublished,
      coverImg,
    } = req.body;

    if (coverImg) {
      const uploadedResponse = await cloudinary.uploader.upload(coverImg, {
        upload_preset: "venue_cover_img",
      });

      if (uploadedResponse) {
        const venue = new Venue({
          name,
          description,
          services,
          phone,
          email,
          isDraft,
          isPublished,
          coverImg: uploadedResponse,
          author_id: user._id,
          author_email: user.email,
          customer_id: user.customer_id,
          customer_email: user.customer_email,
        });

        await venue.save();
        res.send(venue);
      }
    }
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
});

router.delete("/:id", auth, async (req: RequestWithUser, res: Response) => {
  try {
    const venue: any = await Venue.findById(req.params.id);

    const user: any = req.user;

    if (!(user.isAdmin || user._id.toString() === venue.author._id.toString()))
      return res.status(401).send("Access denied. Not authorized...");

    if (!venue) return res.status(404).send("Venue not found...");

    if (venue.coverImg.public_id) {
      const destroyResponse = await cloudinary.uploader.destroy(
        venue.coverImg.public_id
      );

      if (destroyResponse) {
        const deletedVenue = await Venue.findByIdAndDelete(req.params.id);

        res.send(deletedVenue);
      }
    }
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
});

router.put(
  "/edit-venue/:id",
  auth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        description: Joi.string().min(20).max(10000).required(),
        services: Joi.array().required(),
        phone: Joi.string(),
        email: Joi.string().min(3).max(200).required().email(),
        isDraft: Joi.boolean(),
        isPublished: Joi.boolean(),
        coverImg: Joi.alternatives(Joi.string(), Joi.object()),
        cover_public_id: Joi.string(),
      });

      const user: any = req.user;

      if (!user.isAdmin) {
        if (!user.isSubscribed)
          return res
            .status(401)
            .send("To edit your venue, please subscribe...");
      }

      const { error } = schema.validate(req.body);

      if (error) return res.status(400).send(error.details[0].message);

      const venue: any = await Venue.findById(req.params.id);

      if (
        !(user.isAdmin || user._id.toString() === venue.author._id.toString())
      )
        return res.status(401).send("Access denied. Not authorized...");

      if (!venue) return res.status(404).send("Venue not found...");

      const {
        name,
        description,
        services,
        phone,
        email,
        isDraft,
        isPublished,
        coverImg,
        cover_public_id,
      } = req.body;

      if (coverImg.public_id) {
        const updatedVenue = await Venue.findByIdAndUpdate(
          req.params.id,
          {
            name,
            description,
            services,
            phone,
            email,
            isDraft,
            isPublished,
            coverImg,
          },
          { new: true }
        );

        res.send(updatedVenue);
      } else if (cover_public_id) {
        const destroyResponse = await cloudinary.uploader.destroy(
          cover_public_id
        );

        if (destroyResponse) {
          const uploadedResponse = await cloudinary.uploader.upload(coverImg, {
            upload_preset: "venue_cover_img",
          });

          if (uploadedResponse) {
            const updatedVenue = await Venue.findByIdAndUpdate(
              req.params.id,
              {
                name,
                description,
                services,
                phone,
                email,
                isDraft,
                isPublished,
                coverImg: uploadedResponse,
              },
              { new: true }
            );

            res.send(updatedVenue);
          }
        }
      }
    } catch (error: any) {
      console.log(error.message);
      res.status(500).send(error.message);
    }
  }
);

export default router;
