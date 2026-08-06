import mongoose, { Schema, Document } from "mongoose";
import { commerceCategories, commerceLanguages, commerceAgentTones, commerceResponseStyles, commercePaymentProviders } from "@vendeur-ia/core";

export interface IMerchant extends Document {
  ownerId: string;
  businessName: string;
  category: string;
  description: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  currency: string;
  language: string;
  paymentChannels: Array<{
    provider: string;
    label: string;
    number: string;
  }>;
  subscription: {
    plan: string;
    status: string;
    expiresAt: Date | null;
  };
  aiSettings: {
    personality: string;
    responseStyle: string;
    autoReply: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema: Schema = new Schema({
  ownerId: { type: String, required: true, unique: true },
  businessName: { type: String, required: true },
  category: { type: String, enum: commerceCategories, required: true },
  description: { type: String, default: "" },
  country: { type: String, default: "CI" },
  city: { type: String, required: true },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  whatsappNumber: { type: String, default: "" },
  currency: { type: String, default: "XOF" },
  language: { type: String, enum: commerceLanguages, default: "fr" },
  paymentChannels: [{
    provider: { type: String, enum: commercePaymentProviders },
    label: { type: String },
    number: { type: String }
  }],
  subscription: {
    plan: { type: String, enum: ["starter", "premium", "business"], default: "starter" },
    status: { type: String, enum: ["trial", "active", "past_due", "cancelled"], default: "trial" },
    expiresAt: { type: Date, default: null },
    subscriptionCode: { type: String, default: null },
    emailToken: { type: String, default: null },
    nextPaymentDate: { type: Date, default: null }
  },
  aiSettings: {
    personality: { type: String, enum: commerceAgentTones, default: "friendly" },
    responseStyle: { type: String, enum: commerceResponseStyles, default: "normal" },
    autoReply: { type: Boolean, default: true }
  }
}, { timestamps: true });

export const MerchantModel = mongoose.model<IMerchant>("Merchant", MerchantSchema);
