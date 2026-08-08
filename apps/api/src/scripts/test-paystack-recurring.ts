import { connectDatabase } from "../config/database.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env.js";
import mongoose from "mongoose";

const API_URL = "http://localhost:3001";

async function test() {
  await connectDatabase();
  console.log("🚀 Testing Paystack Recurring Webhooks...");

  // 1. Setup test merchant
  const userId = "recurring-test-user";
  await CommerceMerchantModel.findOneAndUpdate(
    { ownerId: userId },
    {
      businessName: "Recurring Shop",
      subscription: {
        status: "active",
        expiresAt: new Date(),
        plan: "premium"
      }
    },
    { upsert: true }
  );

  // 2. Simulate charge.success with subscription data
  const payload = {
    event: "charge.success",
    data: {
      reference: "test-ref-" + Date.now(),
      amount: 500000,
      currency: "XOF",
      paid_at: new Date().toISOString(),
      channel: "card",
      plan: "PLN_test123",
      subscription_code: "SUB_test456",
      email_token: "TOK_test789",
      next_payment_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      metadata: {
        userId,
        type: "subscription"
      }
    }
  };

  const body = JSON.stringify(payload);
  // Security Fix Verification: generating a real HMAC signature for tests if secret is available
  const secret = env.PAYSTACK_WEBHOOK_SECRET || "test-secret";
  const signature = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  console.log("⏳ Sending simulated charge.success webhook...");
  console.log(`📡 Signature used: ${signature.substring(0, 10)}...`);

  try {
    const res = await axios.post(`${API_URL}/api/commerce/webhooks/paystack`, body, {
      headers: {
        "x-paystack-signature": signature,
        "Content-Type": "application/json"
      }
    });
    console.log(`✅ Webhook Response: ${res.status}`);
  } catch (err: any) {
    console.error("❌ Webhook Failed:", err.response?.data || err.message);
  }

  // 3. Verify DB Update
  const updated = await CommerceMerchantModel.findOne({ ownerId: userId });
  console.log("📊 Updated Merchant Subscription Data:");
  console.log(JSON.stringify(updated?.subscription, null, 2));

  if (updated?.subscription?.subscriptionCode === "SUB_test456") {
    console.log("✅ SUCCESS: Recurring data correctly stored in DB.");
  } else {
    console.log("❌ FAILED: Recurring data not found.");
  }

  mongoose.connection.close();
}

test().catch(console.error);
