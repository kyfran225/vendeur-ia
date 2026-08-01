import "dotenv/config";
import { marketingService } from "../services/marketing.service.js";
import {
  CommerceMerchantModel,
  CommerceCustomerModel,
  CommerceProductModel,
  MarketingCampaignModel
} from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function testBroadcastReal() {
  console.log("🚀 Starting Real Diffusion Test...");
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeur-ia");

  try {
    // 1. Setup Test Merchant
    let merchant = await CommerceMerchantModel.findOne({ ownerId: "test_broadcaster" });
    if (!merchant) {
      merchant = await CommerceMerchantModel.create({
        ownerId: "test_broadcaster",
        businessName: "Boutique Test Prod",
        category: "electronics",
        whatsappConfig: { status: "connected", provider: "baileys" }
      });
    }
    const merchantId = merchant._id.toString();

    // 2. Setup Test Product
    let product = await CommerceProductModel.findOne({ merchantId, name: "iPhone 15 Pro Test" });
    if (!product) {
      product = await CommerceProductModel.create({
        merchantId,
        name: "iPhone 15 Pro Test",
        price: 850000,
        currency: "XOF",
        description: "Test de diffusion marketing haute performance.",
        images: ["https://example.com/iphone.jpg"]
      });
    }

    // 3. Setup Test Customers (Simulating a batch)
    console.log("📝 Creating 5 test customers...");
    await CommerceCustomerModel.deleteMany({ merchantId });
    const phones = ["22501010101", "22502020202", "22503030303", "22504040404", "22505050505"];
    for (const phone of phones) {
      await CommerceCustomerModel.create({
        merchantId,
        phone,
        name: `Client ${phone.slice(-2)}`,
        loyaltyPoints: 10
      });
    }

    // 4. Launch Broadcast
    console.log("🔥 Launching Broadcast to 5 customers...");
    const result = await marketingService.launchBroadcast(
      merchantId,
      product._id.toString(),
      "all",
      "Bonjour {{name}} ! Profitez de notre promo exclusive sur le iPhone 15 Pro. Répondez vite ! ✨🚀"
    );

    console.log(`✅ Broadcast queued successfully: ${result.count} messages.`);
    console.log(`📊 Campaign ID: ${result.campaignId}`);

    // 5. Verify Queue Status
    const campaign = await MarketingCampaignModel.findById(result.campaignId);
    console.log("📈 Initial Campaign Status:", {
      status: campaign?.status,
      target: campaign?.targetCount,
      sent: campaign?.sentCount
    });

    console.log("\n[INFO] Test setup complete.");
    console.log("[INFO] The messages are now in the BullMQ queue with a 30s delay between each.");
    console.log("[INFO] To verify completion, check the API logs or run: pnpm ts-node src/scripts/verify-queue.ts");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testBroadcastReal();
