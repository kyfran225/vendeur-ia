import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  merchantId: string;
  customerId: string;
  status: string;
  lastMessageAt: Date;
}

const ConversationSchema: Schema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  status: { type: String, enum: ["active", "needs_human", "converted", "closed"], default: "active" },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const ConversationModel = mongoose.model<IConversation>("Conversation", ConversationSchema);
