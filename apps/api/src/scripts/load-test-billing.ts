import { connectDatabase } from "../config/database.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { billingService } from "../services/billing.service.js";
import { billingQueue } from "../services/billing-queue.service.js";
import mongoose from "mongoose";

async function runLoadTest(count: number = 1000) {
  await connectDatabase();
  console.log(`🚀 Starting Load Test: Generating ${count} merchants...`);

  // 1. Cleanup previous test data
  await CommerceMerchantModel.deleteMany({ ownerId: /^load-test-/ });

  // 2. Bulk insert merchants
  const now = new Date();
  const merchants = [];
  for (let i = 0; i < count; i++) {
    const expiresAt = new Date(now);
    // Mix expirations: some D-3, some D-1, some Expired
    const type = i % 3;
    if (type === 0) expiresAt.setDate(now.getDate() + 2); // D-3 range
    if (type === 1) expiresAt.setHours(now.getHours() + 12); // D-1 range
    if (type === 2) expiresAt.setHours(now.getHours() - 36); // Expired range

    merchants.push({
      ownerId: `load-test-user-${i}`,
      businessName: `Load Test Shop ${i}`,
      city: "Abidjan",
      category: "other",
      subscription: {
        plan: i % 2 === 0 ? "premium" : "business",
        status: "active",
        expiresAt: expiresAt
      },
      whatsappNumber: "+22500000000"
    });
  }

  await CommerceMerchantModel.insertMany(merchants);
  console.log(`✅ ${count} merchants inserted.`);

  // 3. Clear Queue
  await billingQueue.drain();
  console.log("🧹 Queue drained.");

  // 4. Trigger Billing Check
  console.time("BillingCheckTime");
  await billingService.checkExpirations();
  console.timeEnd("BillingCheckTime");

  // 5. Monitor Queue Stats
  const waitingCount = await billingQueue.getWaitingCount();
  const activeCount = await billingQueue.getActiveCount();
  console.log(`📊 Queue Stats: Waiting=${waitingCount}, Active=${activeCount}`);

  console.log("\n💡 Observation: Look at the logs to see workers processing jobs.");
  console.log("Keep the process running for a bit to observe processing speed.");

  // Wait 10s then exit
  setTimeout(() => {
    console.log("🏁 Load test script finished. Use Ctrl+C to stop worker logs if running.");
    mongoose.connection.close();
    process.exit(0);
  }, 10000);
}

const count = parseInt(process.argv[2]) || 1000;
runLoadTest(count).catch(console.error);
