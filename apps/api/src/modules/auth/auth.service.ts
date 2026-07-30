import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { MerchantModel } from "../merchant.model.js";

export class AuthService {
  async register(email: string, password: string, businessName: string, category: string, city: string) {
    const merchant = await MerchantModel.create({
      ownerId: email.toLowerCase(),
      businessName,
      category,
      city,
      subscription: { plan: "starter", status: "trial" }
    });

    const token = jwt.sign({ id: merchant._id, email }, env.JWT_SECRET, { expiresIn: "30d" });
    return { merchant, token };
  }

  async login(email: string, password: string) {
    const merchant = await MerchantModel.findOne({ ownerId: email.toLowerCase() });
    if (!merchant) throw new Error("Merchant not found");
    const token = jwt.sign({ id: merchant._id, email }, env.JWT_SECRET, { expiresIn: "30d" });
    return { merchant, token };
  }
}

export const authService = new AuthService();
