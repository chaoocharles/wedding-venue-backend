import { Request } from "express";
import User from "./user";

interface RequestWithUser extends Request {
  user: User;
}

export default RequestWithUser;
