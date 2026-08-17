import "dotenv/config";
import { commerceService } from "../modules/commerce/commerce.service.js";
import { CommerceProductModel, CommerceConversationModel, CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function test() {
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local");
  console.log("Connected to MongoDB");

  try {
    // 1. Test Caption Generation
    console.log("\n--- Testing Caption Generation ---");
    const product = await CommerceProductModel.findOne();
    if (product) {
      console.log(`Generating caption for product: ${product.name}`);
      const result = await commerceService.generateProductCaption(product._id.toString());
      console.log("Generated Caption:", result.caption);
    } else {
      console.log("No product found to test caption generation.");
    }

    // 2. Test Conversation Status Update (Takeover)
    console.log("\n--- Testing Takeover Toggle ---");
    let conversation = await CommerceConversationModel.findOne();
    if (conversation) {
      console.log(`Current status of conversation ${conversation._id}: ${conversation.status}`);
      const newStatus = conversation.status === "needs_human" ? "active" : "needs_human";

      conversation.status = newStatus as any;
      await conversation.save();

      const updatedConv = await CommerceConversationModel.findById(conversation._id);
      console.log(`Updated status: ${updatedConv?.status}`);

      if (updatedConv?.status === newStatus) {
        console.log("✅ Status update successful.");
      } else {
        console.log("❌ Status update failed.");
      }
    } else {
      console.log("No conversation found to test status update.");
    }

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
