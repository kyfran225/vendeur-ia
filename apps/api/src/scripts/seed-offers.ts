import mongoose from "mongoose";
import { OfferModel } from "../modules/commerce/offer.model.js";
import { env } from "../config/env.js";

const OFFERS = [
  {
    slug: "essential",
    name: "Vendeur IA Essentiel",
    description: "Votre vendeur IA pour WhatsApp. Un vendeur IA qui répond à vos clients, présente vos produits et vous aide à vendre automatiquement.",
    monthlyPrice: 5000,
    currency: "XOF",
    features: [
      "Réponses automatiques",
      "Catalogue produits",
      "Compréhension des questions clients",
      "Présentation des produits",
      "Assistance commerciale",
      "Disponibilité 24h/24",
      "Utilisation avec WhatsApp"
    ],
    isActive: true,
    sortOrder: 1,
    setupRequired: false,
    setupOptions: [
      { type: "SELF_SERVICE", price: 0, label: "Je le fais moi-même" }
    ]
  },
  {
    slug: "pro",
    name: "Vendeur IA Pro",
    description: "Pour les vendeurs qui veulent une expérience plus avancée.",
    monthlyPrice: 20000, // Example price, spec says to verify
    currency: "XOF",
    features: [
      "Tout Essentiel",
      "Connexion professionnelle (Meta API)",
      "Fonctionnalités avancées",
      "Support prioritaire",
      "Accompagnement"
    ],
    isActive: true,
    sortOrder: 2,
    setupRequired: true,
    setupOptions: [
      { type: "SELF_SERVICE", price: 0, label: "Je le fais moi-même" },
      { type: "EXPERT", price: 25000, label: "Faites-le pour moi (Installation Expert)" }
    ]
  }
];

async function seed() {
  console.log("Seed offers starting...");
  if (!env.MONGODB_URI) {
    console.error("MONGODB_URI not found");
    return;
  }

  await mongoose.connect(env.MONGODB_URI);

  for (const offer of OFFERS) {
    await OfferModel.findOneAndUpdate(
      { slug: offer.slug },
      offer,
      { upsert: true, new: true }
    );
    console.log(`Offer ${offer.slug} seeded.`);
  }

  await mongoose.disconnect();
  console.log("Seed offers completed.");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
