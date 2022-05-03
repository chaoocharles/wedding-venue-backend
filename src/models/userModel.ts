import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, minlength: 3, maxlength: 30 },
    lastName: { type: String, required: true, minlength: 3, maxlength: 30 },
    isAdmin: { type: Boolean, required: true, default: false },
    isVerified: { type: Boolean, default: false },
    email: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 200,
      unique: true,
    },
    emailToken: { type: String },
    password: { type: String, required: true, minlength: 3, maxlength: 1024 },
    isSubscribed: { type: Boolean, default: false },
    customer_id: { type: String },
    customer_email: { type: String },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
