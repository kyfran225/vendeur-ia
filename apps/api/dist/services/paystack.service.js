import axios from "axios";
import { env } from "../config/env.js";
export class PaystackService {
    baseUrl = "https://api.paystack.co";
    async initializeSubscription(email, amountXof) {
        if (!env.PAYSTACK_SECRET_KEY)
            throw new Error("Paystack key not configured");
        const response = await axios.post(`${this.baseUrl}/transaction/initialize`, {
            email,
            amount: amountXof * 100, // Paystack expects kobo/cents
            currency: "XOF",
            callback_url: `${process.env.CLIENT_URL}/dashboard/activation-success`,
            metadata: {
                plan: "studio_premium"
            }
        }, {
            headers: {
                Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        });
        return response.data.data; // contains authorization_url
    }
    async verifyWebhook(signature, payload) {
        // Basic signature verification logic would go here
        // For standalone MVP, we focus on the flow
        return payload.event === "charge.success";
    }
}
export const paystackService = new PaystackService();
