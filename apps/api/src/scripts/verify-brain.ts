import { aiAgentService } from "../services/ai-agent.service.js";
import dotenv from "dotenv";

dotenv.config();

async function testBrain() {
  console.log("--- Testing Unified AI Brain ---");

  const mockContext = {
    merchant: {
      businessName: "Aicha Mode",
      category: "Mode & Beauté",
      city: "Abidjan",
      country: "CI",
      paymentChannels: [
        { label: "Wave", number: "07 01 02 03 04" },
        { label: "Orange Money", number: "01 02 03 04 05" }
      ]
    },
    products: [
      { name: "Robe de Gala", price: 25000, currency: "XOF", description: "Magnifique robe rouge" },
      { name: "Sandales Or", price: 10000, currency: "XOF", availability: "available" }
    ],
    knowledge: {
      businessRules: {
        deliveryZones: ["Cocody", "Plateau", "Marcory"],
        openingHours: "1.500 FCFA"
      },
      customInstructions: "Inculque un sentiment d'urgence."
    },
    history: [],
    message: "Bonjour, quel est le prix de la robe rouge et livrez-vous à Cocody ?"
  };

  try {
    console.log("Query: ", mockContext.message);
    const reply = await aiAgentService.generateResponse(mockContext as any);
    console.log("\nAI Response:\n", reply);

    if (reply.includes("25.000") || reply.includes("25 000")) {
      console.log("\n✅ SUCCESS: Price detected.");
    } else {
      console.log("\n❌ FAILURE: Price missing.");
    }

    if (reply.toLowerCase().includes("cocody")) {
      console.log("✅ SUCCESS: Delivery zone detected.");
    } else {
      console.log("❌ FAILURE: Delivery zone missing.");
    }

    // Test Multi-language
    console.log("\n--- Testing Multi-language (English) ---");
    const engReply = await aiAgentService.generateResponse({
        ...mockContext,
        message: "Hello, do you have gold sandals?"
    } as any);
    console.log("AI Response (English):\n", engReply);

    // Test Global Adaptation (Paris)
    console.log("\n--- Testing Global Adaptation (Paris, France) ---");
    const parisReply = await aiAgentService.generateResponse({
        ...mockContext,
        merchant: {
            ...mockContext.merchant,
            city: "Paris",
            country: "FR",
            businessName: "Luxe Éphémère"
        },
        message: "Bonjour, j'aimerais commander la robe de gala."
    } as any);
    console.log("AI Response (Paris):\n", parisReply);

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testBrain();
