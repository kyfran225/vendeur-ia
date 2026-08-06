import { connectDatabase } from "../config/database.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { billingService } from "../services/billing.service.js";
import mongoose from "mongoose";

async function test() {
  await connectDatabase();
  console.log("🚀 Testing Billing System...");

  // 1. Create a dummy merchant with expiring subscription (D-2)
  const expiringDate = new Date();
  expiringDate.setDate(expiringDate.getDate() + 2);

  const testMerchant = await CommerceMerchantModel.findOneAndUpdate(
    { ownerId: "test-billing-user" },
    {
      businessName: "Test Billing Shop",
      city: "Abidjan",
      category: "electronics",
      subscription: {
        plan: "premium",
        status: "active",
        expiresAt: expiringDate
      }
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Created test merchant with expiration in 2 days: ${testMerchant.subscription.expiresAt}`);

  // 2. Create a dummy merchant with expired subscription
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 1);

  const expiredMerchant = await CommerceMerchantModel.findOneAndUpdate(
    { ownerId: "test-expired-user" },
    {
      businessName: "Expired Shop",
      city: "Dakar",
      category: "clothing",
      subscription: {
        plan: "premium",
        status: "active",
        expiresAt: expiredDate
      }
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Created test merchant already expired: ${expiredMerchant.subscription.expiresAt}`);

  // 3. Run Billing Check
  console.log("⏳ Running Billing Check...");
  await billingService.checkExpirations();

  // 4. Verify results
  const updatedExpired = await CommerceMerchantModel.findOne({ ownerId: "test-expired-user" });
  console.log(`📊 Expired Merchant Status after check: ${updatedExpired?.subscription.status}`);
  if (updatedExpired?.subscription.status === "past_due") {
    console.log("✅ SUCCESS: Merchant correctly suspended.");
  } else {
    console.log("❌ FAILED: Merchant status not updated.");
  }

  // Cleanup (optional)
  // await CommerceMerchantModel.deleteOne({ ownerId: "test-billing-user" });
  // await CommerceMerchantModel.deleteOne({ ownerId: "test-expired-user" });

  mongoose.connection.close();
}

test().catch(console.error);
