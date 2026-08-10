import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  offerId: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'scheduled_change' | 'payment_failed';
  billingInterval: 'monthly' | 'yearly';
  price: number;
  currency: string;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date | null;
  paymentMethod: 'card' | 'mobile_money' | 'unknown';
  provider: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  cancellationRequestedAt: Date | null;
  cancelledAt: Date | null;
  scheduledOfferId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'past_due', 'cancelled', 'expired', 'scheduled_change', 'payment_failed'],
    default: 'pending'
  },
  billingInterval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  price: { type: Number, required: true },
  currency: { type: String, default: 'XOF' },
  startDate: { type: Date, default: Date.now },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date },
  nextBillingDate: { type: Date, default: null },
  paymentMethod: { type: String, enum: ['card', 'mobile_money', 'unknown'], default: 'unknown' },
  provider: { type: String, default: 'paystack' },
  providerCustomerId: { type: String },
  providerSubscriptionId: { type: String },
  cancellationRequestedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  scheduledOfferId: { type: Schema.Types.ObjectId, ref: "Offer", default: null }
}, { timestamps: true });

export const SubscriptionModel = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
