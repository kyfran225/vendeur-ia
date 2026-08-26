import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  merchantId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  entity: "merchant" | "payment" | "system" | "ai" | "user" | "order";
  entityId?: string;
  metadata: any;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: Date;
}

const AuditLogSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant" },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  entity: { type: String, enum: ["merchant", "payment", "system", "ai", "user", "order"], required: true },
  entityId: { type: String },
  metadata: { type: Schema.Types.Mixed },
  severity: { type: String, enum: ["info", "warning", "error", "critical"], default: "info" },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AuditLogModel = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
