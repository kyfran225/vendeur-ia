import "dotenv/config";
import { MarketingCampaignModel, CommerceMessageModel } from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function verify() {
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeur-ia");

  try {
    const campaignId = "6a6e2c9fa1f9a6f6d38bd3d8"; // From previous output
    const campaign = await MarketingCampaignModel.findById(campaignId);

    console.log(`\n--- Campaign Progress (${campaignId}) ---`);
    console.log(`Status: ${campaign?.status}`);
    console.log(`Progress: ${campaign?.sentCount} / ${campaign?.targetCount}`);

    const messages = await CommerceMessageModel.find({
        sender: "ai",
        content: /Bonjour.*Promo.*exclusive/i
    }).sort({ timestamp: -1 });

    console.log(`\n--- Sent Messages (${messages.length}) ---`);
    messages.forEach((m, i) => {
        console.log(`[${i+1}] Sent at: ${m.timestamp.toISOString()} to conversation ${m.conversationId}`);
    });

    if (messages.length > 1) {
        const diff = (messages[0].timestamp.getTime() - messages[1].timestamp.getTime()) / 1000;
        console.log(`\n⏱️ Last interval: ${Math.abs(diff)}s (Target: 30s)`);
    }

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
