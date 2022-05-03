import express, { Request, Response } from "express";
import register from "./routes/register";
import login from "./routes/login";
import user from "./routes/user";
import stripe from "./routes/stripe";
import venue from "./routes/venue";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();

dotenv.config();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/user", user);
app.use("/api/stripe", stripe);
app.use("/api/venue", venue);

app.get("/", (req: Request, res: Response) => {
  return res.send("Welcome to the wedding venue app apis...");
});

const uri = process.env.ATLAS_URI;
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});

mongoose
  //@ts-ignore
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection established..."))
  //@ts-ignore
  .catch((error) => console.error("MongoDB connection failed:", error.message));
