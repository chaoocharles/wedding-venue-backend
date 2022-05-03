import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    services: { type: Array, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    isDraft: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    coverImg: { type: Object },
    author_id: { type: String },
    author_email: { type: String },
    customer_id: { type: String },
    customer_email: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Venue = mongoose.model("Venue", venueSchema);
