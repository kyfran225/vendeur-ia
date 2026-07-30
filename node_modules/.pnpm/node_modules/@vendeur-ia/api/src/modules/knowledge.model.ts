import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledge extends Document {
  merchantId: string;
  deliveryZones: string[];
  openingHours: string;
  returnPolicy: string;
  faq: Array<{ question: string; answer: string }>;
  customInstructions: string;
}

const KnowledgeSchema: Schema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true, unique: true },
  deliveryZones: [{ type: String }],
  openingHours: { type: String, default: "" },
  returnPolicy: { type: String, default: "" },
  faq: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  customInstructions: { type: String, default: "" }
}, { timestamps: true });

export const KnowledgeModel = mongoose.model<IKnowledge>("Knowledge", KnowledgeSchema);
