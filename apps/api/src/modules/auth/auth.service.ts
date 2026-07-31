import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { UserModel } from "./user.model.js";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  async generateTokens(user: any) {
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await UserModel.findByIdAndUpdate(user._id, { refreshTokenHash });

    return { accessToken, refreshToken };
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
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid Google token");

    let user = await UserModel.findOne({ email: payload.email });
    if (!user) {
      user = await UserModel.create({
        email: payload.email,
        googleId: payload.sub,
        displayName: payload.name,
        avatarUrl: payload.picture,
        onboardingCompleted: false,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatarUrl = payload.picture;
      await user.save();
    }

    return this.generateTokens(user);
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
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
}

export const authService = new AuthService();
