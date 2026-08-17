import mongoose from "mongoose";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { UserModel } from "../modules/auth/user.model.js";
import {
  CommerceMerchantModel,
  CommerceKnowledgeModel,
  CommerceProductModel,
  CommerceCustomerModel,
  CommerceConversationModel,
  CommerceMessageModel,
  CommerceOrderModel,
  MarketingCampaignModel
} from "../modules/commerce/commerce.model.js";
import { TransactionModel } from "../modules/commerce/transaction.model.js";

const ENV_MAP: Record<string, string> = {
  dev: "mongodb://localhost:27017/vendeuria-local",
  preview: "mongodb+srv://kyfran6_db_user:aF4BAHfgfMckfcDH@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-preview?retryWrites=true&w=majority&appName=VendeuriaCluster",
  prod: "mongodb+srv://kyfran6_db_user:aF4BAHfgfMckfcDH@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-prod?retryWrites=true&w=majority&appName=VendeuriaCluster"
};

async function deleteUserByEmail(targetEnv: string, email: string) {
  if (!targetEnv || !email) {
    console.error("❌ Usage: pnpm tsx src/scripts/delete-user.ts <dev|preview|prod> <user_email>");
    process.exit(1);
  }

  const envKey = targetEnv.toLowerCase();
  const mongoUri = ENV_MAP[envKey] || (envKey.startsWith("mongodb") ? targetEnv : null);

  if (!mongoUri) {
    console.error(`❌ Environnement invalide: '${targetEnv}'. Choisissez parmi: dev, preview, prod ou fournissez un URI MongoDB complet.`);
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();

  console.log(`⚠️  SUPPRESSION DE L'UTILISATEUR ET DE SES DONNÉES ASSOCIÉES`);
  console.log(`📌 Target Env: ${envKey.toUpperCase()}`);
  console.log(`📌 Mongo URI: ${mongoUri.replace(/:([^@]+)@/, ":****@")}`);
  console.log(`📌 User Email: ${cleanEmail}`);

  try {
    console.log("🔌 Connexion à MongoDB...");
    await mongoose.connect(mongoUri);

    // 1. Recherche de l'utilisateur
    const user = await UserModel.findOne({ email: cleanEmail });
    if (!user) {
      console.log(`⚠️ Aucun utilisateur trouvé avec l'email: ${cleanEmail}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const userId = user._id;
    console.log(`✅ Utilisateur trouvé ID: ${userId}`);

    // 2. Recherche des commerces (merchants) associés
    const merchants = await CommerceMerchantModel.find({ ownerId: userId });
    const merchantIds = merchants.map(m => m._id);
    console.log(`📊 ${merchantIds.length} commerce(s) trouvé(s) associé(s) à cet utilisateur.`);

    if (merchantIds.length > 0) {
      console.log("🧹 Suppression des données associées aux commerces...");

      const convIds = await CommerceConversationModel.find({ merchantId: { $in: merchantIds } }).distinct("_id");

      console.log("- Deleting messages...");
      await CommerceMessageModel.deleteMany({ conversationId: { $in: convIds } });

      console.log("- Deleting conversations...");
      await CommerceConversationModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting orders...");
      await CommerceOrderModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting customers...");
      await CommerceCustomerModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting products...");
      await CommerceProductModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting knowledge bases...");
      await CommerceKnowledgeModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting marketing campaigns...");
      await MarketingCampaignModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting transactions...");
      await TransactionModel.deleteMany({ merchantId: { $in: merchantIds } });

      console.log("- Deleting merchants...");
      await CommerceMerchantModel.deleteMany({ ownerId: userId });
    }

    // 3. Suppression du compte utilisateur
    console.log("- Deleting user account...");
    await UserModel.deleteOne({ _id: userId });

    console.log(`🎉 Succès : Utilisateur ${cleanEmail} et toutes ses données dépendantes ont été supprimés.`);

    // 4. Nettoyage Redis si disponible en variable d'environnement
    if (env.REDIS_URL) {
      try {
        const redis = new Redis(env.REDIS_URL);
        await redis.flushall();
        console.log("✅ Cache Redis vidé.");
        await redis.quit();
      } catch (err) {
        console.warn("⚠️ Ne peut pas vider le cache Redis (ignoré):", err);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'utilisateur:", error);
    process.exit(1);
  }
}

const targetEnv = process.argv[2];
const emailArg = process.argv[3];
deleteUserByEmail(targetEnv, emailArg);
