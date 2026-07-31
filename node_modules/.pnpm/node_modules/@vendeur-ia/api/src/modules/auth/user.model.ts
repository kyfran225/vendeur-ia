import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String },
  googleId: { type: String, sparse: true, unique: true, index: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String },
  roles: [{ type: String, enum: ["user", "admin"], default: ["user"] }],
  refreshTokenHash: { type: String },
  onboardingCompleted: { type: Boolean, default: false },
  lastSeenAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const UserModel = mongoose.model("User", userSchema);
