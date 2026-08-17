// revoke-admin.ts
import mongoose from "mongoose";
import { UserModel } from "../modules/auth/user.model.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { env } from "../config/env.js";

async function revokeAdmin(targetEnv: string, email: string, deleteMerchant: boolean = false) {
  if (!targetEnv || !email) {
    console.error("Usage: pnpm tsx src/scripts/revoke-admin.ts <dev|preview|prod|uri> <user_email> [--delete-merchant]");
    process.exit(1);
  }

  let mongoUri = "";
  const envKey = targetEnv.toLowerCase();

  if (envKey === "dev" || envKey === "local") {
    mongoUri = env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local";
  } else if (envKey === "preview") {
    mongoUri = process.env.PREVIEW_MONGODB_URI || "";
    if (!mongoUri) {
        console.error("❌ Erreur: PREVIEW_MONGODB_URI non définie.");
        process.exit(1);
    }
  } else if (envKey === "prod" || envKey === "production") {
    mongoUri = process.env.PROD_MONGODB_URI || "";
    if (!mongoUri) {
        console.error("❌ Erreur: PROD_MONGODB_URI non définie.");
        process.exit(1);
    }
  } else if (envKey.startsWith("mongodb")) {
    mongoUri = targetEnv;
  } else {
    console.error(`❌ Invalid environment: ${targetEnv}`);
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    await mongoose.connect(mongoUri);
    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      console.warn(`User ${cleanEmail} not found.`);
      await mongoose.disconnect();
      return;
    }
    // Remove admin role if present
    user.roles = user.roles.filter((r) => r !== "admin");
    await user.save();
    console.log(`Removed 'admin' role from ${cleanEmail}. Current roles: ${user.roles.join(', ')}`);

    if (deleteMerchant) {
      const merchant = await CommerceMerchantModel.findOne({ ownerId: user._id });
      if (merchant) {
        await CommerceMerchantModel.deleteOne({ _id: merchant._id });
        console.log(`Deleted merchant profile '${merchant.businessName}' for ${cleanEmail}.`);
      } else {
        console.log(`No merchant profile found for ${cleanEmail}.`);
      }
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error revoking admin:", err);
    process.exit(1);
  }
}

const targetEnv = process.argv[2];
const emailArg = process.argv[3];
const deleteFlag = process.argv.includes("--delete-merchant");
revokeAdmin(targetEnv, emailArg, deleteFlag);
