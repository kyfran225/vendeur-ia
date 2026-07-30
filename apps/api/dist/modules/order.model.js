import mongoose, { Schema } from "mongoose";
import { commerceOrderStatuses, commercePaymentStatuses, commercePaymentProviders } from "@vendeur-ia/core";
const OrderSchema = new Schema({
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [{
            productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 }
        }],
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "XOF" },
    status: { type: String, enum: commerceOrderStatuses, default: "pending" },
    paymentStatus: { type: String, enum: commercePaymentStatuses, default: "waiting" },
    paymentProvider: { type: String, enum: commercePaymentProviders },
    deliveryAddress: { type: String }
}, { timestamps: true });
export const OrderModel = mongoose.model("Order", OrderSchema);
