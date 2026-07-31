import mongoose, { Schema } from "mongoose";

const TransactionSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  reference: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "XOF" },
  type: {
    type: String,
    enum: ["subscription", "ram_contribution", "pack_pro"],
    required: true
  },
  status: { type: String, enum: ["success", "failed", "pending"], default: "pending" },
  paymentMethod: String,
  paidAt: Date,
  metadata: Schema.Types.Mixed
}, { timestamps: true });

export const TransactionModel = mongoose.model("Transaction", TransactionSchema);
