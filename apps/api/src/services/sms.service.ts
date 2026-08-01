import { env } from "../config/env.js";
import axios from "axios";

export class SMSService {
  async sendAlert(phone: string, message: string) {
    console.log(`[SMS ALERT] Sending to ${phone}: ${message}`);

    // Logic for SMS Provider (e.g. CinetPay, Twilio, etc.)
    // For now, we simulate success to provide immediate value
    if (env.NODE_ENV === 'production') {
      try {
        // Example implementation with a generic SMS gateway
        // await axios.post("https://api.sms-gateway.com/send", {
        //   to: phone,
        //   text: message,
        //   apiKey: env.SMS_API_KEY
        // });
      } catch (error) {
        console.error("[SMS Service] Failed to send SMS:", error);
      }
    }
  }
}

export const smsService = new SMSService();
