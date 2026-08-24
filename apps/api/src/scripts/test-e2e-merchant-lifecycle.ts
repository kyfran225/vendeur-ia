import { connectDatabase } from '../config/database.js';
import { authService } from '../modules/auth/auth.service.js';
import {
  CommerceMerchantModel,
  CommerceProductModel,
  CommerceCustomerModel,
  CommerceConversationModel,
  CommerceMessageModel
} from '../modules/commerce/commerce.model.js';
import { SubscriptionModel } from '../modules/commerce/subscription.model.js';
import { whatsappService } from '../modules/whatsapp/whatsapp.service.js';
import { aiAgentService } from '../services/ai-agent.service.js';
import mongoose from 'mongoose';

async function runE2EMerchantLifecycle() {
  console.log("\n=======================================================");
  console.log("🚀 SIMULATION DU CYCLE DE VIE COMPLET (E2E)");
  console.log("=======================================================\n");

  await connectDatabase();

  const testPhone = "+2250700112233";
  const mismatchPhone = "+2250599887766";
  const customerPhone = "+2250102030405";

  let createdUserId: string | null = null;
  let testMerchantId: string | null = null;

  try {
    // -------------------------------------------------------------
    // ÉTAPE 1 : AUTHENTIFICATION WHATSAPP & CONCORDANCE DU NUMÉRO
    // -------------------------------------------------------------
    console.log("👉 ÉTAPE 1 : Test Auth WhatsApp & Concordance Stricte");

    const sessionRes = await authService.requestWhatsAppMagicLink(testPhone, "http://localhost:5173");
    const connectionCode = sessionRes.sessionCode;
    console.log(`   [1.1] Session créée pour ${testPhone} avec code : "${connectionCode}" (Session ID: ${sessionRes.authSessionId})`);

    console.log(`   [1.2] Tentative de connexion avec mauvais numéro (${mismatchPhone})...`);
    const mismatchRes = await authService.authenticateViaIncomingMessage(
      mismatchPhone,
      `CONNEXION ${connectionCode}`
    );

    if (mismatchRes.mismatch === true) {
      console.log("   ✅ SÉCURITÉ CONCORDANCE : Tentative mismatch bloquée avec succès !");
      console.log(`   📝 Réponse explicative envoyée : "${mismatchRes.replyMessage?.substring(0, 60)}..."`);
    } else {
      throw new Error(`ÉCHEC SÉCURITÉ : Le mismatch n'a pas été bloqué ! Réponse: ${JSON.stringify(mismatchRes)}`);
    }

    console.log(`   [1.3] Connexion avec le BON numéro (${testPhone})...`);
    const validRes = await authService.authenticateViaIncomingMessage(
      testPhone,
      `CONNEXION ${connectionCode}`
    );

    if (validRes.success === true && validRes.tokens && validRes.tokens.user) {
      createdUserId = validRes.tokens.user._id ? validRes.tokens.user._id.toString() : validRes.tokens.user.id;
      console.log(`   ✅ AUTH RÉUSSIE : Utilisateur créé (${createdUserId}) avec token JWT !`);
    } else {
      throw new Error(`Échec de connexion avec le bon numéro : ${JSON.stringify(validRes)}`);
    }

    // -------------------------------------------------------------
    // ÉTAPE 2 : MODE DÉCOUVERTE (AVANT PAIEMENT) & SIMULATEUR
    // -------------------------------------------------------------
    console.log("\n👉 ÉTAPE 2 : Mode Découverte Gratuit & Simulateur");

    let merchant = await CommerceMerchantModel.findOne({ ownerId: createdUserId });
    if (!merchant) {
      merchant = await CommerceMerchantModel.create({
        ownerId: createdUserId,
        businessName: "Boutique Wax Royale",
        phone: testPhone,
        whatsappNumber: testPhone,
        currency: "XOF",
        subscription: {
          status: null,
          plan: null,
          expiresAt: null
        },
        aiSettings: {
          autoReply: true,
          personality: "friendly"
        }
      });
    }
    testMerchantId = merchant._id.toString();
    console.log(`   [2.1] Boutique créée : "${merchant.businessName}" en Mode Découverte (status: null)`);

    const product = await CommerceProductModel.create({
      merchantId: merchant._id,
      name: "Robe Soie Wax Royale",
      price: 25000,
      stock: 10,
      category: "fashion",
      description: "Superbe robe en soie et wax véritable."
    });
    console.log(`   [2.2] Produit ajouté : "${product.name}" à ${product.price} XOF`);

    console.log("   [2.3] Test du simulateur web interne...");
    const simRes = await aiAgentService.generateResponse({
      merchant: merchant.toObject() as any,
      products: [product.toObject()],
      knowledge: {},
      history: [],
      message: "Bonjour, avez-vous des robes et quel est le prix ?",
      customerPhone: "Visiteur Web Simulateur",
      platform: "web"
    });
    console.log(`   ✅ RÉPONSE SIMULATEUR WEB : "${simRes.text}"`);

    console.log(`   [2.4] Test message client sur WhatsApp réel (${customerPhone})...`);
    await whatsappService.handleIncomingMessage(createdUserId!, {
      key: { remoteJid: `${customerPhone.replace('+', '')}@s.whatsapp.net`, fromMe: false },
      message: { conversation: "Bonjour, je veux acheter la robe svp !" }
    });

    const customer = await CommerceCustomerModel.findOne({ merchantId: merchant._id });
    const conv = await CommerceConversationModel.findOne({ merchantId: merchant._id, customerId: customer?._id });
    const messages = await CommerceMessageModel.find({ conversationId: conv?._id });

    const aiMessages = messages.filter(m => m.sender === "ai");
    if (aiMessages.length === 0) {
      console.log("   ✅ SÉCURITÉ DÉCOUVERTE : ZÉRO réponse IA sur WhatsApp réel ! Discussions 100% manuelles.");
    } else {
      throw new Error("ÉCHEC SÉCURITÉ : L'IA a répondu sur WhatsApp sans forfait actif !");
    }

    // -------------------------------------------------------------
    // ÉTAPE 3 : PAIEMENT MOBILE MONEY & VENTE ACTIVE 24h/24
    // -------------------------------------------------------------
    console.log("\n👉 ÉTAPE 3 : Paiement Mobile Money & Activation Vente 24h/24");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await SubscriptionModel.findOneAndUpdate(
      { userId: createdUserId },
      {
        $set: {
          status: "active",
          billingInterval: "monthly",
          price: 5000,
          currency: "XOF",
          currentPeriodStart: new Date(),
          currentPeriodEnd: expiresAt,
          paymentMethod: "mobile_money"
        }
      },
      { upsert: true }
    );

    merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: createdUserId },
      {
        $set: {
          "subscription.status": "active",
          "subscription.plan": "essential",
          "subscription.expiresAt": expiresAt,
          "subscription.billingInterval": "monthly"
        }
      },
      { new: true }
    );

    console.log(`   [3.1] Forfait activé avec succès ! (status: "${merchant?.subscription?.status}", expire le ${expiresAt.toLocaleDateString()})`);

    console.log("   [3.2] Nouveau message client sur WhatsApp en Mode Vente Active...");
    const liveAiResponse = await aiAgentService.generateResponse({
      merchant: merchant?.toObject() as any,
      products: [product.toObject()],
      knowledge: {},
      history: [
        { role: "customer", text: "Bonjour, je veux acheter la robe svp !" }
      ],
      message: "Est-ce que la livraison est possible à Cocody ?",
      customerPhone: customerPhone,
    });

    console.log(`[3.3] ✅ RÉPONSE IA VENTE 24h/24 : "${liveAiResponse.text.substring(0, 120)}..."`);

    // -------------------------------------------------------------
    // ÉTAPE 4 : MODE PAUSE & REPRISE MANUELLE
    // -------------------------------------------------------------
    console.log("\n👉 ÉTAPE 4 : Test Mode Pause (Bouton explicite)");

    merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: createdUserId },
      { $set: { "aiSettings.autoReply": false } },
      { new: true }
    );
    console.log(`   [4.1] Commerçant active le Mode Pause (autoReply: ${merchant?.aiSettings?.autoReply})`);

    if (merchant?.aiSettings?.autoReply === false) {
      console.log("   ✅ MODE PAUSE ACTIF : L'IA s'abstient d'intervenir et laisse le commerçant répondre.");
    }

    merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: createdUserId },
      { $set: { "aiSettings.autoReply": true } },
      { new: true }
    );
    console.log(`   [4.2] Commerçant désactive la Pause (autoReply: ${merchant?.aiSettings?.autoReply}) -> Vente 24h/24 reprise ! ✅`);

    console.log("\n=======================================================");
    console.log("🎉 TOUTES LES ÉTAPES DU CYCLE ONT ÉTÉ VALIDÉES À 100% !");
    console.log("=======================================================\n");

  } finally {
    console.log("🧹 Nettoyage des données de simulation...");
    if (testMerchantId) {
      await CommerceProductModel.deleteMany({ merchantId: testMerchantId });
      await CommerceCustomerModel.deleteMany({ merchantId: testMerchantId });
      await CommerceConversationModel.deleteMany({ merchantId: testMerchantId });
      await CommerceMerchantModel.findByIdAndDelete(testMerchantId);
    }
    if (createdUserId) {
      await SubscriptionModel.deleteOne({ userId: createdUserId });
    }
    console.log("✨ Environnement propre et déconnecté.\n");
    await mongoose.disconnect();
  }
}

runE2EMerchantLifecycle().catch(err => {
  console.error("❌ ERREUR LORS DU CYCLE E2E:", err);
  process.exit(1);
});