import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  merchantId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  stock: number;
  availability: string;
  aiMetadata: {
    tags: string[];
    tiktokCaption?: string;
  };
}

const ProductSchema: Schema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "XOF" },
  images: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  availability: { type: String, enum: ["available", "limited", "sold_out", "hidden"], default: "available" },
  aiMetadata: {
    tags: [{ type: String }],
    tiktokCaption: { type: String }
  }
}, { timestamps: true });

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
