import mongoose from "mongoose";

async function purgeRemote(uri: string, envName: string) {
  if (!uri) {
    console.warn(`⚠️ Skipped ${envName}: URI not provided in environment variables.`);
    return;
  }

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

async function run() {
    // 1. Purge Preview
    const PREVIEW_URI = process.env.PREVIEW_MONGODB_URI || "";
    await purgeRemote(PREVIEW_URI, "preview");

    // 2. Purge Production
    const PROD_URI = process.env.PROD_MONGODB_URI || "";
    await purgeRemote(PROD_URI, "production");

    console.log("\n🏁 All remote purge operations completed.");
    process.exit(0);
}

run();
