import mongoose, { Schema, Document } from "mongoose";

export interface ICopilotMessage extends Document {
  merchantId: mongoose.Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  pageRoute?: string;
  suggestedActions?: Array<{
    type: "navigate" | "modal" | "action" | "founder_alert";
    label: string;
    payload: string;
  }>;
  createdAt: Date;
}

const CopilotMessageSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  pageRoute: { type: String, default: "/dashboard" },
  suggestedActions: [{
    type: { type: String, enum: ["navigate", "modal", "action", "founder_alert"] },
    label: { type: String, required: true },
    payload: { type: String, required: true }
  }]
}, { timestamps: { createdAt: true, updatedAt: false } });

export const CopilotMessageModel = mongoose.model<ICopilotMessage>("CopilotMessage", CopilotMessageSchema);

export interface ICopilotTicket extends Document {
  merchantId: mongoose.Types.ObjectId;
  merchantName: string;
  userEmail: string;
  userPhone: string;
  subject: string;
  message: string;
  category: "suggestion" | "bug" | "founder_message" | "help" | "partnership" | "general";
  priority: "low" | "normal" | "high" | "urgent";
  status: "unread" | "in_progress" | "resolved" | "archived";
  pageRoute?: string;
  adminNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const CopilotTicketSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  merchantName: { type: String, required: true },
  userEmail: { type: String, default: "" },
  userPhone: { type: String, default: "" },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["suggestion", "bug", "founder_message", "help", "partnership", "general"], 
    default: "founder_message" 
  },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
  status: { type: String, enum: ["unread", "in_progress", "resolved", "archived"], default: "unread" },
  pageRoute: { type: String, default: "/dashboard" },
  adminNotes: { type: String, default: "" },
  resolvedAt: { type: Date }
}, { timestamps: true });

export const CopilotTicketModel = mongoose.model<ICopilotTicket>("CopilotTicket", CopilotTicketSchema);
