import express, { Request, Response } from "express";
import { User } from "../models/userModel";
import Joi from "joi";
import crypto from "crypto";
import bcrypt from "bcrypt";
import auth from "../middlewares/auth";
import { generateJwtToken } from "../utils/generateJwtToken";
import { verifyUserEmail } from "../utils/verifyUserEmail";
import RequestWithUser from "../interfaces/requestWithUser";
import { Venue } from "../models/venueModel";

const router: any = express.Router();

router.get("/users", auth, async (req: RequestWithUser, res: Response) => {
  try {
    const user = req.user;

    if (!user.isAdmin)
      return res.status(401).send("Access denied. Not authorized...");

    const users = await User.find().sort({ date: -1 });
    res.send(users);
  } catch (error: any) {
    res.status(500).send("Error: " + error.message);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    let user: any = await User.findById(req.params.id);

    const token = generateJwtToken(user);

    console.log(token);

    res.send(token);
  } catch (error: any) {
    res.status(500).send("Error: " + error.message);
  }
});

router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const emailToken = req.body.emailToken;

    if (!emailToken) return res.status(404).send("EmailToken not found...");

    const user: any = await User.findOne({ emailToken });

    if (user) {
      user.emailToken = null;
      user.isVerified = true;

      await user.save();

      const token = generateJwtToken(user);

      res.send(token);
    } else
      res
        .status(404)
        .send(
          "Email verification failed, you might have already verified your email. Visit your profile to confirm."
        );
  } catch (error: any) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.patch(
  "/update-user",
  auth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const schema = Joi.object({
        firstName: Joi.string().min(3).max(30).required(),
        lastName: Joi.string().min(3).max(30).required(),
        email: Joi.string().min(3).max(200).required().email(),
        password: Joi.string().min(6).max(200).required(),
      });

      const { error } = schema.validate(req.body);

      if (error) return res.status(400).send(error.details[0].message);

      const user: any = req.user;

      const checkUser: any = await User.findOne({ email: req.body.email });

      if (checkUser && user && checkUser.email !== user.email)
        return res.status(400).send("Email is already taken...");

      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword)
        return res
          .status(400)
          .send(
            "Invalid password. To update your account details, please enter the correct password..."
          );

      if (user.email.toLowerCase() !== req.body.email.toLowerCase()) {
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email.toLowerCase(),
            isVerified: false,
            emailToken: crypto.randomBytes(64).toString("hex"),
          },
          {
            new: true,
          }
        );
        verifyUserEmail(updatedUser);
        const token = generateJwtToken(updatedUser);
        res.send(token);
      } else {
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email.toLowerCase(),
          },
          {
            new: true,
          }
        );
        const token = generateJwtToken(updatedUser);
        res.send(token);
      }
    } catch (error: any) {
      console.log(error);
      res.status(500).send(error.message);
    }
  }
);

router.patch(
  "/update-password",
  auth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const schema = Joi.object({
        currentPassword: Joi.string().min(6).max(200).required(),
        newPassword: Joi.string().min(6).max(200).required(),
        repeatNewPassword: Joi.ref("newPassword"),
      }).with("newPassword", "repeatNewPassword");

      const { error } = schema.validate(req.body);

      if (error) return res.status(400).send(error.details[0].message);

      const user: any = req.user;

      const validPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!validPassword)
        return res
          .status(400)
          .send(
            "Invalid password. To set a new password, please enter the correct current password..."
          );

      if (req.body.newPassword) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt);
        const updatedUser = await user.save();
        res.send(updatedUser);
      }
    } catch (error: any) {
      console.log(error);
      res.status(500).send(error.message);
    }
  }
);

// Delete

router.post("/delete", auth, async (req: RequestWithUser, res: Response) => {
  try {
    const schema = Joi.object({
      password: Joi.string().min(6).max(200).required(),
    });

    const { error } = schema.validate(req.body);

    if (error) return res.status(400).send(error.details[0].message);

    const user: any = req.user;

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res
        .status(400)
        .send(
          "Invalid password. To delete your account, please enter the correct password..."
        );

    const deletedUser = await User.findByIdAndDelete(user._id);

    res.send(deletedUser);
  } catch (error: any) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// Admin Routes

router.post(
  "/admin/delete",
  auth,
  async (req: RequestWithUser, res: Response) => {
    try {
      const schema = Joi.object({
        userId: Joi.required(),
      });

      const { error } = schema.validate(req.body);

      if (error) return res.status(400).send(error.details[0].message);

      const admin: any = req.user;

      if (!admin.isAdmin) return res.status(400).send("Not authorized...");

      console.log("id", req.body.userId);

      const deletedCount: any = await Venue.deleteMany({
        author_id: req.body.userId,
      });

      console.log("count: ", deletedCount);

      if (deletedCount) {
        const deletedUser = await User.findByIdAndDelete(req.body.userId);

        res.send(deletedUser);
      }
    } catch (error: any) {
      console.log(error);
      res.status(500).send(error.message);
    }
  }
);

export default router;
