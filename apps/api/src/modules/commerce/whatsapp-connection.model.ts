import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppConnection extends Document {
  userId: string;
  phoneNumber: string;
  status: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'RECONNECTING';
  connectionType: 'baileys' | 'meta';
  connectedAt: Date | null;
  disconnectedAt: Date | null;
  lastSeenAt: Date | null;
  errorCode: string;
  errorMessage: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppConnectionSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String },
  status: {
    type: String,
    enum: ['NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'DISCONNECTED', 'ERROR', 'RECONNECTING'],
    default: 'NOT_CONNECTED'
  },
  connectionType: { type: String, enum: ['baileys', 'meta'], default: 'meta' },
  connectedAt: { type: Date, default: null },
  disconnectedAt: { type: Date, default: null },
  lastSeenAt: { type: Date, default: null },
  errorCode: { type: String },
  errorMessage: { type: String },
  metadata: Schema.Types.Mixed
}, { timestamps: true });

export const WhatsAppConnectionModel = mongoose.model<IWhatsAppConnection>("WhatsAppConnection", WhatsAppConnectionSchema);
