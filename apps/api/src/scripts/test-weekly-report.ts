import { connectDatabase } from "../config/database.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { reportingService } from "../services/reporting.service.js";
import { logger } from "../services/logger.service.js";

async function testReport() {
  await connectDatabase();

  const merchant = await CommerceMerchantModel.findOne({ "whatsappConfig.status": "connected" });

  if (!merchant) {
    console.log("❌ No connected merchant found for testing.");
    process.exit(1);
  }

  console.log(`🚀 Testing report for: ${merchant.businessName}`);

  try {
    // Force report generation even if it's not Monday
    await reportingService.generateAndSendReport(merchant);
    console.log("✅ Report test completed successfully.");
  } catch (err) {
    console.error("❌ Report test failed:", err);
  }

  process.exit(0);
}

testReport().catch(err => {
  console.error(err);
  process.exit(1);
});
