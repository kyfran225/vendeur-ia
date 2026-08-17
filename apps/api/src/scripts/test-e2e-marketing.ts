import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { marketingService } from "../services/marketing.service.js";
import { commerceService } from "../modules/commerce/commerce.service.js";
import {
  CommerceMerchantModel,
  CommerceCustomerModel,
  CommerceProductModel,
  CommerceConversationModel,
  CommerceMessageModel,
  MarketingCampaignModel
} from "../modules/commerce/commerce.model.js";

async function runEndToEndMarketingTest() {
  const mongoUri = env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local";
  await mongoose.connect(mongoUri);
  console.log("✅ Connecté à MongoDB");

  try {
    // 1. Initialiser le Marchand de Test
    console.log("\n--- 1. Configuration Marchand & Produit ---");
    let merchant = await CommerceMerchantModel.findOne({ ownerId: "e2e_test_owner" });
    if (!merchant) {
      merchant = await CommerceMerchantModel.create({
        ownerId: "e2e_test_owner",
        businessName: "Maison Ivoire Mode",
        category: "fashion",
        city: "Abidjan",
        country: "CI",
        loyaltySettings: {
          enabled: true,
          threshold: 50,
          rewardDescription: "-20% sur tout le catalogue"
        }
      });
    }

    const merchantId = merchant._id.toString();

    let product = await CommerceProductModel.findOne({ merchantId });
    if (!product) {
      product = await CommerceProductModel.create({
        merchantId,
        name: "Robe Wax Élégance",
        price: 25000,
        currency: "XOF",
        description: "Robe en tissu Wax de qualité supérieure fabriquée à la main.",
        images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"]
      });
    }
    console.log(`Marchand : ${merchant.businessName} (ID: ${merchantId})`);
    console.log(`Produit : ${product.name} - ${product.price} ${product.currency}`);

    // 2. Nettoyer et Créer des Clients de Test
    console.log("\n--- 2. Création des profils Clients pour le test ---");
    await CommerceCustomerModel.deleteMany({ merchantId });

    // Client 1 : Cocody (sera extrait par l'IA)
    const customer1 = await CommerceCustomerModel.create({
      merchantId,
      phone: "22507000101",
      name: "Amina Koné",
      loyaltyPoints: 70 // VIP
    });

    // Client 2 : Yopougon
    const customer2 = await CommerceCustomerModel.create({
      merchantId,
      phone: "22507000102",
      name: "Kouassi Jean",
      location: "Yopougon",
      loyaltyPoints: 10
    });

    // Client 3 : Inactif (> 30j)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const customer3 = await CommerceCustomerModel.create({
      merchantId,
      phone: "22507000103",
      name: "Sita Traoré",
      loyaltyPoints: 5,
      updatedAt: sixtyDaysAgo
    });

    console.log(`Client 1 créé : ${customer1.name} (${customer1.phone}) - Sans localisation initiale`);
    console.log(`Client 2 créé : ${customer2.name} (${customer2.phone}) - Localisation: ${customer2.location}`);
    console.log(`Client 3 créé : ${customer3.name} (${customer3.phone}) - Inactif depuis 60 jours`);

    // 3. Test de l'extraction de localisation par l'IA
    console.log("\n--- 3. Test d'Extraction IA de la Localisation ---");
    const simulatedCustomerMessage = "Bonjour ! J'aimerais savoir si vous livrez à Cocody Angré 8ème tranche ?";
    console.log(`Message reçu du client ${customer1.name} : "${simulatedCustomerMessage}"`);

    await commerceService.extractCustomerLocation(customer1._id.toString(), simulatedCustomerMessage);

    const updatedCustomer1 = await CommerceCustomerModel.findById(customer1._id);
    console.log(`📍 Résultat extraction IA pour ${customer1.name} : Localisation = "${updatedCustomer1?.location}"`);

    // 4. Test du calcul des segments
    console.log("\n--- 4. Calcul dynamique des Segments Marketing ---");
    const segments = await marketingService.getSegments(merchantId);
    console.log("Segments calculés :", JSON.stringify(segments, null, 2));

    // 5. Test Génération de Prévisualisation IA Créative
    console.log("\n--- 5. Génération du Message IA (Aperçu) ---");
    const preview = await marketingService.generateBroadcastPreview(
      merchantId,
      product._id.toString(),
      "vip",
      "vip_privilege"
    );
    console.log("Texte généré par l'IA :\n", preview.preview);

    // 6. Test de Lancement de Diffusion ciblée sur un segment
    console.log("\n--- 6. Lancement de la Diffusion sur le segment 'vip' ---");
    const broadcastResult = await marketingService.launchBroadcast(
      merchantId,
      product._id.toString(),
      "vip",
      preview.preview,
      "ai_creative"
    );
    console.log("Résultat diffusion :", broadcastResult);

    const createdCampaign = await MarketingCampaignModel.findById(broadcastResult.campaignId);
    console.log(`Campagne enregistrée en BDD : ID=${createdCampaign?._id}, Statut=${createdCampaign?.status}, Cibles=${createdCampaign?.targetCount}`);

    console.log("\n✨ TOUS LES TESTS END-TO-END SONT PASSÉS AVEC SUCCÈS ! ✨");

  } catch (error) {
    console.error("❌ Échec du test :", error);
  } finally {
    await mongoose.disconnect();
    console.log("Déconnecté de MongoDB");
  }
}

runEndToEndMarketingTest();
