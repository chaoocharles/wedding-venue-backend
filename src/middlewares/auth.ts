import { Response, NextFunction } from "express";
import RequestWithUser from "../interfaces/requestWithUser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/userModel";

dotenv.config();

interface DataStoredInToken {
  _id: string;
}

const auth = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. Not authorized...");
  try {
    const jwtSecretKey: any = process.env.WEDDING_VENUES_APP_SECRET_KEY;
    const decoded = jwt.verify(token, jwtSecretKey) as DataStoredInToken;

    const user: any = await User.findById(decoded._id);

    if (!user) return res.status(404).send("User account not found...");

    req.user = user;

    next();
  } catch (ex) {
    res.status(400).send("Invalid auth token...");
  }
};

export default auth;
