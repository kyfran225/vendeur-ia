import mongoose, { Schema } from "mongoose";
const MessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: String, enum: ["customer", "ai", "merchant", "system"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
export const MessageModel = mongoose.model("Message", MessageSchema);
