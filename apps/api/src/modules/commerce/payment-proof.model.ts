import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentProofLog extends Document {
  merchantId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  imageHash: string; // SHA-256 hash to prevent replay attacks
  platform: string; // Wave, Orange Money, MTN MoMo, Moov Money, Djamo, etc.
  transactionId: string;
  amount: number;
  currency: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  extractedTimestamp?: Date;
  fraudAnalysis: {
    confidenceScore: number; // 0 to 100
    isAiGenerated: boolean;
    isPhotoshopTampered: boolean;
    recipientMatch: boolean;
    amountMatch: boolean;
    freshnessMatch: boolean;
    operatorSyntaxValid: boolean;
    tamperingFlags: string[];
    rawAiVerdict?: string;
  };
  decision: "AUTO_APPROVED" | "FLAGGED_FOR_REVIEW" | "REJECTED_FRAUD";
  reviewedByMerchant?: boolean;
  merchantDecision?: "approved" | "rejected";
  createdAt: Date;
}

const PaymentProofLogSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "CommerceCustomer", required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: "CommerceOrder", index: true },
  imageHash: { type: String, required: true, index: true },
  platform: { type: String, required: true },
  transactionId: { type: String, default: "" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "XOF" },
  senderName: { type: String, default: "" },
  senderPhone: { type: String, default: "" },
  recipientName: { type: String, default: "" },
  recipientPhone: { type: String, default: "" },
  extractedTimestamp: { type: Date },
  fraudAnalysis: {
    confidenceScore: { type: Number, required: true, default: 0 },
    isAiGenerated: { type: Boolean, default: false },
    isPhotoshopTampered: { type: Boolean, default: false },
    recipientMatch: { type: Boolean, default: false },
    amountMatch: { type: Boolean, default: false },
    freshnessMatch: { type: Boolean, default: false },
    operatorSyntaxValid: { type: Boolean, default: true },
    tamperingFlags: [{ type: String }],
    rawAiVerdict: { type: String, default: "" }
  },
  decision: {
    type: String,
    enum: ["AUTO_APPROVED", "FLAGGED_FOR_REVIEW", "REJECTED_FRAUD"],
    required: true,
    index: true
  },
  reviewedByMerchant: { type: Boolean, default: false },
  merchantDecision: { type: String, enum: ["approved", "rejected"] }
}, { timestamps: true });

// Compound index to strictly block duplicate transaction IDs for the same merchant & platform
PaymentProofLogSchema.index({ merchantId: 1, platform: 1, transactionId: 1 });
PaymentProofLogSchema.index({ merchantId: 1, imageHash: 1 });

export const PaymentProofLogModel = mongoose.model<IPaymentProofLog>("PaymentProofLog", PaymentProofLogSchema);
