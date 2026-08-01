import "dotenv/config";
import { aiAgentService } from "../services/ai-agent.service.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import mongoose from "mongoose";
import { env } from "../config/env.js";

async function test() {
  await mongoose.connect(env.MONGODB_URI || "mongodb://localhost:27017/vendeur-ia");
  console.log("Connected to MongoDB");

  try {
    const merchant = await CommerceMerchantModel.findOne();
    if (merchant) {
      const knowledge = {
        businessRules: {
          deliveryFees: [
            { zone: "Cocody", price: 1500 },
            { zone: "Yopougon", price: 2000 },
            { zone: "Plateau", price: 1000 }
          ]
        }
      };

      console.log("\n--- Testing Delivery Pricing (Cocody) ---");
      const res1 = await aiAgentService.generateResponse({
        merchant: merchant.toObject() as any,
        products: [{ name: "Robe", price: 15000, availability: "available" }],
        knowledge: knowledge as any,
        history: [],
        message: "C'est combien la livraison pour Cocody ?",
        customerPhone: "22507000000"
      });
      console.log("AI Response:", res1);

      console.log("\n--- Testing Delivery Pricing (Unknown Zone) ---");
      const res2 = await aiAgentService.generateResponse({
        merchant: merchant.toObject() as any,
        products: [{ name: "Robe", price: 15000, availability: "available" }],
        knowledge: knowledge as any,
        history: [],
        message: "Je suis à Korhogo, ça coûte combien ?",
        customerPhone: "22507000000"
      });
      console.log("AI Response:", res2);
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
