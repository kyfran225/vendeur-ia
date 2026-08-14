import crypto from "crypto";
import axios from "axios";
import { env } from "../config/env.js";

const PAYSTACK_URL = "https://api.paystack.co";

export class PaystackService {
  private get headers() {
    return {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    };
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!env.PAYSTACK_WEBHOOK_SECRET) {
      console.error("[Paystack] Webhook verification failed: PAYSTACK_WEBHOOK_SECRET not configured");
      return false;
    }
    const hash = crypto
      .createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    return hash === signature;
  }

  async initializeSubscription(email: string, amount: number, metadata?: any) {
    const currency = (metadata?.currency || "XOF").toUpperCase();

    // Map channels strictly based on Paystack's official capability per currency
    let channels: string[] = ["card", "mobile_money"];
    if (currency === "NGN") {
      channels = ["card", "bank_transfer", "ussd", "bank"];
    } else if (currency === "KES") {
      channels = ["mobile_money", "card"];
    } else if (currency === "ZAR") {
      channels = ["card", "eft"];
    } else if (currency === "USD" || currency === "EUR" || currency === "GBP") {
      channels = ["card"];
    }

    const payload: any = {
      email,
      amount: amount * 100, // Paystack works in smallest subunit (kobo/cents/francs)
      currency: currency,
      callback_url: `${env.CLIENT_URL}/payment/callback`,
      metadata: metadata || {
        type: "subscription",
        plan: "premium"
      }
    };

    // If a plan is specified in metadata, link it to the transaction for recurring billing
    if (metadata?.planCode) {
      payload.plan = metadata.planCode;
    }

    console.log(`[Paystack] Initializing transaction for ${email}: ${amount} ${currency} (Subunits: ${payload.amount})`);

    try {
      const response = await axios.post(`${PAYSTACK_URL}/transaction/initialize`, payload, { headers: this.headers });
      return response.data.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      console.error(`[Paystack] Initialization failed for ${email}:`, msg);

      // Fallback: If merchant Paystack integration does not support the requested currency or payment channels (e.g. USD card settlement not enabled on account), fallback to XOF with original base amount
      const lowerMsg = (msg || "").toLowerCase();
      if ((lowerMsg.includes("currency not supported") || lowerMsg.includes("no active channel")) && currency !== "XOF") {
        console.warn(`[Paystack] Currency ${currency} or channels not supported on current account integration (${msg}). Falling back to XOF...`);
        const fallbackAmount = metadata?.baseAmount || amount;
        const fallbackPayload = {
          ...payload,
          currency: "XOF",
          amount: fallbackAmount * 100
        };
        const response = await axios.post(`${PAYSTACK_URL}/transaction/initialize`, fallbackPayload, { headers: this.headers });
        return response.data.data;
      }

      throw new Error(`Erreur Paystack: ${msg}`);
    }
  }

  async cancelSubscription(subscriptionCode: string, emailToken: string) {
    const response = await axios.post(`${PAYSTACK_URL}/subscription/disable`, {
      code: subscriptionCode,
      token: emailToken
    }, { headers: this.headers });
    return response.data;
  }

  async verifyTransaction(reference: string) {
    console.log(`[Paystack] Verifying transaction reference: ${reference}`);
    try {
      const response = await axios.get(`${PAYSTACK_URL}/transaction/verify/${reference}`, {
        headers: this.headers
      });
      const data = response.data.data;
      console.log(`[Paystack] Verification result for ${reference}: status=${data?.status}, gateway_response=${data?.gateway_response}, channel=${data?.channel}`);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      console.error(`[Paystack] Verification error for ${reference}:`, msg);
      throw error;
    }
  }
}

export const paystackService = new PaystackService();
