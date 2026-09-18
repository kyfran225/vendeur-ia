import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'apps/api/.env') });

const SystemSettingsSchema = new mongoose.Schema({}, { strict: false });

async function inspect(uri: string, name: string) {
  if (!uri) {
    console.log(`[${name}] No URI provided.`);
    return null;
  }
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    console.log(`\n========================================`);
    console.log(`🔍 INSPECTING ${name.toUpperCase()} DB (${uri.replace(/\/\/.*@/, '//***@')})`);
    
    if (!conn.db) {
      console.error(`[${name}] Database instance not found on connection.`);
      await conn.close();
      return null;
    }
    const collections = await conn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));

    const SystemSettings = conn.model("SystemSettings", SystemSettingsSchema);
    const settings = await SystemSettings.findOne().lean();
    console.log(`\n--- SystemSettings in ${name} ---`);
    if (settings) {
      console.log('AI Providers:', (settings as any).aiConfig?.providers?.map((p: any) => ({
        name: p.name,
        hasKey: !!p.apiKey,
        keyPrefix: p.apiKey ? p.apiKey.substring(0, 10) + '...' : 'none',
        isActive: p.isActive,
        models: p.models
      })));
      console.log('Meta Config:', (settings as any).metaConfig);
      console.log('Push Config:', (settings as any).pushConfig ? { hasVapid: !!(settings as any).pushConfig.vapidPublicKey } : 'none');
      console.log('Manual Payment Config:', (settings as any).manualPaymentConfig);
    } else {
      console.log('No SystemSettings found in DB.');
    }

    const User = conn.model("User", new mongoose.Schema({}, { strict: false }));
    const users = await User.find().lean();
    console.log(`\n--- Users in ${name} (${users.length}) ---`);
    users.forEach((u: any) => {
      console.log(`- ${u._id}: phone=${u.whatsappNumber}, email=${u.email}, name=${u.displayName}, roles=${JSON.stringify(u.roles)}`);
    });

    const Merchant = conn.model("CommerceMerchant", new mongoose.Schema({}, { strict: false }));
    const merchants = await Merchant.find().lean();
    console.log(`\n--- Merchants in ${name} (${merchants.length}) ---`);
    merchants.forEach((m: any) => {
      console.log(`- ${m._id}: businessName="${m.businessName}", phone=${m.phone || m.whatsappNumber}, provider=${m.whatsappConfig?.provider}, status=${m.whatsappConfig?.status}`);
    });

    await conn.close();
    return settings;
  } catch (err: any) {
    console.error(`Error inspecting ${name}:`, err.message);
    return null;
  }
}

async function run() {
  const localUri = process.env.MONGODB_URI || "mongodb://localhost:27017/vendeuria-local";
  const prodUri = process.env.PROD_MONGODB_URI || "";
  const previewUri = process.env.PREVIEW_MONGODB_URI;

  await inspect(localUri, "local");
  await inspect(prodUri, "prod");
  if (previewUri) await inspect(previewUri, "preview");
  
  process.exit(0);
}

run();
