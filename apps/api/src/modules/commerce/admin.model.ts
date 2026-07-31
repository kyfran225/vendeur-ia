import mongoose, { Schema } from "mongoose";

const SystemSettingsSchema = new Schema({
  supportWhatsApp: { type: String, default: "+2250700000000" },
  pricing: {
    ramContributionFee: { type: Number, default: 5000 },
    packProFee: { type: Number, default: 25000 },
    premiumSubscriptionMonthly: { type: Number, default: 5000 }
  },
  metaConfig: {
    globalAppId: String,
    globalVerifyToken: String
  },
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export const SystemSettingsModel = mongoose.model("SystemSettings", SystemSettingsSchema);
