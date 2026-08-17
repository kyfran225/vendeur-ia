import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentIntent extends Document {
  userId: string;
  merchantId?: mongoose.Types.ObjectId;
  offerSlug: string;
  planName: string;
  billingInterval: "monthly" | "yearly";
  amount: number;
  currency: string;
  reference: string;
  provider: "manual_mobile_money" | "wave" | "orange_money" | "mtn_momo" | "moov" | "djamo" | "paystack" | "lygos" | "cinetpay";
  paymentMethod: "wave" | "orange_money" | "mtn_momo" | "moov" | "djamo" | "card" | "other";
  senderPhoneNumber?: string;
  senderName?: string;
  recipientPhoneNumber?: string;
  recipientName?: string;
  transactionId?: string;
  proofImageUrl?: string;
  status: "initiated" | "awaiting_payment" | "payment_detected" | "under_verification" | "confirmed" | "failed" | "rejected" | "expired";
  confidenceScore: number; // 0 to 100
  verificationSignals: {
    amountMatch?: boolean;
    senderMatch?: boolean;
    transactionIdUnique?: boolean;
    withinTimeWindow?: boolean;
    notes?: string[];
  };
  verifiedBy?: string;
  verifiedAt?: Date;
  adminNotes?: string;
  subscriptionId?: mongoose.Types.ObjectId;
  expiresAt: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentIntentSchema = new Schema<IPaymentIntent>(
  {
    userId: { type: String, required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", index: true },
    offerSlug: { type: String, required: true },
    planName: { type: String, required: true },
    billingInterval: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "XOF" },
    reference: { type: String, required: true, unique: true, index: true },
    provider: {
      type: String,
      enum: ["manual_mobile_money", "wave", "orange_money", "mtn_momo", "moov", "djamo", "paystack", "lygos", "cinetpay"],
      default: "manual_mobile_money"
    },
    paymentMethod: {
      type: String,
      enum: ["wave", "orange_money", "mtn_momo", "moov", "djamo", "card", "other"],
      default: "wave"
    },
    senderPhoneNumber: { type: String, default: "" },
    senderName: { type: String, default: "" },
    recipientPhoneNumber: { type: String, default: "" },
    recipientName: { type: String, default: "" },
    transactionId: { type: String, default: "", index: true },
    proofImageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "initiated",
        "awaiting_payment",
        "payment_detected",
        "under_verification",
        "confirmed",
        "failed",
        "rejected",
        "expired"
      ],
      default: "initiated",
      index: true
    },
    confidenceScore: { type: Number, default: 0 },
    verificationSignals: {
      amountMatch: { type: Boolean, default: false },
      senderMatch: { type: Boolean, default: false },
      transactionIdUnique: { type: Boolean, default: true },
      withinTimeWindow: { type: Boolean, default: true },
      notes: [{ type: String }]
    },
    verifiedBy: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    adminNotes: { type: String, default: "" },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", default: null },
    expiresAt: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes to prevent replay attacks and facilitate fast query
PaymentIntentSchema.index({ transactionId: 1, provider: 1 }, { sparse: true });
PaymentIntentSchema.index({ userId: 1, status: 1 });

export const PaymentIntentModel = mongoose.model<IPaymentIntent>("PaymentIntent", PaymentIntentSchema);
