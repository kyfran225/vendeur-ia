import mongoose, { Schema, Document } from "mongoose";

export interface IOffer extends Document {
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  currency: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  setupRequired: boolean;
  setupOptions: Array<{
    type: string;
    price: number;
    label: string;
  }>;
  metadata: any;
}

const OfferSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number },
  currency: { type: String, default: "XOF" },
  features: [String],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  setupRequired: { type: Boolean, default: false },
  setupOptions: [{
    type: { type: String },
    price: { type: Number },
    label: { type: String }
  }],
  metadata: Schema.Types.Mixed
}, { timestamps: true });

export const OfferModel = mongoose.model<IOffer>("Offer", OfferSchema);
