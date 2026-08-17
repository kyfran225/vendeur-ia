import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserModel } from "../modules/auth/user.model.js";
import { CommerceMerchantModel, CommerceKnowledgeModel } from "../modules/commerce/commerce.model.js";
import { env } from "../config/env.js";

async function makeAdmin(targetEnv: string, email: string, customPassword?: string) {
  if (!targetEnv || !email) {
    console.error("❌ Usage: pnpm tsx src/scripts/make-admin.ts <dev|preview|prod|uri> <user_email> [password]");
    console.log("   Exemple: pnpm tsx src/scripts/make-admin.ts prod admin@example.com");
    process.exit(1);
  }

  let mongoUri = "";
  const envKey = targetEnv.toLowerCase();

  if (envKey === "dev" || envKey === "local") {
    mongoUri = env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local";
  } else if (envKey === "preview") {
    mongoUri = process.env.PREVIEW_MONGODB_URI || "";
    if (!mongoUri) {
        console.error("❌ Erreur: PREVIEW_MONGODB_URI non définie dans les variables d'environnement.");
        process.exit(1);
    }
  } else if (envKey === "prod" || envKey === "production") {
    mongoUri = process.env.PROD_MONGODB_URI || "";
    if (!mongoUri) {
        console.error("❌ Erreur: PROD_MONGODB_URI non définie dans les variables d'environnement.");
        process.exit(1);
    }
  } else if (envKey.startsWith("mongodb")) {
    mongoUri = targetEnv;
  } else {
    console.error(`❌ Environnement invalide: '${targetEnv}'. Choisissez parmi: dev, preview, prod ou fournissez un URI MongoDB complet.`);
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();
  const defaultPassword = customPassword || "Admin1234!";

  console.log(`🛡️  CRÉATION / PROMOTION UTILISATEUR EN ADMIN`);
  console.log(`📌 Target Env: ${envKey.toUpperCase()}`);
  console.log(`📌 Mongo URI: ${mongoUri.replace(/:([^@]+)@/, ":****@")}`);
  console.log(`📌 User Email: ${cleanEmail}`);

  try {
    console.log("🔌 Connexion à MongoDB...");
    await mongoose.connect(mongoUri);

    let user = await UserModel.findOne({ email: cleanEmail });

    if (!user) {
      console.log(`👤 Utilisateur inexistant. Création d'un nouveau compte Admin pour: ${cleanEmail}...`);
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      user = await UserModel.create({
        email: cleanEmail,
        passwordHash,
        displayName: cleanEmail.split("@")[0],
        roles: ["admin", "user"],
        onboardingCompleted: true
      });
      console.log(`✨ Compte utilisateur créé avec succès avec le mot de passe : ${defaultPassword}`);
    } else {
      console.log(`👤 Utilisateur existant trouvé. Mise à jour des rôles et réinitialisation du mot de passe...`);
      if (!user.roles.includes("admin")) {
        user.roles.push("admin");
      }
      user.passwordHash = await bcrypt.hash(defaultPassword, 10);
      user.onboardingCompleted = true;
      await user.save();
      console.log(`🎉 SUCCÈS : L'utilisateur ${cleanEmail} est désormais Admin avec le mot de passe : ${defaultPassword} ! 🛡️`);
    }

    // Vérifier / Créer la boutique système par défaut si aucune boutique n'est associée
    let merchant = await CommerceMerchantModel.findOne({ ownerId: user._id });
    if (!merchant) {
      console.log("🏪 Création d'un profil marchand Admin par défaut (SYSTEM CORE)...");
      merchant = await CommerceMerchantModel.create({
        ownerId: user._id,
        businessName: "SYSTEM CORE",
        category: "services",
        city: "Abidjan",
        country: "CI",
        address: "Admin HQ",
        whatsappNumber: "+2250000000000"
      });

      await CommerceKnowledgeModel.create({
        merchantId: merchant._id,
        businessRules: {
          deliveryZones: ["Abidjan"],
          openingHours: "24/7",
          returnPolicy: "Support Admin",
          paymentMethods: [
            { provider: "Wave", number: "+2250000000000", label: "Wave Admin" }
          ]
        },
        customInstructions: "Compte Administration Système."
      });
      console.log("✅ Boutique marchand Admin (SYSTEM CORE) créée avec succès.");
    } else {
      console.log(`ℹ️  Boutique existante trouvée pour cet Admin: ${merchant.businessName}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création/promotion de l'admin:", error);
    process.exit(1);
  }
}

const targetEnv = process.argv[2];
const emailArg = process.argv[3];
const passwordArg = process.argv[4];
makeAdmin(targetEnv, emailArg, passwordArg);
