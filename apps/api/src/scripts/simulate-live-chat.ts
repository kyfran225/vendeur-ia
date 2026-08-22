import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { aiAgentService } from "../services/ai-agent.service.js";

async function runLiveSimulation() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendeuria-local";
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connecté à MongoDB");
  } catch (err) {
    console.warn("MongoDB local non connecté, utilisation config par défaut.");
  }

  console.log("=================================================================");
  console.log("   🧪 SIMULATION EN DIRECT : VENDEUR IA (WHATSAPP CLOUD)        ");
  console.log("=================================================================\n");

  const merchantContext = {
    merchant: {
      businessName: "Boutique Élégance Abidjan",
      category: "Mode & Prêt-à-porter",
      city: "Abidjan",
      country: "CI",
      paymentChannels: [
        { label: "Wave", number: "+2250701020304" },
        { label: "Orange Money", number: "+2250102030405" }
      ]
    },
    products: [
      {
        name: "Robe de Gala Soie",
        price: 25000,
        currency: "XOF",
        description: "Robe de soirée élégante en soie rouge et dorée. Tailles S, M, L.",
        availability: "available"
      },
      {
        name: "Sac à main Cuir Luxe",
        price: 15000,
        currency: "XOF",
        description: "Sac à main noir haute qualité avec finitions dorées.",
        availability: "available"
      }
    ],
    knowledge: {
      businessRules: {
        deliveryZones: ["Cocody (1 500 FCFA)", "Plateau (1 000 FCFA)", "Yopougon (2 000 FCFA)"],
        openingHours: "Lundi au Samedi de 8h30 à 19h00"
      },
      customInstructions: "Sois chaleureux, poli, utilise le tutoiement ou vouvoiement professionnel ivoirien et guide vers l'achat."
    }
  };

  const turns = [
    "Bonjour ! Quels sont vos articles disponibles et vos tarifs ?",
    "J'adore la Robe de Gala Soie en taille M ! Vous pouvez me livrer à Cocody aujourd'hui ?",
    "Parfait ! Je paye par Wave. Mon adresse est Cocody Angré 8ème tranche, tél: 0708091011. Je valide !"
  ];

  const history: Array<{ role: "user" | "model"; text: string }> = [];

  for (let i = 0; i < turns.length; i++) {
    const userMsg = turns[i];
    console.log(`\n📱 [CLIENT WHATSAPP]:`);
    console.log(`"${userMsg}"`);

    const context = {
      ...merchantContext,
      history: [...history],
      message: userMsg
    };

    const startTime = Date.now();
    const aiResponse = await aiAgentService.generateResponse(context as any);
    const duration = Date.now() - startTime;

    console.log(`\n🤖 [VENDEUR IA] (${duration}ms) :`);
    console.log(aiResponse.text);
    console.log("-----------------------------------------------------------------");

    history.push({ role: "user", text: userMsg });
    history.push({ role: "model", text: aiResponse.text });
  }

  console.log("\n✅ Simulation terminée avec succès !");
  await mongoose.disconnect();
  process.exit(0);
}

runLiveSimulation().catch((err) => {
  console.error(err);
  process.exit(1);
});
