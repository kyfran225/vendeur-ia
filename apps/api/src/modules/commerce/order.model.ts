import mongoose, { Schema } from "mongoose";

const OrderSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "CommerceCustomer", required: true, index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: "CommerceConversation" },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "CommerceProduct" },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: "XOF" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "paid", "delivered", "cancelled"],
    default: "pending"
  },
  paymentMethod: String,
  shippingAddress: String,
  paidAt: Date,
  deliveredAt: Date
}, { timestamps: true });

export const CommerceOrderModel = mongoose.model("CommerceOrder", OrderSchema);
