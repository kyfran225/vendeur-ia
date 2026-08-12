import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { UserModel } from "../modules/auth/user.model.js";
import { CommerceMerchantModel, CommerceKnowledgeModel } from "../modules/commerce/commerce.model.js";

const ENV_MAP: Record<string, string> = {
  dev: "mongodb://localhost:27017/vendeur-ia",
  preview: "mongodb+srv://kyfran6_db_user:aF4BAHfgfMckfcDH@vendeuriacluster.uyo7eob.mongodb.net/vendeur-ia-preview?retryWrites=true&w=majority&appName=VendeuriaCluster",
  prod: "mongodb+srv://kyfran6_db_user:aF4BAHfgfMckfcDH@vendeuriacluster.uyo7eob.mongodb.net/vendeur-ia-prod?retryWrites=true&w=majority&appName=VendeuriaCluster"
};

async function makeAdmin(targetEnv: string, email: string, customPassword?: string) {
  if (!targetEnv || !email) {
    console.error("❌ Usage: pnpm tsx src/scripts/make-admin.ts <dev|preview|prod> <user_email> [password]");
    process.exit(1);
  }

  const envKey = targetEnv.toLowerCase();
  const mongoUri = ENV_MAP[envKey] || (envKey.startsWith("mongodb") ? targetEnv : null);

  if (!mongoUri) {
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
      console.log(`👤 Utilisateur existant trouvé. Mise à jour des rôles...`);
      if (!user.roles.includes("admin")) {
        user.roles.push("admin");
      }
      user.onboardingCompleted = true;
      await user.save();
      console.log(`🎉 SUCCÈS : L'utilisateur existant ${cleanEmail} est désormais Admin ! 🛡️`);
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
