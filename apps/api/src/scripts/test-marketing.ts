import "dotenv/config";
import { marketingService } from "../services/marketing.service.js";
import { CommerceMerchantModel, CommerceCustomerModel, CommerceProductModel } from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function test() {
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeur-ia");
  console.log("Connected to MongoDB");

  try {
    let merchant = await CommerceMerchantModel.findOne({ ownerId: "mock_owner" });
    if (!merchant) {
      merchant = await CommerceMerchantModel.create({
        ownerId: "mock_owner",
        businessName: "Boutique de Test",
        category: "fashion"
      });
    }

    const merchantId = merchant._id.toString();

    // 1. Create mock customers for segments
    console.log("Creating mock customers...");
    await CommerceCustomerModel.deleteMany({ merchantId });

    // VIP
    await CommerceCustomerModel.create({
      merchantId,
      phone: "22507000001",
      loyaltyPoints: 100
    });

    // Active (Recent)
    await CommerceCustomerModel.create({
      merchantId,
      phone: "22507000002",
      loyaltyPoints: 10,
      updatedAt: new Date()
    });

    // 2. Test Segmentation
    console.log("\n--- Testing Segmentation ---");
    const segments = await marketingService.getSegments(merchantId);
    console.log("Segments found:", segments);

    // 3. Test Preview
    console.log("\n--- Testing Preview Generation ---");
    let product = await CommerceProductModel.findOne({ merchantId });
    if (!product) {
        product = await CommerceProductModel.create({
            merchantId,
            name: "Basket Air Max",
            price: 45000,
            currency: "XOF"
        });
    }

    const preview = await marketingService.generateBroadcastPreview(merchantId, product._id.toString(), "vip");
    console.log("AI Preview for VIP:", preview.preview);

    // 4. Test Launch Broadcast (Queueing)
    console.log("\n--- Testing Broadcast Launch ---");
    const result = await marketingService.launchBroadcast(merchantId, product._id.toString(), "all", "Découvrez notre nouveau produit en promotion !");
    console.log(`Launched to ${result.count} customers.`);
    console.log("Check ai-processing queue for results.");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
