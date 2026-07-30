import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  conversationId: string;
  sender: "customer" | "ai" | "merchant" | "system";
  content: string;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: String, enum: ["customer", "ai", "merchant", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
