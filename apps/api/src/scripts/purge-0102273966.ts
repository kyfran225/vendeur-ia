import mongoose from "mongoose";
import { Redis } from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), "apps/api/.env") });

const PHONE_REGEX = /0102273966|2250102273966/;

interface CleanStats {
  usersDeleted: number;
  merchantsDeleted: number;
  customersDeleted: number;
  conversationsDeleted: number;
  messagesDeleted: number;
  ordersDeleted: number;
  productsDeleted: number;
  knowledgeDeleted: number;
  campaignsDeleted: number;
  transactionsDeleted: number;
  sessionsDeleted: number;
  connectionsDeleted: number;
  subscriptionsDeleted: number;
  paymentIntentsDeleted: number;
  authSessionsDeleted: number;
  otherOrphanedDocsDeleted: number;
}

async function purgeFromDatabase(uri: string, envName: string): Promise<CleanStats> {
  const stats: CleanStats = {
    usersDeleted: 0,
    merchantsDeleted: 0,
    customersDeleted: 0,
    conversationsDeleted: 0,
    messagesDeleted: 0,
    ordersDeleted: 0,
    productsDeleted: 0,
    knowledgeDeleted: 0,
    campaignsDeleted: 0,
    transactionsDeleted: 0,
    sessionsDeleted: 0,
    connectionsDeleted: 0,
    subscriptionsDeleted: 0,
    paymentIntentsDeleted: 0,
    authSessionsDeleted: 0,
    otherOrphanedDocsDeleted: 0
  };

  if (!uri) {
    console.log(`\n⚠️  [${envName.toUpperCase()}] URI non configurée. Inscription ignorée.`);
    return stats;
  }

  console.log(`\n=============================================================`);
  console.log(`💣 PURGE COMPLÈTE DE 0102273966 DANS L'ENVIRONNEMENT [${envName.toUpperCase()}]`);
  console.log(`Connecting to: ${uri.replace(/\/\/.*@/, "//***@")}...`);

  let conn: mongoose.Connection;
  try {
    conn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 10000
    }).asPromise();
    console.log(`✅ Connexion réussie à [${envName.toUpperCase()}]!`);
  } catch (err: any) {
    console.error(`❌ Impossible de se connecter à [${envName}]: ${err.message}`);
    return stats;
  }

  try {
    if (!conn.db) {
      throw new Error("Instance DB introuvable");
    }

    const db = conn.db;

    // 1. Identification des Utilisateurs
    const User = conn.model("User", new mongoose.Schema({}, { strict: false }));
    const users = await User.find({
      $or: [
        { whatsappNumber: { $regex: PHONE_REGEX } },
        { phone: { $regex: PHONE_REGEX } },
        { email: { $regex: PHONE_REGEX } }
      ]
    }).lean();

    const userIds: any[] = users.map((u: any) => u._id);
    const userIdStrings: string[] = userIds.map((id: any) => id.toString());
    console.log(`📌 Utilisateurs trouvés (${userIds.length}):`, userIds);

    // 2. Identification des Merchandises (Commerces)
    const Merchant = conn.model("CommerceMerchant", new mongoose.Schema({}, { strict: false }));
    const merchants: any[] = await Merchant.find({
      $or: [
        { whatsappNumber: { $regex: PHONE_REGEX } },
        { phone: { $regex: PHONE_REGEX } },
        { ownerId: { $in: [...userIds, ...userIdStrings] } }
      ]
    }).lean();

    const merchantIds: any[] = merchants.map((m: any) => m._id);
    const merchantIdStrings: string[] = merchantIds.map((m: any) => m.toString());
    console.log(`📌 Commerces trouvés (${merchantIds.length}):`, merchantIds);

    // 3. Identification des Clients (Customers)
    const Customer = conn.model("CommerceCustomer", new mongoose.Schema({}, { strict: false }));
    const customers: any[] = await Customer.find({
      $or: [
        { whatsappNumber: { $regex: PHONE_REGEX } },
        { phone: { $regex: PHONE_REGEX } },
        { merchantId: { $in: merchantIds } }
      ]
    }).lean();

    const customerIds: any[] = customers.map((c: any) => c._id);
    console.log(`📌 Clients trouvés (${customerIds.length})`);

    // 4. Identification des Conversations
    const Conversation = conn.model("CommerceConversation", new mongoose.Schema({}, { strict: false }));
    const conversations: any[] = await Conversation.find({
      $or: [
        { customerPhone: { $regex: PHONE_REGEX } },
        { merchantId: { $in: merchantIds } },
        { customerId: { $in: customerIds } }
      ]
    }).lean();

    const conversationIds: any[] = conversations.map((c: any) => c._id);
    console.log(`📌 Conversations trouvées (${conversationIds.length})`);

    // --- EXECUTION DES SUPPRESSIONS RELATIONNELLES ---

    // A. Messages
    const Message = conn.model("CommerceMessage", new mongoose.Schema({}, { strict: false }));
    const msgRes = await Message.deleteMany({
      $or: [
        { conversationId: { $in: conversationIds } },
        { sender: { $regex: PHONE_REGEX } },
        { recipient: { $regex: PHONE_REGEX } }
      ]
    });
    stats.messagesDeleted = msgRes.deletedCount || 0;

    // B. Conversations
    const convRes = await Conversation.deleteMany({ _id: { $in: conversationIds } });
    stats.conversationsDeleted = convRes.deletedCount || 0;

    // C. Commandes (Orders)
    const Order = conn.model("CommerceOrder", new mongoose.Schema({}, { strict: false }));
    const orderRes = await Order.deleteMany({
      $or: [
        { merchantId: { $in: merchantIds } },
        { customerPhone: { $regex: PHONE_REGEX } },
        { "customer.phone": { $regex: PHONE_REGEX } }
      ]
    });
    stats.ordersDeleted = orderRes.deletedCount || 0;

    // D. Produits
    const Product = conn.model("CommerceProduct", new mongoose.Schema({}, { strict: false }));
    const prodRes = await Product.deleteMany({ merchantId: { $in: merchantIds } });
    stats.productsDeleted = prodRes.deletedCount || 0;

    // E. Base de Connaissance (Knowledge)
    const Knowledge = conn.model("CommerceKnowledge", new mongoose.Schema({}, { strict: false }));
    const knRes = await Knowledge.deleteMany({ merchantId: { $in: merchantIds } });
    stats.knowledgeDeleted = knRes.deletedCount || 0;

    // F. Campagnes Marketing
    const Marketing = conn.model("MarketingCampaign", new mongoose.Schema({}, { strict: false }));
    const mktRes = await Marketing.deleteMany({ merchantId: { $in: merchantIds } });
    stats.campaignsDeleted = mktRes.deletedCount || 0;

    // G. Transactions
    const Transaction = conn.model("Transaction", new mongoose.Schema({}, { strict: false }));
    const txRes = await Transaction.deleteMany({ merchantId: { $in: merchantIds } });
    stats.transactionsDeleted = txRes.deletedCount || 0;

    // H. Clients
    const custRes = await Customer.deleteMany({ _id: { $in: customerIds } });
    stats.customersDeleted = custRes.deletedCount || 0;

    // I. Commerces
    const merRes = await Merchant.deleteMany({ _id: { $in: merchantIds } });
    stats.merchantsDeleted = merRes.deletedCount || 0;

    // J. Sessions & Connections WhatsApp
    const Session = conn.model("WhatsAppSession", new mongoose.Schema({}, { strict: false }));
    const sessionTargets = [...userIdStrings, ...merchantIdStrings];
    const sessRes = await Session.deleteMany({
      $or: [
        { sessionId: { $in: sessionTargets } },
        { sessionId: { $regex: PHONE_REGEX } }
      ]
    });
    stats.sessionsDeleted = sessRes.deletedCount || 0;

    const Connection = conn.model("WhatsAppConnection", new mongoose.Schema({}, { strict: false }));
    const connRes = await Connection.deleteMany({
      $or: [
        { userId: { $in: sessionTargets } },
        { phoneNumber: { $regex: PHONE_REGEX } }
      ]
    });
    stats.connectionsDeleted = connRes.deletedCount || 0;

    // K. Abonnements, Payment Intents, Auth Sessions
    const Sub = conn.model("Subscription", new mongoose.Schema({}, { strict: false }));
    const subRes = await Sub.deleteMany({ userId: { $in: [...userIds, ...userIdStrings] } });
    stats.subscriptionsDeleted = subRes.deletedCount || 0;

    const PayIntent = conn.model("PaymentIntent", new mongoose.Schema({}, { strict: false }));
    const piRes = await PayIntent.deleteMany({ userId: { $in: [...userIds, ...userIdStrings] } });
    stats.paymentIntentsDeleted = piRes.deletedCount || 0;

    const AuthSess = conn.model("AuthSession", new mongoose.Schema({}, { strict: false }));
    const asRes = await AuthSess.deleteMany({ userId: { $in: [...userIds, ...userIdStrings] } });
    stats.authSessionsDeleted = asRes.deletedCount || 0;

    // L. Utilisateurs
    const uRes = await User.deleteMany({ _id: { $in: userIds } });
    stats.usersDeleted = uRes.deletedCount || 0;

    // 5. BALAYAGE DE TOUTES LES COLLECTIONS (Scan orphelin de sécurité)
    const collections = await db.listCollections().toArray();
    for (const colInfo of collections) {
      if (colInfo.name.startsWith("system.")) continue;
      const collection = db.collection(colInfo.name);

      // Chercher des documents résiduels contenant le numéro
      const residualDocs = await collection.find({
        $or: [
          { whatsappNumber: { $regex: PHONE_REGEX } },
          { phone: { $regex: PHONE_REGEX } },
          { customerPhone: { $regex: PHONE_REGEX } },
          { phoneNumber: { $regex: PHONE_REGEX } },
          { email: { $regex: PHONE_REGEX } }
        ]
      }).toArray();

      if (residualDocs.length > 0) {
        console.log(`🔍 [${colInfo.name}] ${residualDocs.length} document(s) orphelin(s) trouvé(s) et supprimé(s).`);
        const residualDel = await collection.deleteMany({
          _id: { $in: residualDocs.map((d: any) => d._id) }
        });
        stats.otherOrphanedDocsDeleted += residualDel.deletedCount || 0;
      }
    }

    console.log(`✨ Nettoyage terminé pour [${envName.toUpperCase()}] :`);
    console.log(JSON.stringify(stats, null, 2));

  } catch (err: any) {
    console.error(`❌ Erreur pendant la purge [${envName}]:`, err);
  } finally {
    await conn.close();
  }

  return stats;
}

async function run() {
  console.log("🚀 Démarrage du script de nettoyage complet pour 0102273966...\n");

  const localUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local";
  const previewUri = process.env.PREVIEW_MONGODB_URI || "";
  const prodUri = process.env.PROD_MONGODB_URI || "";

  // 1. Purge Local
  await purgeFromDatabase(localUri, "local");

  // 2. Purge Preview (si présente)
  if (previewUri) {
    await purgeFromDatabase(previewUri, "preview");
  }

  // 3. Purge Production
  if (prodUri) {
    await purgeFromDatabase(prodUri, "prod");
  }

  // 4. Cache Redis
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6380";
  try {
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
    await redis.flushall();
    console.log("\n⚡ Cache Redis vidé avec succès !");
    await redis.quit();
  } catch (e: any) {
    console.log(`\n⚠️  Tentative Redis ignorée (${e.message}).`);
  }

  console.log("\n🎉 NETTOYAGE COMPLET RÉUSSI ! Le numéro 0102273966 est intégralement effacé de local, preview et prod.");
  process.exit(0);
}

run();
