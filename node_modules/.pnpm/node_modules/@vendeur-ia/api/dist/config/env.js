import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().default("3001"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    WHATSAPP_PHONE_ID: z.string().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    PAYSTACK_SECRET_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    CLIENT_URL: z.string().default("http://localhost:5173")
});
export const env = envSchema.parse(process.env);
