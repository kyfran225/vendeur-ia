import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  email: { type: String, sparse: true, unique: true, lowercase: true, trim: true, index: true },
  whatsappNumber: { type: String, sparse: true, unique: true, trim: true, index: true },
  authProvider: { type: String, enum: ["email", "google", "whatsapp"], default: "email" },
  passwordHash: { type: String },
  googleId: { type: String, sparse: true, unique: true, index: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String },
  roles: [{ type: String, enum: ["user", "admin", "creator"], default: ["user"] }],
  refreshTokenHash: { type: String },
  emailVerifiedAt: { type: Date },
  emailVerificationTokenHash: { type: String, index: true },
  emailVerificationExpiresAt: { type: Date },
  passwordResetTokenHash: { type: String, index: true },
  passwordResetExpiresAt: { type: Date },
  otpCodeHash: { type: String },
  otpExpiresAt: { type: Date },
  onboardingCompleted: { type: Boolean, default: false },
  lastSeenAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const UserModel = mongoose.model("User", userSchema);
