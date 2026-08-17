import mongoose from "mongoose";
import { OfferModel } from "../modules/commerce/offer.model.js";
import { env } from "../config/env.js";

import { DEFAULT_OFFERS } from "../modules/commerce/offers.constants.js";

async function seed() {
  console.log("Seed offers starting...");
  if (!env.MONGODB_URI) {
    console.error("MONGODB_URI not found");
    return;
  }

  await mongoose.connect(env.MONGODB_URI);

  for (const offer of DEFAULT_OFFERS) {
    await OfferModel.findOneAndUpdate(
      { slug: offer.slug },
      offer,
      { upsert: true, new: true }
    );
    console.log(`Offer ${offer.slug} seeded.`);
  }

  await mongoose.disconnect();
  console.log("Seed offers completed.");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
