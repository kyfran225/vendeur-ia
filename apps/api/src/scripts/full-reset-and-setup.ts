/**
 * ============================================================
 *  VENDEUR IA — RESET TOTAL + RECONFIGURATION ADMIN
 * ============================================================
 *  Ce script :
 *  1. Purge complètement les 3 bases (local, preview, prod)
 *  2. Recrée le compte admin fondateur (kyfran6@gmail.com / +2250505111157)
 *  3. Configure le merchant "Vendeur IA" avec WhatsApp Meta + paiements
 *  4. Seed les offres officielles (Essential 5 000 F + Pro 20 000 F / mois)
 *  5. Remonte la base de connaissance IA de l'assistant commercial
 * ============================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// ─── Schemas inline (autonome, pas de dépendances circulaires) ──────────────

const userSchema = new mongoose.Schema({
  email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
  whatsappNumber: { type: String, sparse: true, unique: true, trim: true },
  authProvider: { type: String, default: 'email' },
  passwordHash: { type: String },
  displayName: { type: String, required: true },
  roles: [{ type: String }],
  onboardingCompleted: { type: Boolean, default: false },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

const merchantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  businessName: { type: String, required: true },
  slug: { type: String },
  category: { type: String },
  description: { type: String },
  city: { type: String },
  country: { type: String },
  address: { type: String },
  phone: { type: String },
  whatsappNumber: { type: String },
  currency: { type: String, default: 'XOF' },
  language: { type: String, default: 'fr' },
  onboardingCompleted: { type: Boolean, default: false },
  whatsappConfig: { type: mongoose.Schema.Types.Mixed },
  paymentChannels: [{ type: mongoose.Schema.Types.Mixed }],
  aiSettings: { type: mongoose.Schema.Types.Mixed },
  subscriptionStatus: { type: String, default: 'trialing' },
  subscriptionPlan: { type: String, default: 'pro' },
}, { timestamps: true });

const knowledgeSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommerceMerchant', required: true },
  businessName: { type: String },
  generalKnowledge: { type: String },
  businessRules: { type: mongoose.Schema.Types.Mixed },
  customInstructions: { type: String },
  products: [{ type: mongoose.Schema.Types.Mixed }],
  faqs: [{ type: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });

const offerSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number },
  currency: { type: String, default: 'XOF' },
  features: [String],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  setupRequired: { type: Boolean, default: false },
  setupOptions: [{ type: mongoose.Schema.Types.Mixed }],
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// ─── Données canoniques ──────────────────────────────────────────────────────

const WAVE_MTN_PHONE = '+2250505111157';
const ORANGE_PHONE = '+2250708292693';
const RAW_PHONE = '2250505111157';
const EMAIL = 'kyfran6@gmail.com';
const DISPLAY_NAME = 'Franck — Co-Fondateur & CEO Vendeur IA';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '1283754474826620';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

const OFFRES = [
  {
    slug: 'essential',
    name: 'Vendeur IA Essentiel',
    description: "L'IA autonome qui vend pour vous 24h/24 — idéal pour automatiser vos encaissements et ne plus rater aucun client.",
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    currency: 'XOF',
    features: [
      'Agent Vendeur IA autonome 24h/24 & 7j/7',
      'Catalogue produits illimité & Gestion des stocks',
      'PaymentShield : Détection automatique des reçus Mobile Money (Wave, MTN, Orange, Moov)',
      'Prise de commandes & Reçus automatiques',
      'Studio Créatif : Affiches IA & Statuts WhatsApp',
      'Messagerie avec Reprise en main humaine à tout moment',
    ],
    isActive: true,
    sortOrder: 1,
    setupRequired: false,
    setupOptions: [
      { type: 'SELF_SERVICE', price: 0, label: 'Installation Standard (Self-Service)' },
    ],
  },
  {
    slug: 'pro',
    name: 'Vendeur IA Pro',
    description: "L'expérience premium avec numéro officiel Meta, marketing ciblé et outils avancés pour scaler votre business.",
    monthlyPrice: 20000,
    yearlyPrice: 200000,
    currency: 'XOF',
    features: [
      'Tout ce qui est inclus dans Essentiel',
      "Numéro d'Entreprise Officiel WhatsApp (API Meta Cloud)",
      'Multi-Canal : WhatsApp + Instagram & Messenger',
      'Broadcast IA : Campagnes marketing ciblées & séquences de relance',
      'PaymentShield Forensic : Sécurité anti-fraude renforcée',
      'Vocaux IA : Synthèse vocale naturelle pour vos clients',
      'Support VIP Prioritaire 7j/7',
    ],
    isActive: true,
    sortOrder: 2,
    setupRequired: true,
    setupOptions: [
      { type: 'SELF_SERVICE', price: 0, label: 'Je configure moi-même (si vous avez déjà accès Meta)' },
      { type: 'EXPERT', price: 25000, label: 'Pack Expert : Installation Clé en Main par notre équipe' },
    ],
  },
];

const BASE_DE_CONNAISSANCE = {
  businessName: 'Vendeur IA',
  generalKnowledge: `Vendeur IA est la plateforme d'intelligence artificielle de référence en Afrique francophone pour automatiser les ventes, le support client et les paiements sur WhatsApp. Notre IA accueille vos prospects, présente votre catalogue produits, répond aux questions 24h/24 & 7j/7, prend les commandes, valide instantanément les paiements Mobile Money (Wave, MTN, Orange) grâce à notre technologie Shield OCR, et relance automatiquement les paniers abandonnés. Tout ça pendant que vous dormez.`,
  businessRules: {
    openingHours: '24h/24 — 7j/7 (Service entièrement automatisé par IA)',
    deliveryZones: ["Côte d'Ivoire", 'Sénégal', 'Bénin', 'Togo', 'Burkina Faso', 'Mali', 'Cameroun', 'Afrique & International'],
    paymentMethods: [
      { provider: 'Wave', number: WAVE_MTN_PHONE, label: 'Wave CI' },
      { provider: 'MTN MoMo', number: WAVE_MTN_PHONE, label: 'MTN Mobile Money' },
      { provider: 'Orange Money', number: ORANGE_PHONE, label: 'Orange Money' },
      { provider: 'Carte Bancaire', number: 'En ligne', label: 'Visa / Mastercard (Paystack)' },
    ],
    returnPolicy: 'Garantie satisfait ou remboursé sous 7 jours après activation.',
  },
  customInstructions: `Tu es l'assistant commercial d'élite de la plateforme Vendeur IA — tu ES l'exemple vivant de ce que tu vends.

Ton rôle : accueillir chaleureusement les commerçants, entrepreneurs et marques qui veulent automatiser leurs ventes sur WhatsApp, leur montrer l'impact concret de l'IA pour leur business, et les guider pour démarrer immédiatement.

Nos offres :

🟢 Pack Essentiel — 5 000 F CFA / mois (ou 50 000 F / an — 2 mois offerts)
→ IA de vente autonome 24h/24, catalogue produits illimité, PaymentShield (validation reçus Mobile Money), prise de commandes automatique, Studio Créatif, reprise humaine à volonté.
→ Démarrage immédiat, zéro configuration technique.

🔵 Pack Pro — 20 000 F CFA / mois (ou 200 000 F / an — 2 mois offerts)
→ Tout l'Essentiel + Numéro officiel WhatsApp Meta, Instagram & Messenger, Broadcast IA (campagnes marketing & relances), PaymentShield Forensic (anti-fraude avancé), Vocaux IA, Support VIP 7j/7.
→ Option "Pack Expert" : installation clé en main par notre équipe pour 25 000 F (unique, une seule fois).

Style : direct, chaleureux, professionnel. Tu montres la valeur concrète (temps gagné, ventes manquées récupérées, argent sécurisé). Tu poses des questions pour comprendre le business du prospect avant de recommander une offre. Tu ne récites pas, tu vends.`,
  faqs: [
    {
      question: 'Comment fonctionne la validation des paiements ?',
      answer: "Notre technologie PaymentShield analyse automatiquement les captures d'écran de reçus Wave, MTN et Orange envoyées par vos clients dans WhatsApp. L'IA extrait le montant, le numéro et valide la commande en quelques secondes — zéro fraude, zéro effort manuel.",
    },
    {
      question: "Ai-je besoin d'un compte Meta pour utiliser Vendeur IA ?",
      answer: "Pour le Pack Essentiel, non — on utilise une solution simplifiée opérationnelle immédiatement. Pour le Pack Pro avec votre propre numéro officiel Meta, oui, mais notre équipe vous accompagne dans toute la procédure (inclus dans le Pack Expert à 25 000 F, une seule fois).",
    },
    {
      question: 'Puis-je reprendre la main sur les conversations ?',
      answer: "Absolument. Vous pouvez reprendre n'importe quelle conversation à tout moment depuis votre dashboard. L'IA met en pause et vous laisse la main, puis reprend automatiquement si vous ne répondez pas après un délai configurable.",
    },
    {
      question: 'Est-ce que ça fonctionne pour mon type de business ?',
      answer: "Vendeur IA s'adapte à tous les secteurs : mode & vêtements, alimentation, cosmétiques, services, formations, immobilier… Si vous vendez quelque chose, on automatise.",
    },
    {
      question: 'Combien de clients peut gérer l\'IA simultanément ?',
      answer: "L'IA gère un nombre illimité de conversations en parallèle, 24h/24. Que vous ayez 1 ou 1 000 clients qui vous écrivent en même temps, chacun reçoit une réponse personnalisée en quelques secondes.",
    },
  ],
};

// ─── Fonction de setup d'une base ───────────────────────────────────────────

async function setupDatabase(uri: string, envName: string) {
  const conn = await mongoose.createConnection(uri).asPromise();
  console.log(`\n✅ Connecté à [${envName}]`);

  // 1. DROP COMPLET
  console.log(`🗑️  [${envName}] Drop de la base en cours...`);
  await conn.db?.dropDatabase();
  console.log(`✅ [${envName}] Base purgée avec succès.`);

  // 2. Modèles sur cette connexion isolée
  const User = conn.model('User', userSchema);
  const Merchant = conn.model('CommerceMerchant', merchantSchema);
  const Knowledge = conn.model('CommerceKnowledge', knowledgeSchema);
  const Offer = conn.model('Offer', offerSchema);

  // 3. Créer admin fondateur
  console.log(`\n👤 [${envName}] Création du compte admin fondateur...`);
  const passwordHash = await bcrypt.hash('VendeurIA2026!', 10);
  const user = await User.create({
    email: EMAIL,
    whatsappNumber: RAW_PHONE,
    authProvider: 'email',
    passwordHash,
    displayName: DISPLAY_NAME,
    roles: ['user', 'admin', 'creator'],
    onboardingCompleted: true,
    lastSeenAt: new Date(),
  });
  console.log(`✅ [${envName}] Admin créé : ${user.email} | ID: ${user._id}`);

  // 4. Créer merchant Vendeur IA
  console.log(`\n🏪 [${envName}] Création du merchant Vendeur IA...`);
  const merchant = await Merchant.create({
    ownerId: user._id,
    businessName: 'Vendeur IA',
    slug: 'vendeur-ia',
    category: 'services',
    description: "Plateforme IA leader en Afrique pour automatiser les ventes, le support et les paiements Mobile Money sur WhatsApp.",
    city: 'Abidjan',
    country: 'CI',
    address: "Abidjan, Côte d'Ivoire",
    phone: WAVE_MTN_PHONE,
    whatsappNumber: WAVE_MTN_PHONE,
    currency: 'XOF',
    language: 'fr',
    onboardingCompleted: true,
    subscriptionStatus: 'active',
    subscriptionPlan: 'pro',
    whatsappConfig: {
      provider: 'meta',
      status: 'connected',
      phoneNumberId: WHATSAPP_PHONE_ID,
      meta: {
        phoneNumberId: WHATSAPP_PHONE_ID,
        accessToken: WHATSAPP_ACCESS_TOKEN,
      },
    },
    paymentChannels: [
      { provider: 'wave', label: 'Wave CI', number: WAVE_MTN_PHONE },
      { provider: 'mtn_momo', label: 'MTN Mobile Money', number: WAVE_MTN_PHONE },
      { provider: 'orange_money', label: 'Orange Money', number: ORANGE_PHONE },
    ],
    aiSettings: {
      personality: 'premium',
      responseStyle: 'normal',
      autoReply: true,
      weeklyReport: true,
      language: 'fr',
    },
  });
  console.log(`✅ [${envName}] Merchant créé : ${merchant.businessName} | Plan: Pro actif | ID: ${merchant._id}`);

  // 5. Seeder les offres
  console.log(`\n💎 [${envName}] Seed des offres officielles...`);
  for (const offre of OFFRES) {
    await Offer.create(offre);
    console.log(`   ✔ "${offre.name}" — ${offre.monthlyPrice.toLocaleString('fr-FR')} F CFA/mois`);
  }

  // 6. Base de connaissance IA
  console.log(`\n🧠 [${envName}] Création de la base de connaissance IA...`);
  await Knowledge.create({
    merchantId: merchant._id,
    ...BASE_DE_CONNAISSANCE,
  });
  console.log(`✅ [${envName}] Base de connaissance IA créée (avec FAQ, offres, instructions commerciales).`);

  await conn.close();

  console.log(`\n🎉 [${envName}] CONFIGURATION COMPLÈTE !`);
  console.log(`   ├── 📧 Email    : ${EMAIL}`);
  console.log(`   ├── 📱 WhatsApp : ${WAVE_MTN_PHONE}`);
  console.log(`   ├── 🔐 Password : VendeurIA2026!`);
  console.log(`   ├── 👑 Rôles    : admin, creator, user`);
  console.log(`   └── 💎 Plan     : Pro (actif)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     VENDEUR IA — RESET TOTAL + RECONFIGURATION ADMIN     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('⚠️  ATTENTION : Toutes les données existantes seront définitivement purgées.\n');

  const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vendeuria-local';
  const PREVIEW_URI = process.env.PREVIEW_MONGODB_URI || '';
  const PROD_URI = process.env.PROD_MONGODB_URI || '';

  try {
    // 1. Base locale
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ÉTAPE 1 / 3 — Base LOCAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await setupDatabase(LOCAL_URI, 'LOCAL');

    // 2. Preview Atlas
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ÉTAPE 2 / 3 — Base PREVIEW (Atlas)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (PREVIEW_URI) {
      await setupDatabase(PREVIEW_URI, 'PREVIEW (Atlas)');
    } else {
      console.log('⚠️  PREVIEW_MONGODB_URI non défini — ignoré.');
    }

    // 3. Production Atlas
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ÉTAPE 3 / 3 — Base PROD (Atlas)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (PROD_URI) {
      await setupDatabase(PROD_URI, 'PROD (Atlas)');
    } else {
      console.log('⚠️  PROD_MONGODB_URI non défini — ignoré.');
    }

    // Résumé final
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║               ✅  RESET & SETUP TERMINÉ                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n📊 Clés API IA vérifiées depuis .env :');
    console.log(`  🤖 Gemini        : ${process.env.DISABLE_GEMINI === 'true' ? '🚫 bloqué' : (process.env.GEMINI_API_KEY ? '✅ active' : '❌ manquante')}`);
    console.log(`  🤖 Groq          : ${process.env.GROQ_API_KEY ? '✅ active' : '❌ manquante'}`);
    console.log(`  🤖 OpenAI        : ${process.env.OPENAI_API_KEY ? '✅ active' : '❌ manquante'}`);
    console.log(`  🤖 OpenRouter    : ${process.env.OPENROUTER_API_KEY ? '✅ active' : '❌ manquante'}`);
    console.log(`  🎤 ElevenLabs    : ${process.env.ELEVENLABS_API_KEY ? '✅ active' : '❌ manquante'}`);
    console.log(`  💳 Paystack      : ${process.env.PAYSTACK_SECRET_KEY ? '✅ active' : '❌ manquante'}`);
    console.log(`  📱 WhatsApp Meta : ${process.env.WHATSAPP_ACCESS_TOKEN ? '✅ active' : '❌ manquante'}`);
    console.log(`  📧 Resend Email  : ${process.env.RESEND_API_KEY ? '✅ active' : '❌ manquante'}`);
    console.log('\n🚀 Prêt ! Démarrez avec : pnpm dev\n');
  } catch (err) {
    console.error('\n❌ ERREUR CRITIQUE :', err);
    process.exit(1);
  }

  process.exit(0);
}

run();
