import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { UserModel } from '../modules/auth/user.model.js';
import { CommerceMerchantModel, CommerceKnowledgeModel, CommerceProductModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel } from '../modules/commerce/commerce.model.js';

async function configureDatabase(uri: string, envName: string) {
  try {
    console.log(`\n========================================`);
    console.log(`Connecting to ${envName.toUpperCase()} MongoDB (${uri.substring(0, 25)}...)...`);
    await mongoose.connect(uri);

    const canonicalPhone = "+2250505111157";
    const rawCleanPhone = "2250505111157";
    const email = 'kyfran6@gmail.com';
    const founderDisplayName = "Franck (Co-Fondateur & Lead)";

    // 1. Find or create founder users
    let user = await UserModel.findOne({
      $or: [
        { whatsappNumber: { $regex: '5111157' } },
        { email: { $regex: '5111157' } },
        { email }
      ]
    });

    if (!user) {
      console.log(`[${envName}] Creating new founder user...`);
      const passwordHash = await bcrypt.hash('admin123', 10);
      user = await UserModel.create({
        email,
        whatsappNumber: rawCleanPhone,
        passwordHash,
        displayName: founderDisplayName,
        roles: ['user', 'admin', 'creator'],
        onboardingCompleted: true
      });
    } else {
      console.log(`[${envName}] Updating existing founder user: ${user.email || user.whatsappNumber}...`);
      user.roles = ['user', 'admin', 'creator'];
      user.displayName = founderDisplayName;
      user.onboardingCompleted = true;
      user.whatsappNumber = rawCleanPhone;
      if (!user.email) user.email = email;
      await user.save();
    }

    // 2. Find or create merchant profile for Vendeur IA
    let merchant = await CommerceMerchantModel.findOne({
      $or: [
        { ownerId: user._id },
        { whatsappNumber: { $regex: '5111157' } },
        { phone: { $regex: '5111157' } }
      ]
    });

    const metaPhoneId = env.WHATSAPP_PHONE_ID || "1283754474826620";

    const merchantData = {
      ownerId: user._id,
      businessName: 'Vendeur IA',
      slug: 'vendeur-ia',
      category: 'services' as const,
      description: "Plateforme et assistant commercial IA sur WhatsApp pour automatiser les ventes, le support et les paiements Mobile Money en Afrique.",
      city: 'Abidjan',
      country: 'CI',
      address: "Abidjan, Côte d'Ivoire",
      phone: canonicalPhone,
      whatsappNumber: canonicalPhone,
      currency: 'XOF',
      language: 'fr' as const,
      onboardingCompleted: true,
      whatsappConfig: {
        provider: 'meta' as const,
        status: 'connected' as const,
        phoneNumberId: metaPhoneId,
        meta: {
          phoneNumberId: metaPhoneId,
          accessToken: env.WHATSAPP_ACCESS_TOKEN || ''
        }
      },
      paymentChannels: [
        { provider: 'wave' as const, label: 'Wave', number: canonicalPhone },
        { provider: 'mtn_momo' as const, label: 'MTN MoMo', number: canonicalPhone }
      ],
      aiSettings: {
        personality: 'premium' as const,
        responseStyle: 'normal' as const,
        autoReply: true,
        weeklyReport: true
      }
    };

    if (!merchant) {
      console.log(`[${envName}] Creating merchant profile for Vendeur IA...`);
      merchant = await CommerceMerchantModel.create(merchantData);
    } else {
      console.log(`[${envName}] Updating merchant profile to Vendeur IA...`);
      Object.assign(merchant, merchantData);
      await merchant.save();
    }

    // 3. Clean up any dummy/fashion mock products (like "Sac à main") and insert real Vendeur IA offers
    const deleteResult = await CommerceProductModel.deleteMany({
      merchantId: merchant._id
    });
    console.log(`[${envName}] Cleared ${deleteResult.deletedCount} old products.`);

    const products = await CommerceProductModel.create([
      {
        merchantId: merchant._id,
        name: "Abonnement Vendeur IA - Pack Pro",
        price: 25000,
        currency: "XOF",
        stock: 999,
        availability: "available",
        category: "services",
        isService: true,
        description: "Assistant commercial IA WhatsApp 24/7 illimité, validation automatique des captures Wave/MTN/Orange par Shield OCR, relances automatiques et intégration CRM."
      },
      {
        merchantId: merchant._id,
        name: "Abonnement Vendeur IA - Pack Essential",
        price: 15000,
        currency: "XOF",
        stock: 999,
        availability: "available",
        category: "services",
        isService: true,
        description: "IA commerciale WhatsApp pour petite boutique, catalogue jusqu'à 50 produits, gestion des commandes et alertes ventes."
      },
      {
        merchantId: merchant._id,
        name: "Configuration & Déploiement Clé en main (Pack Pro Setup)",
        price: 25000,
        currency: "XOF",
        stock: 999,
        availability: "available",
        category: "services",
        isService: true,
        description: "Mise en service complète par nos experts : intégration WhatsApp Meta, saisie du catalogue, entraînement sur-mesure de l'IA et tests en direct."
      }
    ]);
    console.log(`[${envName}] Created ${products.length} Vendeur IA services & products.`);

    // 4. Update Knowledge Base for Vendeur IA
    let knowledge = await CommerceKnowledgeModel.findOne({ merchantId: merchant._id });
    const knowledgeData = {
      merchantId: merchant._id,
      businessName: 'Vendeur IA',
      generalKnowledge: "Vendeur IA est la solution d'intelligence artificielle leader en Afrique pour automatiser les ventes et le support client sur WhatsApp. L'IA accueille vos prospects, présente votre catalogue, répond aux questions 24h/24, prend les commandes, valide les paiements Mobile Money (Wave, MTN, Orange, Moov) par scan OCR et relance les paniers abandonnés.",
      businessRules: {
        openingHours: "24h/24 - 7j/7 (Service automatisé par IA)",
        deliveryZones: ["Côte d'Ivoire", "Sénégal", "Bénin", "Togo", "Burkina Faso", "Mali", "Cameroun", "Afrique & International"],
        paymentMethods: [
          { provider: 'Wave', number: '+2250505111157', label: 'Wave' },
          { provider: 'MTN MoMo', number: '+2250505111157', label: 'MTN Mobile Money' },
          { provider: 'Orange Money', number: '+2250505111157', label: 'Orange Money' },
          { provider: 'Carte Bancaire', number: 'En ligne', label: 'Visa / Mastercard (Paystack)' }
        ],
        returnPolicy: "Garantie satisfait ou remboursé sous 7 jours après activation."
      },
      customInstructions: "Tu es l'assistant commercial d'élite de la plateforme Vendeur IA. Ton rôle est d'accueillir chaleureusement les commerçants, entrepreneurs et marques qui souhaitent automatiser leurs ventes sur WhatsApp. Présente nos fonctionnalités phares (IA de vente 24/7, validation instantanée des reçus Wave/MTN/Orange par Shield OCR, relance des clients), nos offres (Pack Essential à 15 000 F/mois, Pack Pro à 25 000 F/mois, option Déploiement Clé en main) et guide-les pour démarrer immédiatement."
    };

    if (!knowledge) {
      await CommerceKnowledgeModel.create(knowledgeData);
      console.log(`[${envName}] Created Vendeur IA knowledge base.`);
    } else {
      Object.assign(knowledge, knowledgeData);
      await knowledge.save();
      console.log(`[${envName}] Updated Vendeur IA knowledge base.`);
    }

    console.log(`✨ SUCCESS [${envName}]: Business Vendeur IA configured!`);
  } catch (err) {
    console.error(`❌ ERROR [${envName}]:`, err);
  } finally {
    await mongoose.disconnect();
  }
}

async function syncDatabases() {
  const localUri = "mongodb://localhost:27017/vendeuria-local";
  const prodUri = process.env.PROD_MONGODB_URI || "mongodb+srv://kyfran6_db_user:zLURzo9I8rSAaefW@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-prod?retryWrites=true&w=majority&appName=VendeuriaCluster";

  console.log("\n========================================");
  console.log("🔄 STARTING TWO-WAY SYNC: ATLAS PROD <-> LOCAL DEV");
  console.log("========================================");

  // 1. Fetch from Prod Atlas
  const prodConn = await mongoose.createConnection(prodUri).asPromise();
  console.log("✅ Connected to PROD Atlas");
  const ProdCustomer = prodConn.model("CommerceCustomer", CommerceCustomerModel.schema);
  const ProdConv = prodConn.model("CommerceConversation", CommerceConversationModel.schema);
  const ProdMessage = prodConn.model("CommerceMessage", CommerceMessageModel.schema);
  const ProdMerchant = prodConn.model("CommerceMerchant", CommerceMerchantModel.schema);
  const ProdUser = prodConn.model("User", UserModel.schema);

  // 2. Connect to Local
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log("✅ Connected to LOCAL DB");
  const LocalCustomer = localConn.model("CommerceCustomer", CommerceCustomerModel.schema);
  const LocalConv = localConn.model("CommerceConversation", CommerceConversationModel.schema);
  const LocalMessage = localConn.model("CommerceMessage", CommerceMessageModel.schema);
  const LocalMerchant = localConn.model("CommerceMerchant", CommerceMerchantModel.schema);
  const LocalUser = localConn.model("User", UserModel.schema);

  // A. Find local Vendeur IA merchant
  let localVendeurMerchant = await LocalMerchant.findOne({
    $or: [{ whatsappNumber: { $regex: '5111157' } }, { businessName: 'Vendeur IA' }]
  });

  // B. Find prod Vendeur IA merchant
  let prodVendeurMerchant = await ProdMerchant.findOne({
    $or: [{ whatsappNumber: { $regex: '5111157' } }, { businessName: 'Vendeur IA' }]
  });

  if (prodVendeurMerchant && localVendeurMerchant) {
    // Sync conversations and messages from Prod to Local for Vendeur IA
    const prodConversations = await ProdConv.find({ merchantId: prodVendeurMerchant._id });
    console.log(`\n📥 Found ${prodConversations.length} conversations in PROD for Vendeur IA. Syncing to LOCAL...`);

    for (const pConv of prodConversations) {
      // Find or sync customer
      const pCust = await ProdCustomer.findById(pConv.customerId);
      let localCustId = null;
      if (pCust) {
        let localCust = await LocalCustomer.findOne({ merchantId: localVendeurMerchant._id, phone: pCust.phone });
        if (!localCust) {
          localCust = await LocalCustomer.create({
            merchantId: localVendeurMerchant._id,
            phone: pCust.phone,
            name: pCust.name,
            platform: pCust.platform || "whatsapp",
            leadScore: pCust.leadScore || 0
          });
        }
        localCustId = localCust._id;
      }

      // Upsert conversation locally
      let localConv = await LocalConv.findOne({
        merchantId: localVendeurMerchant._id,
        $or: [
          ...(localCustId ? [{ customerId: localCustId }] : []),
          { _id: pConv._id }
        ]
      });

      if (!localConv) {
        localConv = await LocalConv.create({
          _id: pConv._id,
          merchantId: localVendeurMerchant._id,
          customerId: localCustId || pConv.customerId,
          platform: pConv.platform || "whatsapp",
          status: pConv.status || "active",
          lastMessageAt: pConv.lastMessageAt || new Date(),
          messagesCount: pConv.messagesCount || 0
        });
      } else {
        localConv.lastMessageAt = pConv.lastMessageAt;
        localConv.status = pConv.status;
        if (localCustId) localConv.customerId = localCustId;
        await localConv.save();
      }

      // Sync messages
      const pMsgs = await ProdMessage.find({ conversationId: pConv._id });
      for (const pMsg of pMsgs) {
        const exists = await LocalMessage.findOne({
          conversationId: localConv._id,
          content: pMsg.content,
          sender: pMsg.sender,
          timestamp: pMsg.timestamp
        });
        if (!exists) {
          await LocalMessage.create({
            conversationId: localConv._id,
            sender: pMsg.sender,
            type: pMsg.type || "text",
            content: pMsg.content,
            timestamp: pMsg.timestamp,
            mediaUrl: pMsg.mediaUrl,
            aiMetadata: pMsg.aiMetadata
          });
        }
      }
    }
    console.log(`✅ Synced ${prodConversations.length} conversations to local Vendeur IA merchant.`);
  }

  // C. Sync local 0102273966 merchant and user to Prod if not present
  const localBoksUser = await LocalUser.findOne({ whatsappNumber: { $regex: '0102273966' } });
  const localBoksMerchant = await LocalMerchant.findOne({ whatsappNumber: { $regex: '0102273966' } });
  if (localBoksUser && localBoksMerchant) {
    console.log("\n📤 Ensuring 0102273966 merchant exists in Prod...");
    let prodUser = await ProdUser.findOne({ whatsappNumber: localBoksUser.whatsappNumber });
    if (!prodUser) {
      prodUser = await ProdUser.create({
        whatsappNumber: localBoksUser.whatsappNumber,
        email: localBoksUser.email,
        displayName: localBoksUser.displayName,
        roles: localBoksUser.roles || ["user"],
        onboardingCompleted: true
      });
    }
    let prodMerchant = await ProdMerchant.findOne({ whatsappNumber: localBoksMerchant.whatsappNumber });
    if (!prodMerchant) {
      await ProdMerchant.create({
        ownerId: prodUser._id,
        businessName: localBoksMerchant.businessName,
        phone: localBoksMerchant.phone,
        whatsappNumber: localBoksMerchant.whatsappNumber,
        category: localBoksMerchant.category || "fashion",
        city: localBoksMerchant.city || "Abidjan",
        country: localBoksMerchant.country || "CI",
        currency: "XOF"
      });
    }
    console.log("✅ 0102273966 merchant synced to Prod.");
  }

  // D. Summary of local DB state
  console.log("\n========================================");
  console.log("📊 LOCAL DATABASE STATUS AFTER SYNC:");
  const localMerchants = await LocalMerchant.find();
  for (const m of localMerchants) {
    const convCount = await LocalConv.countDocuments({ merchantId: m._id });
    console.log(`- Merchant: ${m.businessName} (${m.whatsappNumber}) -> ${convCount} conversation(s)`);
    const convs = await LocalConv.find({ merchantId: m._id }).populate('customerId').sort({ lastMessageAt: -1 });
    for (const c of convs) {
      const cust = c.customerId as any;
      const msgCount = await LocalMessage.countDocuments({ conversationId: c._id });
      console.log(`   * Conv ${c._id}: Client ${cust?.phone || cust?.name || 'Inconnu'} | ${msgCount} msgs | Status: ${c.status} | Last: ${c.lastMessageAt}`);
    }
  }

  await prodConn.close();
  await localConn.close();
}

async function pauseAIInProd() {
  const prodUri = "mongodb+srv://kyfran6_db_user:zLURzo9I8rSAaefW@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-prod?retryWrites=true&w=majority&appName=VendeuriaCluster";
  const conn = await mongoose.createConnection(prodUri).asPromise();
  const ProdMerchant = conn.model("CommerceMerchant", CommerceMerchantModel.schema);
  const merchant = await ProdMerchant.findOneAndUpdate(
    { $or: [{ whatsappNumber: { $regex: "5111157" } }, { businessName: "Vendeur IA" }] },
    { $set: { "aiSettings.autoReply": false } },
    { new: true }
  );
  if (merchant) {
    console.log(`✅ PROD: AI autoReply = FALSE pour "${merchant.businessName}". L'IA ne répondra plus pour le numéro système.`);
  } else {
    console.warn("⚠️ PROD: Aucun merchant Vendeur IA trouvé en production.");
  }
  await conn.close();
}

async function run() {
  await configureDatabase(env.MONGODB_URI, "local_default");
  await pauseAIInProd();
  console.log("\n🏁 Done!");
  process.exit(0);
}

run();

