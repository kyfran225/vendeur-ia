import axios from "axios";
import { env } from "../config/env.js";
const PAYSTACK_URL = "https://api.paystack.co";
export class PaystackService {
    get headers() {
        return {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
        };
    }
    async initializeSubscription(email, amount) {
        const response = await axios.post(`${PAYSTACK_URL}/transaction/initialize`, {
            email,
            amount: amount * 100, // Paystack works in kobo/cents
            currency: "XOF",
            callback_url: `${env.CLIENT_URL}/payment/callback`,
            metadata: {
                type: "subscription",
                plan: "premium"
            }
        }, { headers: this.headers });
        return response.data.data;
    }
    async verifyTransaction(reference) {
        const response = await axios.get(`${PAYSTACK_URL}/transaction/verify/${reference}`, {
            headers: this.headers
        });
        return response.data.data;
    }
}
export const paystackService = new PaystackService();
