import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  merchantId: string;
  phone: string;
  name?: string;
  avatarUrl?: string;
  avatarUpdatedAt?: Date;
  location?: string;
}

const CustomerSchema: Schema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  phone: { type: String, required: true },
  name: { type: String },
  avatarUrl: { type: String, default: "" },
  avatarUpdatedAt: { type: Date, default: null },
  location: { type: String }
}, { timestamps: true });

CustomerSchema.index({ merchantId: 1, phone: 1 }, { unique: true });

export const CustomerModel = mongoose.model<ICustomer>("Customer", CustomerSchema);
