import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import Joi from "joi";
import { User } from "../models/userModel";
import { generateJwtToken } from "../utils/generateJwtToken";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const schema = Joi.object({
      email: Joi.string().min(3).max(200).required().email(),
      password: Joi.string().min(6).max(200).required(),
    });

    const { error } = schema.validate(req.body);

    if (error) return res.status(400).send(error.details[0].message);

    let user: any = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("Invalid email or password...");

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword)
      return res.status(400).send("Invalid email or password...");

    const token = await generateJwtToken(user);

    res.send(token);
  } catch (error: any) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
});

export default router;
