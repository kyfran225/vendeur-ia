import { z } from "zod";
// --- Enums & Constants ---
export const commerceCategories = ["fashion", "food", "beauty", "electronics", "services", "digital", "artisan", "other"];
export const commerceLanguages = ["fr", "en", "wolof", "yoruba", "lingala"];
export const commerceAgentTones = ["friendly", "professional", "premium", "dynamic"];
export const commerceResponseStyles = ["short", "normal", "detailed"];
export const commerceOrderStatuses = ["pending", "confirmed", "paid", "delivery", "completed", "cancelled"];
export const commercePaymentProviders = ["wave", "orange_money", "mtn_momo", "moov_money", "visa", "cash"];
export const commercePaymentStatuses = ["waiting", "pending", "succeeded", "failed", "cancelled"];
// --- Merchant ---
export const merchantSchema = z.object({
    id: z.string(),
    ownerId: z.string(),
    businessName: z.string(),
    category: z.enum(commerceCategories),
    description: z.string(),
    country: z.string().default("CI"),
    city: z.string().default("Abidjan"),
    address: z.string(),
    phone: z.string(),
    whatsappNumber: z.string(),
    currency: z.string().default("XOF"),
    language: z.enum(commerceLanguages).default("fr"),
    paymentChannels: z.array(z.object({
        provider: z.enum(commercePaymentProviders),
        label: z.string(),
        number: z.string()
    })).default([]),
    countryCode: z.string().default("CI"),
    subscription: z.object({
        plan: z.enum(["starter", "premium", "business"]).default("starter"),
        status: z.enum(["trial", "active", "past_due", "cancelled"]).default("trial"),
        expiresAt: z.string().nullable()
    }),
    aiSettings: z.object({
        personality: z.enum(commerceAgentTones).default("friendly"),
        responseStyle: z.enum(commerceResponseStyles).default("normal"),
        autoReply: z.boolean().default(true)
    }),
    createdAt: z.string(),
    updatedAt: z.string()
});
// --- Product ---
export const productSchema = z.object({
    id: z.string(),
    merchantId: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    price: z.number().nonnegative(),
    currency: z.string().default("XOF"),
    images: z.array(z.string()).default([]),
    stock: z.number().int().nonnegative().default(0),
    availability: z.enum(["available", "limited", "sold_out", "hidden"]).default("available"),
    aiMetadata: z.object({
        tags: z.array(z.string()).default([]),
        tiktokCaption: z.string().optional()
    }),
    createdAt: z.string(),
    updatedAt: z.string()
});
// --- Order ---
export const orderSchema = z.object({
    id: z.string(),
    merchantId: z.string(),
    customerId: z.string(),
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative()
    })),
    totalAmount: z.number().nonnegative(),
    currency: z.string().default("XOF"),
    status: z.enum(commerceOrderStatuses),
    paymentStatus: z.enum(commercePaymentStatuses),
    paymentProvider: z.enum(commercePaymentProviders).optional(),
    deliveryAddress: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string()
});
// --- Conversation ---
export const conversationSchema = z.object({
    id: z.string(),
    merchantId: z.string(),
    customerId: z.string(),
    status: z.enum(["active", "needs_human", "converted", "closed"]),
    lastMessageAt: z.string(),
    createdAt: z.string()
});
