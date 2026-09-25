import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { UserModel } from "../modules/auth/user.model.js";
import { commerceService } from "../modules/commerce/commerce.service.js";
import { copilotService } from "../modules/copilot/copilot.service.js";

async function main() {
  const mongoUri = process.env.PROD_MONGODB_URI || process.env.MONGODB_URI;
  console.log("Connecting to Mongo:", mongoUri?.replace(/:([^@]+)@/, ":***@"));
  await mongoose.connect(mongoUri!);

  const allUsers = await UserModel.find({}).limit(20);
  console.log(`Testing ${allUsers.length} user(s)...`);

  for (const u of allUsers) {
    console.log("\n------------------------------------------");
    console.log("Testing user:", u._id.toString(), u.email, u.displayName, "roles:", u.roles);

    try {
      const merchant = await commerceService.getOrCreateMerchant(u._id.toString());
      console.log("Merchant:", merchant._id.toString(), merchant.businessName);

      const knowledge = await commerceService.getKnowledge(merchant._id.toString());
      console.log("Knowledge ID:", knowledge?._id?.toString());

      const suggestions = await copilotService.getSuggestions(merchant._id.toString(), "/admin");
      console.log("Suggestions count:", suggestions.suggestions.length);
    } catch (err: any) {
      console.error(">>> ERROR FOR USER <<<:", u._id.toString(), u.email, err.message, err.stack);
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
