import mongoose from "mongoose";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../services/logger.service.js";
import { UserModel } from "../modules/auth/user.model.js";
import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceCustomerModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceOrderModel,
  MarketingCampaignModel
} from "../modules/commerce/commerce.model.js";
import { TransactionModel } from "../modules/commerce/transaction.model.js";

async function purge() {
  console.log("⚠️  STARTING SELECTIVE PURGE (KEEPING ADMINS)...");

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // 1. Identify all Admin Users
    const admins = await UserModel.find({ roles: "admin" });
    const adminIds = admins.map(admin => admin._id.toString());
    const adminEmails = admins.map(admin => admin.email);

    console.log(`Found ${admins.length} admins to preserve: ${adminEmails.join(", ")}`);

    // 2. Identify all non-admin users
    const nonAdmins = await UserModel.find({ _id: { $nin: adminIds } });
    const nonAdminIds = nonAdmins.map(u => u._id.toString());

    if (nonAdminIds.length === 0) {
      console.log("No non-admin users found. Nothing to delete.");
    } else {
      const deletedEmails = nonAdmins.map(u => u.email).join(", ");
      console.log(`Purging ${nonAdminIds.length} non-admin users: [${deletedEmails}]`);
      console.log("Deleting associated data...");
      const merchants = await CommerceMerchantModel.find({ ownerId: { $in: nonAdminIds } });
      const merchantIds = merchants.map(m => m._id);

      // 4. Delete associated data
      console.log("- Deleting messages...");
      await CommerceMessageModel.deleteMany({
        conversationId: { $in: await CommerceConversationModel.find({ merchantId: { $in: merchantIds } }).distinct("_id") }
      });

      console.log("- Deleting conversations...");
      await CommerceConversationModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting orders...");
      await CommerceOrderModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting customers...");
      await CommerceCustomerModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting products...");
      await CommerceProductModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting knowledge bases...");
      await CommerceKnowledgeModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting marketing campaigns...");
      await MarketingCampaignModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting transactions...");
      await TransactionModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting merchants...");
      await CommerceMerchantModel.deleteMany({ ownerId: { $in: nonAdminIds } });

      console.log("- Deleting user accounts...");
      const userDeleteResult = await UserModel.deleteMany({ _id: { $in: nonAdminIds } });
      console.log(`✅ Successfully deleted ${userDeleteResult.deletedCount} users.`);
    }

    // 5. Redis Cleanup (Optional: clear all caches since a lot of data changed)
    if (env.REDIS_URL) {
      const redis = new Redis(env.REDIS_URL);
      await redis.flushall();
      console.log("✅ Redis cache flushed.");
      await redis.quit();
    }

    console.log("✨ Purge complete. Admin accounts remain intact.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Purge failed:", error);
    process.exit(1);
  }
}

purge();
