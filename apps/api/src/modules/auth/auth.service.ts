import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { UserModel } from "./user.model.js";
import { authEmailService } from "./auth-email.service.js";
import axios from "axios";
import { randomBytes, createHash } from "node:crypto";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class AuthService {
  async generateTokens(user: any) {
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      env.JWT_REFRESH_SECRET || env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await UserModel.findByIdAndUpdate(user._id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        onboardingCompleted: !!user.onboardingCompleted
      }
    };
  }

  async register(input: any) {
    const { email, password, displayName } = input;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) throw new Error("Email already registered");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email,
      passwordHash,
      displayName,
    });

    return this.generateTokens(user);
  }

  async login(input: any) {
    const { email, password } = input;
    const user = await UserModel.findOne({ email });
    if (!user || !user.passwordHash) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error("Invalid credentials");

    return this.generateTokens(user);
  }

  async verifyGoogleToken(token: string) {
    let payload;

    try {
      // Try verifying as ID Token (JWT)
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (e) {
      // If failed, try as Access Token by calling Google UserInfo API
      try {
        const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` }
        });
        payload = {
          email: res.data.email,
          sub: res.data.sub,
          name: res.data.name,
          picture: res.data.picture
        };
      } catch (err) {
        throw new Error("Invalid Google token (Access Token check failed)");
      }
    }

    if (!payload || !payload.email) throw new Error("Invalid Google token payload");

    // Check if email is verified (only if using ID Token which usually includes this)
    if ((payload as any).email_verified === false) {
      throw new Error("Google email not verified");
    }

    let user = await UserModel.findOne({ email: payload.email });
    if (!user) {
      user = await UserModel.create({
        email: payload.email,
        googleId: payload.sub,
        displayName: payload.name || "Utilisateur Google",
        avatarUrl: payload.picture,
        onboardingCompleted: false,
        emailVerifiedAt: new Date(), // Google emails are considered verified
      });
    } else {
      // Sync Google info if not already present
      let changed = false;
      if (!user.googleId) {
        user.googleId = payload.sub;
        changed = true;
      }
      if (!user.avatarUrl && payload.picture) {
        user.avatarUrl = payload.picture;
        changed = true;
      }
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = new Date();
        changed = true;
      }
      if (changed) await user.save();
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET || env.JWT_SECRET) as any;
      const user = await UserModel.findById(decoded.id);
      if (!user || !user.refreshTokenHash) throw new Error("Invalid token");

      const isMatch = await bcrypt.compare(token, user.refreshTokenHash);
      if (!isMatch) throw new Error("Invalid token");

      return this.generateTokens(user);
    } catch (err) {
      throw new Error("Invalid token");
    }
  }

  async logout(userId: string) {
    await UserModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  }

  async forgotPassword(email: string) {
    const user = await UserModel.findOne({ email });
    if (!user) return; // Silent return for security

    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");

    user.passwordResetTokenHash = hash;
    user.passwordResetExpiresAt = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await authEmailService.sendPasswordResetEmail({
      to: user.email,
      displayName: user.displayName,
      token
    });
  }

  async resetPassword(token: string, password: any) {
    const hash = createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user) throw new Error("Invalid or expired reset token");

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
  }

  async sendEmailVerification(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user || user.emailVerifiedAt) return;

    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");

    user.emailVerificationTokenHash = hash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 86400000); // 24 hours
    await user.save();

    await authEmailService.sendVerificationEmail({
      to: user.email,
      displayName: user.displayName,
      token
    });
  }

  async verifyEmail(token: string) {
    const hash = createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: { $gt: new Date() }
    });

    if (!user) throw new Error("Invalid or expired verification token");

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true }
    );
    if (!user) throw new Error("User not found");

    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      onboardingCompleted: !!user.onboardingCompleted
    };
  }
}

export const authService = new AuthService();
