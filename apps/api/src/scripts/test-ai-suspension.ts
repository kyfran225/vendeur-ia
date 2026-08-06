import { connectDatabase } from "../config/database.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { aiAgentService } from "../services/ai-agent.service.js";
import mongoose from "mongoose";

async function test() {
  await connectDatabase();
  console.log("🚀 Testing AI Suspension...");

  // 1. Setup suspended merchant
  const merchant = await CommerceMerchantModel.findOneAndUpdate(
    { ownerId: "suspended-user-test" },
    {
      businessName: "Suspended Shop",
      subscription: {
        status: "past_due",
        expiresAt: new Date(Date.now() - 86400000)
      }
    },
    { upsert: true, new: true }
  );

  // 2. Mock AI Request context
  const context: any = {
    merchant: {
      businessName: merchant.businessName,
      subscription: merchant.subscription
    },
    message: "Bonjour, je veux acheter un truc",
    history: []
  };

  // 3. Generate response
  console.log("⏳ Requesting AI response for suspended merchant...");
  const response = await aiAgentService.generateResponse(context);

  console.log(`🤖 AI Response: "${response.text}"`);

  if (response.text.includes("suspendu") || response.text.includes("abonnement")) {
    console.log("✅ SUCCESS: AI correctly blocked/warned about suspension.");
  } else {
    console.log("❌ FAILED: AI should have blocked the request.");
  }

  mongoose.connection.close();
}

test().catch(console.error);
