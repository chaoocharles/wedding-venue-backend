import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import Joi from "joi";
import crypto from "crypto";
import { User } from "../models/userModel";
import { verifyUserEmail } from "../utils/verifyUserEmail";
import { generateJwtToken } from "../utils/generateJwtToken";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const schema = Joi.object({
      firstName: Joi.string().min(3).max(30).required(),
      lastName: Joi.string().min(3).max(30).required(),
      isAdmin: Joi.boolean().required(),
      email: Joi.string().min(3).max(200).required().email(),
      password: Joi.string().min(6).max(200).required(),
      repeatPassword: Joi.ref("password"),
    }).with("password", "repeatPassword");

    const { error } = schema.validate(req.body);

    if (error) return res.status(400).send(error.details[0].message);

    let user: any = await User.findOne({ email: req.body.email });
    if (user)
      return res
        .status(400)
        .send("User with the given email already exists...");

    const { firstName, lastName, email, password, isAdmin } = req.body;

    user = new User({
      firstName,
      lastName,
      email,
      password,
      isAdmin,
      isVerified: false,
      emailToken: crypto.randomBytes(64).toString("hex"),
    });

    const salt = await bcrypt.genSalt(10);
    //@ts-ignore
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    verifyUserEmail(user);

    const token = await generateJwtToken(user);

    res.send(token);
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
});

export default router;
