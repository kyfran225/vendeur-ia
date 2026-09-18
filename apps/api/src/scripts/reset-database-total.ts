import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'apps/api/.env') });

const FOUNDER_PHONE = "+2250505111157";
const FOUNDER_RAW_PHONE = "2250505111157";
const FOUNDER_EMAIL = "kyfran6@gmail.com";

const DEMO_PHONE = "+2250102273966";
const DEMO_RAW_PHONE = "2250102273966";
const DEMO_EMAIL = "2250102273966@whatsapp.vendeur-ia.com";

const META_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";
const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const META_VERIFY_TOKEN = process.env.WHATSAPP_META_VERIFY_TOKEN || "";
const META_APP_ID = process.env.WHATSAPP_META_APP_ID || "";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

async function resetDatabase(uri: string, dbName: string) {
  console.log(`\n=============================================================`);
  console.log(`💣 STARTING TOTAL RESET ON [${dbName.toUpperCase()}]`);
  console.log(`Connecting to: ${uri.replace(/\/\/.*@/, '//***@')}...`);

  let conn: mongoose.Connection;
  try {
    conn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000
    }).asPromise();
    console.log(`✅ Connected successfully to [${dbName}]!`);
  } catch (err: any) {
    console.warn(`⚠️ Could not connect to [${dbName}]: ${err.message}. Skipping.`);
    return;
  }

  try {
    if (!conn.db) {
      throw new Error(`Database instance not found on connection to [${dbName}]`);
    }
    // 1. Drop all collections in the database
    const collections = await conn.db.listCollections().toArray();
    console.log(`\n🧹 Dropping ${collections.length} collection(s)...`);
    for (const col of collections) {
      if (col.name.startsWith('system.')) continue;
      await conn.db.dropCollection(col.name);
      console.log(`   - Dropped collection: ${col.name}`);
    }
    console.log(`✨ All collections dropped! Clean slate achieved.`);

    // 2. Define Schemas
    const User = conn.model("User", new mongoose.Schema({
      whatsappNumber: String,
      email: String,
      passwordHash: String,
      displayName: String,
      avatarUrl: String,
      authProvider: { type: String, default: "whatsapp" },
      roles: [String],
      onboardingCompleted: Boolean,
      lastSeenAt: Date
    }, { timestamps: true }));

    const CommerceMerchant = conn.model("CommerceMerchant", new mongoose.Schema({
      ownerId: mongoose.Schema.Types.ObjectId,
      businessName: String,
      slug: String,
      category: String,
      description: String,
      phone: String,
      whatsappNumber: String,
      city: String,
      country: String,
      address: String,
      currency: String,
      language: String,
      onboardingCompleted: Boolean,
      whatsappConfig: mongoose.Schema.Types.Mixed,
      paymentChannels: [mongoose.Schema.Types.Mixed],
      aiSettings: mongoose.Schema.Types.Mixed,
      subscription: mongoose.Schema.Types.Mixed
    }, { timestamps: true }));

    const CommerceProduct = conn.model("CommerceProduct", new mongoose.Schema({
      merchantId: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number,
      currency: String,
      stock: Number,
      availability: String,
      category: String,
      isService: Boolean,
      description: String,
      images: [String]
    }, { timestamps: true }));

    const CommerceKnowledge = conn.model("CommerceKnowledge", new mongoose.Schema({
      merchantId: mongoose.Schema.Types.ObjectId,
      businessName: String,
      generalKnowledge: String,
      businessRules: mongoose.Schema.Types.Mixed,
      customInstructions: String
    }, { timestamps: true }));

    const SystemSettings = conn.model("SystemSettings", new mongoose.Schema({
      supportWhatsApp: String,
      pricing: mongoose.Schema.Types.Mixed,
      metaConfig: mongoose.Schema.Types.Mixed,
      aiConfig: mongoose.Schema.Types.Mixed,
      manualPaymentConfig: mongoose.Schema.Types.Mixed,
      pushConfig: mongoose.Schema.Types.Mixed,
      maintenanceMode: Boolean
    }, { timestamps: true }));

    // 3. Seed SystemSettings (AI Keys, Meta Cloud API, Payment Config, Pricing)
    console.log(`\n⚙️ 1. Seeding SystemSettings (AI keys, Meta Cloud, Payment Routing)...`);
    const systemSettingsData = {
      supportWhatsApp: FOUNDER_PHONE,
      pricing: {
        essentialMonthly: 5000,
        proMonthly: 20000,
        packProFee: 25000,
        ramContributionFee: 5000,
        premiumSubscriptionMonthly: 5000,
        regional: [
          { currency: "XOF", essentialMonthly: 5000, proMonthly: 20000, premiumMonthly: 5000, businessMonthly: 20000, packPro: 25000, ramFee: 5000 },
          { currency: "XAF", essentialMonthly: 5000, proMonthly: 20000, premiumMonthly: 5000, businessMonthly: 20000, packPro: 25000, ramFee: 5000 },
          { currency: "GNF", essentialMonthly: 75000, proMonthly: 300000, premiumMonthly: 75000, businessMonthly: 300000, packPro: 375000, ramFee: 75000 },
          { currency: "EUR", essentialMonthly: 9, proMonthly: 35, premiumMonthly: 9, businessMonthly: 35, packPro: 45, ramFee: 9 }
        ]
      },
      metaConfig: {
        globalAppId: META_APP_ID,
        globalVerifyToken: META_VERIFY_TOKEN,
        whatsappDefaults: {
          phoneNumberId: META_PHONE_ID,
          accessToken: META_ACCESS_TOKEN
        }
      },
      aiConfig: {
        defaultTextProvider: "groq",
        defaultVisionProvider: "openai",
        defaultAudioProvider: "elevenlabs",
        providers: [
          {
            name: "groq",
            apiKey: GROQ_API_KEY,
            isActive: true,
            models: { text: "llama-3.3-70b-versatile", vision: "", audio: "" }
          },
          {
            name: "openai",
            apiKey: OPENAI_API_KEY,
            isActive: true,
            models: { text: "gpt-4o-mini", vision: "gpt-4o", audio: "tts-1" }
          },
          {
            name: "openrouter",
            apiKey: OPENROUTER_API_KEY,
            isActive: true,
            models: { text: "meta-llama/llama-3.3-70b-instruct", vision: "", audio: "" }
          },
          {
            name: "elevenlabs",
            apiKey: ELEVENLABS_API_KEY,
            isActive: true,
            models: { text: "", vision: "", audio: "eleven_multilingual_v2" }
          },
          {
            name: "gemini",
            apiKey: "",
            isActive: false,
            models: { text: "gemini-2.0-flash", vision: "gemini-2.0-flash", audio: "" }
          }
        ],
        notificationSettings: {
          enablePush: true,
          enableEmail: false,
          alertThreshold: "always"
        }
      },
      manualPaymentConfig: {
        enabled: true,
        recipientName: "Vendeur IA",
        waveNumber: FOUNDER_PHONE,
        orangeMoneyNumber: "+2250708292693",
        mtnNumber: FOUNDER_PHONE,
        moovNumber: "+2250100000000",
        djamoTag: "$vendeuria",
        instructions: "Effectuez votre transfert vers le numéro correspondant, puis renseignez l'ID de transaction ci-dessous.",
        autoApproveConfidenceThreshold: 95
      },
      pushConfig: {
        vapidPublicKey: VAPID_PUBLIC_KEY,
        vapidPrivateKey: VAPID_PRIVATE_KEY
      },
      maintenanceMode: false
    };

    await SystemSettings.create(systemSettingsData);
    console.log(`✅ SystemSettings created with active AI keys, Meta Cloud and payment routing.`);

    // 4. Seed Founder / Master Admin (0505111157)
    console.log(`\n👑 2. Seeding Master Admin & Founder (0505111157)...`);
    const defaultPasswordHash = await bcrypt.hash("admin123", 10);
    const founderUser = await User.create({
      whatsappNumber: FOUNDER_RAW_PHONE,
      email: FOUNDER_EMAIL,
      passwordHash: defaultPasswordHash,
      displayName: "Franck (Fondateur & Lead)",
      roles: ["user", "admin", "creator"],
      onboardingCompleted: true
    });

    const founderMerchant = await CommerceMerchant.create({
      ownerId: founderUser._id,
      businessName: "Vendeur IA",
      slug: "vendeur-ia",
      category: "services",
      description: "Plateforme et assistant commercial IA sur WhatsApp pour automatiser les ventes, le support et les paiements Mobile Money en Afrique.",
      city: "Abidjan",
      country: "CI",
      address: "Abidjan, Côte d'Ivoire",
      phone: FOUNDER_PHONE,
      whatsappNumber: FOUNDER_PHONE,
      currency: "XOF",
      language: "fr",
      onboardingCompleted: true,
      whatsappConfig: {
        provider: "meta",
        status: "connected",
        phoneNumberId: META_PHONE_ID,
        meta: {
          phoneNumberId: META_PHONE_ID,
          accessToken: META_ACCESS_TOKEN
        }
      },
      paymentChannels: [
        { provider: "wave", label: "Wave", number: FOUNDER_PHONE },
        { provider: "mtn_momo", label: "MTN MoMo", number: FOUNDER_PHONE },
        { provider: "orange_money", label: "Orange Money", number: "+2250708292693" }
      ],
      aiSettings: {
        personality: "premium",
        responseStyle: "normal",
        autoReply: false,
        weeklyReport: true
      },
      subscription: {
        plan: "enterprise",
        status: "active"
      }
    });

    // Seed 3 Official Vendeur IA products
    await CommerceProduct.create([
      {
        merchantId: founderMerchant._id,
        name: "Abonnement Vendeur IA - Pack Essentiel",
        price: 5000,
        currency: "XOF",
        stock: 999,
        availability: "available",
        category: "services",
        isService: true,
        description: "IA commerciale WhatsApp 24h/24 & 7j/7, catalogue produits complet, détection automatique des reçus Mobile Money (Wave, MTN, Orange, Moov) et prise de commandes automatique."
      },
      {
        merchantId: founderMerchant._id,
        name: "Abonnement Vendeur IA - Pack Pro",
        price: 20000,
        currency: "XOF",
        stock: 999,
        availability: "available",
        category: "services",
        isService: true,
        description: "Tout ce qui est inclus dans Essentiel + Numéro Officiel Meta Cloud API, Multi-Canal (WhatsApp + Instagram), Broadcast IA marketing, PaymentShield Forensic, Vocaux IA et Support VIP 7j/7."
      },
      {
        merchantId: founderMerchant._id,
        name: "Configuration & Déploiement Clé en main (Pack Pro Expert Setup)",
        price: 25000,
        currency: "XOF",
        stock: 999,
        availability: "available",
        category: "services",
        isService: true,
        description: "Mise en service complète et clé en main par nos experts : intégration WhatsApp Meta Cloud API, saisie du catalogue, entraînement personnalisé de votre IA et tests en direct."
      }
    ]);

    await CommerceKnowledge.create({
      merchantId: founderMerchant._id,
      businessName: "Vendeur IA",
      generalKnowledge: "Vendeur IA est la solution d'intelligence artificielle leader en Afrique pour automatiser les ventes et le support client sur WhatsApp et Instagram. L'IA accueille vos prospects, présente votre catalogue, répond aux questions 24h/24, prend les commandes, valide les paiements Mobile Money (Wave, MTN, Orange, Moov) par scan OCR et relance les paniers abandonnés.",
      businessRules: {
        openingHours: "24h/24 - 7j/7 (Service automatisé par IA)",
        deliveryZones: ["Côte d'Ivoire", "Sénégal", "Bénin", "Togo", "Burkina Faso", "Mali", "Cameroun", "Afrique & International"],
        paymentMethods: [
          { provider: "Wave", number: FOUNDER_PHONE, label: "Wave" },
          { provider: "MTN MoMo", number: FOUNDER_PHONE, label: "MTN Mobile Money" },
          { provider: "Orange Money", number: "+2250708292693", label: "Orange Money" },
          { provider: "Carte Bancaire", number: "En ligne", label: "Visa / Mastercard (Paystack)" }
        ],
        returnPolicy: "Garantie satisfait ou remboursé sous 7 jours après activation."
      },
      customInstructions: "Tu es l'assistant commercial d'élite de la plateforme Vendeur IA — tu ES l'exemple vivant de ce que tu vends.\n\nTon rôle : accueillir chaleureusement les commerçants, entrepreneurs et marques qui souhaitent automatiser leurs ventes sur WhatsApp, présenter nos offres réelles :\n- 🟢 Pack Essentiel : 5 000 F CFA / mois (ou 50 000 F CFA / an — 2 mois offerts)\n- 🔵 Pack Pro : 20 000 F CFA / mois (ou 200 000 F CFA / an — 2 mois offerts)\n- 🚀 Option Pack Pro Expert (Installation clé en main) : 25 000 F CFA (paiement unique)\n\nGuide les prospects pour choisir leur formule et démarrer immédiatement."
    });
    console.log(`✅ Founder user & Vendeur IA business configured (roles: ["user", "admin", "creator"]).`);

    // 5. Seed Demo Merchant (0102273966) -> STANDARD USER ONLY
    console.log(`\n🛍️ 3. Seeding Demo Merchant (0102273966)...`);
    const demoUser = await User.create({
      whatsappNumber: DEMO_RAW_PHONE,
      email: DEMO_EMAIL,
      passwordHash: defaultPasswordHash,
      displayName: "Boutique Franck",
      roles: ["user"], // STRICTLY STANDARD USER, NO ADMIN, NO CREATOR!
      onboardingCompleted: true
    });

    const demoMerchant = await CommerceMerchant.create({
      ownerId: demoUser._id,
      businessName: "Boutique Franck",
      slug: "boutique-franck",
      category: "fashion",
      description: "Boutique de prêt-à-porter, vêtements et accessoires de mode haut de gamme à Abidjan.",
      city: "Abidjan",
      country: "CI",
      address: "Cocody Angré, Abidjan, Côte d'Ivoire",
      phone: DEMO_PHONE,
      whatsappNumber: DEMO_PHONE,
      currency: "XOF",
      language: "fr",
      onboardingCompleted: true,
      whatsappConfig: {
        provider: "baileys",
        status: "disconnected"
      },
      paymentChannels: [
        { provider: "wave", label: "Wave", number: DEMO_PHONE },
        { provider: "orange_money", label: "Orange Money", number: DEMO_PHONE }
      ],
      aiSettings: {
        personality: "friendly",
        responseStyle: "fast",
        autoReply: true,
        weeklyReport: true
      },
      subscription: {
        plan: "pro",
        status: "active"
      }
    });

    await CommerceProduct.create([
      {
        merchantId: demoMerchant._id,
        name: "Chemise Slim Fit Blanche",
        price: 15000,
        currency: "XOF",
        stock: 50,
        availability: "available",
        category: "fashion",
        isService: false,
        description: "Chemise homme 100% coton de haute qualité, coupe slim fit moderne, idéale pour occasions formelles et décontractées."
      },
      {
        merchantId: demoMerchant._id,
        name: "Sac à Main Cuir Élégant",
        price: 25000,
        currency: "XOF",
        stock: 25,
        availability: "available",
        category: "fashion",
        isService: false,
        description: "Sac à main en cuir véritable avec finitions dorées, poches intérieures zippées et bandoulière réglable."
      },
      {
        merchantId: demoMerchant._id,
        name: "Mocassins Classiques en Cuir",
        price: 35000,
        currency: "XOF",
        stock: 18,
        availability: "available",
        category: "fashion",
        isService: false,
        description: "Mocassins pour homme confortables et résistants, confectionnés à la main avec semelle antidérapante."
      }
    ]);

    await CommerceKnowledge.create({
      merchantId: demoMerchant._id,
      businessName: "Boutique Franck",
      generalKnowledge: "Boutique Franck est votre adresse de référence à Abidjan pour la mode masculine et féminine haut de gamme. Nous proposons des vêtements élégants, sacs et chaussures de qualité.",
      businessRules: {
        openingHours: "Lundi au Samedi : 09h00 - 20h00",
        deliveryZones: ["Cocody", "Plateau", "Marcory", "Zone 4", "Yopougon", "Abidjan et intérieur du pays"],
        paymentMethods: [
          { provider: "Wave", number: DEMO_PHONE, label: "Wave" },
          { provider: "Orange Money", number: DEMO_PHONE, label: "Orange Money" },
          { provider: "Espèces à la livraison", number: "Paiement direct", label: "Cash à la livraison" }
        ],
        returnPolicy: "Échanges acceptés sous 48h en cas de problème de taille avec article non porté."
      },
      customInstructions: "Tu es l'assistant commercial chaleureux et attentionné de Boutique Franck. Accueille les clients avec le sourire, présente les articles avec leurs prix en F CFA, prends les commandes avec adresse de livraison et numéro de contact."
    });
    console.log(`✅ Demo merchant (0102273966) configured (roles: ["user"]).`);

    console.log(`\n🎉 TOTAL RESET & SEEDING COMPLETED FOR [${dbName.toUpperCase()}]!`);
  } catch (err: any) {
    console.error(`❌ Error during reset of ${dbName}:`, err);
  } finally {
    await conn.close();
  }
}

async function run() {
  const prodUri = process.env.PROD_MONGODB_URI || "";
  const previewUri = process.env.PREVIEW_MONGODB_URI || "";
  const localUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local";

  // 1. Reset Prod DB
  await resetDatabase(prodUri, "PROD (Atlas)");

  // 2. Reset Preview DB
  await resetDatabase(previewUri, "PREVIEW (Atlas)");

  // 3. Reset Local DB (if available)
  await resetDatabase(localUri, "LOCAL (Dev)");

  console.log(`\n=============================================================`);
  console.log(`🏁 ALL TARGET DATABASES RESET & RESTORED WITH EXACT SETTINGS!`);
  console.log(`=============================================================`);
  process.exit(0);
}

run();
