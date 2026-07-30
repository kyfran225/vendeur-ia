import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  merchantId: string;
  phone: string;
  name?: string;
  location?: string;
}

const CustomerSchema: Schema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  phone: { type: String, required: true },
  name: { type: String },
  location: { type: String }
}, { timestamps: true });

CustomerSchema.index({ merchantId: 1, phone: 1 }, { unique: true });

export const CustomerModel = mongoose.model<ICustomer>("Customer", CustomerSchema);
