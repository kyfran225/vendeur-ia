import mongoose from "mongoose";

async function purgeRemote(uri: string, envName: string) {
  console.log(`\n⚠️  STARTING PURGE OF ${envName.toUpperCase()} DATABASE...`);
  try {
    console.log(`Connecting to ${envName}...`);
    await mongoose.connect(uri);
    console.log(`✅ Connected to ${envName}.`);

    const dbName = mongoose.connection.db?.databaseName;
    console.log(`Dropping database: ${dbName}...`);

    await mongoose.connection.db?.dropDatabase();
    console.log(`✨ Successfully dropped ${envName} database (${dbName}).`);

    await mongoose.disconnect();
    console.log(`Disconnected from ${envName}.`);
  } catch (error) {
    console.error(`❌ FAILED to purge ${envName}:`, error);
  }
}

const PREVIEW_URI = "mongodb+srv://kyfran6_db_user:aF4BAHfgfMckfcDH@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-preview?retryWrites=true&w=majority&appName=VendeuriaCluster";
const PROD_URI = "mongodb+srv://kyfran6_db_user:aF4BAHfgfMckfcDH@vendeuriacluster.uyo7eob.mongodb.net/vendeuria-prod?retryWrites=true&w=majority&appName=VendeuriaCluster";

async function run() {
    // 1. Purge Preview
    await purgeRemote(PREVIEW_URI, "preview");

    // 2. Purge Production
    await purgeRemote(PROD_URI, "production");

    console.log("\n🏁 All remote purge operations completed.");
    process.exit(0);
}

run();
