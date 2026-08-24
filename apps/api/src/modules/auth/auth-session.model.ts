import mongoose, { Schema, Document } from "mongoose";

export interface IAuthSession extends Document {
  authSessionId: string;
  sessionCode: string;
  phoneNumber: string;
  phoneVariants: string[];
  status: "pending" | "authenticated" | "expired" | "mismatch";
  tokens?: {
    accessToken: string;
    refreshToken: string;
    user: any;
  };
  mismatchPhone?: string;
  mismatchMessage?: string;
  magicToken?: string;
  magicTokenHash?: string;
  otpCode?: string;
  clientUrl?: string;
  createdAt: Date;
  expiresAt: Date;
}

const authSessionSchema = new Schema<IAuthSession>({
  authSessionId: { type: String, required: true, unique: true, index: true },
  sessionCode: { type: String, required: true, index: true },
  phoneNumber: { type: String, required: true, index: true },
  phoneVariants: [{ type: String, index: true }],
  status: { type: String, enum: ["pending", "authenticated", "expired", "mismatch"], default: "pending", index: true },
  tokens: { type: Schema.Types.Mixed },
  mismatchPhone: { type: String },
  mismatchMessage: { type: String },
  magicToken: { type: String },
  magicTokenHash: { type: String, index: true },
  otpCode: { type: String },
  clientUrl: { type: String },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, {
  timestamps: true
});

export const AuthSessionModel = mongoose.model<IAuthSession>("AuthSession", authSessionSchema);
