import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'apps/api/.env') });

async function run() {
  const uri = process.env.PROD_MONGODB_URI || 'mongodb://localhost:27017/vendeuria-local';
  const conn = await mongoose.createConnection(uri).asPromise();
  const Merchant = conn.model('CommerceMerchant', new mongoose.Schema({}, { strict: false }));
  const merchants = await Merchant.find().lean();

  console.log('--- MERCHANTS ---');
  merchants.forEach((m: any) => {
    console.log(`- ID: ${m._id}, Business: ${m.businessName}, Owner: ${m.ownerId}, Phone: ${m.phone || m.whatsappNumber}, Provider: ${m.whatsappConfig?.provider}, Status: ${m.whatsappConfig?.status}`);
  });

  await conn.close();
  process.exit(0);
}

run();
