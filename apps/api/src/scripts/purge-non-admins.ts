import mongoose from "mongoose";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { UserModel } from "../modules/auth/user.model.js";
import { AuthSessionModel } from "../modules/auth/auth-session.model.js";
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
import { WhatsAppConnectionModel } from "../modules/commerce/whatsapp-connection.model.js";
import { WhatsAppSessionModel } from "../modules/whatsapp/mongo-auth-state.js";
import { SubscriptionModel } from "../modules/commerce/subscription.model.js";
import { PaymentIntentModel } from "../modules/commerce/payment-intent.model.js";
import { AuditLogModel } from "../modules/commerce/audit-log.model.js";

async function purgeDatabase(uri: string, label: string) {
  if (!uri) {
    console.log(`ℹ️ [${label}] URI non fournie, ignorée.`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`⚠️  STARTING PURGE FOR [${label.toUpperCase()}]`);
  console.log(`========================================`);

  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    console.log(`✅ [${label}] Connecté à MongoDB.`);

    const User = conn.model("User", UserModel.schema);
    const AuthSession = conn.model("AuthSession", AuthSessionModel.schema);
    const Merchant = conn.model("CommerceMerchant", CommerceMerchantModel.schema);
    const Knowledge = conn.model("CommerceKnowledge", CommerceKnowledgeModel.schema);
    const Product = conn.model("CommerceProduct", CommerceProductModel.schema);
    const Customer = conn.model("CommerceCustomer", CommerceCustomerModel.schema);
    const Conversation = conn.model("CommerceConversation", CommerceConversationModel.schema);
    const Message = conn.model("CommerceMessage", CommerceMessageModel.schema);
    const Order = conn.model("CommerceOrder", CommerceOrderModel.schema);
    const MarketingCampaign = conn.model("MarketingCampaign", MarketingCampaignModel.schema);
    const Transaction = conn.model("Transaction", TransactionModel.schema);
    const WhatsAppConnection = conn.model("WhatsAppConnection", WhatsAppConnectionModel.schema);
    const WhatsAppSession = conn.model("WhatsAppSession", WhatsAppSessionModel.schema);
    const Subscription = conn.model("Subscription", SubscriptionModel.schema);
    const PaymentIntent = conn.model("PaymentIntent", PaymentIntentModel.schema);
    const AuditLog = conn.model("AuditLog", AuditLogModel.schema);

    // 1. Identify all Admin Users
    const admins = await User.find({ roles: "admin" });
    const adminIds = admins.map(a => a._id.toString());
    const adminEmails = admins.map(a => a.email);

    console.log(`🛡️ [${label}] ${admins.length} Admin(s) préservé(s) : [${adminEmails.join(", ")}]`);

    // 2. Identify all non-admin users
    const nonAdmins = await User.find({ _id: { $nin: adminIds } });
    const nonAdminIds = nonAdmins.map(u => u._id.toString());

    if (nonAdminIds.length === 0) {
      console.log(`✨ [${label}] Aucun utilisateur non-admin trouvé.`);
    } else {
      const deletedEmails = nonAdmins.map(u => u.email).join(", ");
      console.log(`🗑️ [${label}] Suppression de ${nonAdminIds.length} utilisateurs non-admins : [${deletedEmails}]`);

      const merchants = await Merchant.find({ ownerId: { $in: nonAdminIds } });
      const merchantIds = merchants.map(m => m._id);

      // Delete associated data
      console.log(`- [${label}] Messages...`);
      await Message.deleteMany({
        conversationId: { $in: await Conversation.find({ merchantId: { $in: merchantIds } }).distinct("_id") }
      });

      console.log(`- [${label}] Conversations...`);
      await Conversation.deleteMany({ merchantId: { $in: merchantIds } });

      console.log(`- [${label}] Commandes...`);
      await Order.deleteMany({ merchantId: { $in: merchantIds } });

      console.log(`- [${label}] Clients...`);
      await Customer.deleteMany({ merchantId: { $in: merchantIds } });

      console.log(`- [${label}] Produits...`);
      await Product.deleteMany({ merchantId: { $in: merchantIds } });

      console.log(`- [${label}] Bases de connaissances...`);
      await Knowledge.deleteMany({ merchantId: { $in: merchantIds } });

      console.log(`- [${label}] Campagnes marketing...`);
      await MarketingCampaign.deleteMany({ merchantId: { $in: merchantIds } });

      console.log(`- [${label}] Transactions & Paiements...`);
      await Transaction.deleteMany({ merchantId: { $in: merchantIds } });
      await PaymentIntent.deleteMany({ userId: { $in: nonAdminIds } });
      await Subscription.deleteMany({ userId: { $in: nonAdminIds } });

      console.log(`- [${label}] WhatsApp sessions & connexions...`);
      await WhatsAppConnection.deleteMany({ userId: { $in: nonAdminIds } });
      await WhatsAppSession.deleteMany({ sessionId: { $in: nonAdminIds } });
      // Also delete temporary onboarding sessions
      await WhatsAppSession.deleteMany({ sessionId: { $regex: /^auth_/ } });

      console.log(`- [${label}] Sessions auth & logs...`);
      await AuthSession.deleteMany({ userId: { $in: nonAdminIds } });
      await AuditLog.deleteMany({ userId: { $in: nonAdminIds } });

      console.log(`- [${label}] Boutiques Marchands...`);
      await Merchant.deleteMany({ ownerId: { $in: nonAdminIds } });

      console.log(`- [${label}] Comptes Utilisateurs non-admins...`);
      const userDeleteResult = await User.deleteMany({ _id: { $in: nonAdminIds } });
      console.log(`✅ [${label}] Supprimé avec succès ${userDeleteResult.deletedCount} comptes utilisateurs.`);
    }

    await conn.close();
    console.log(`✨ [${label}] Purge terminée.`);
  } catch (error) {
    console.error(`❌ [${label}] Erreur lors de la purge :`, error);
  }
}

async function run() {
  console.log("🚀 DÉBUT DU NETTOYAGE COMPLET DES BASES (SAUF ADMINS)");

  // 1. Local / Default DB
  if (env.MONGODB_URI) {
    await purgeDatabase(env.MONGODB_URI, "Local / Principal");
  }

  // 2. Preview DB (if configured in process.env)
  const previewUri = process.env.PREVIEW_MONGODB_URI;
  if (previewUri && previewUri !== env.MONGODB_URI) {
    await purgeDatabase(previewUri, "Preview");
  }

  // 3. Prod DB (if configured in process.env)
  const prodUri = process.env.PROD_MONGODB_URI;
  if (prodUri && prodUri !== env.MONGODB_URI && prodUri !== previewUri) {
    await purgeDatabase(prodUri, "Production");
  }

  // 4. Redis Flush
  if (env.REDIS_URL) {
    try {
      const redis = new Redis(env.REDIS_URL);
      await redis.flushall();
      console.log("✅ Cache Redis vidé avec succès.");
      await redis.quit();
    } catch (err) {
      console.warn("⚠️ Redis non connecté ou erreur flushall:", err);
    }
  }

  console.log("\n🏁 Tous les nettoyages de bases sont terminés avec succès !");
  process.exit(0);
}

run();
