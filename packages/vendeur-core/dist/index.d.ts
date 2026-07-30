import { z } from "zod";
export declare const commerceCategories: readonly ["fashion", "food", "beauty", "electronics", "services", "digital", "artisan", "other"];
export declare const commerceLanguages: readonly ["fr", "en", "wolof", "yoruba", "lingala"];
export declare const commerceAgentTones: readonly ["friendly", "professional", "premium", "dynamic"];
export declare const commerceResponseStyles: readonly ["short", "normal", "detailed"];
export declare const commerceOrderStatuses: readonly ["pending", "confirmed", "paid", "delivery", "completed", "cancelled"];
export declare const commercePaymentProviders: readonly ["wave", "orange_money", "mtn_momo", "moov_money", "visa", "cash"];
export declare const commercePaymentStatuses: readonly ["waiting", "pending", "succeeded", "failed", "cancelled"];
export declare const merchantSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    businessName: z.ZodString;
    category: z.ZodEnum<["fashion", "food", "beauty", "electronics", "services", "digital", "artisan", "other"]>;
    description: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    city: z.ZodString;
    address: z.ZodString;
    phone: z.ZodString;
    whatsappNumber: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodEnum<["fr", "en", "wolof", "yoruba", "lingala"]>>;
    paymentChannels: z.ZodDefault<z.ZodArray<z.ZodObject<{
        provider: z.ZodEnum<["wave", "orange_money", "mtn_momo", "moov_money", "visa", "cash"]>;
        label: z.ZodString;
        number: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: string;
        provider: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "visa" | "cash";
        label: string;
    }, {
        number: string;
        provider: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "visa" | "cash";
        label: string;
    }>, "many">>;
    subscription: z.ZodObject<{
        plan: z.ZodDefault<z.ZodEnum<["starter", "premium", "business"]>>;
        status: z.ZodDefault<z.ZodEnum<["trial", "active", "past_due", "cancelled"]>>;
        expiresAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "cancelled" | "trial" | "active" | "past_due";
        plan: "premium" | "starter" | "business";
        expiresAt: string | null;
    }, {
        expiresAt: string | null;
        status?: "cancelled" | "trial" | "active" | "past_due" | undefined;
        plan?: "premium" | "starter" | "business" | undefined;
    }>;
    aiSettings: z.ZodObject<{
        personality: z.ZodDefault<z.ZodEnum<["friendly", "professional", "premium", "dynamic"]>>;
        responseStyle: z.ZodDefault<z.ZodEnum<["short", "normal", "detailed"]>>;
        autoReply: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        personality: "friendly" | "professional" | "premium" | "dynamic";
        responseStyle: "short" | "normal" | "detailed";
        autoReply: boolean;
    }, {
        personality?: "friendly" | "professional" | "premium" | "dynamic" | undefined;
        responseStyle?: "short" | "normal" | "detailed" | undefined;
        autoReply?: boolean | undefined;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    ownerId: string;
    businessName: string;
    category: "fashion" | "food" | "beauty" | "electronics" | "services" | "digital" | "artisan" | "other";
    description: string;
    country: string;
    city: string;
    address: string;
    phone: string;
    whatsappNumber: string;
    currency: string;
    language: "fr" | "en" | "wolof" | "yoruba" | "lingala";
    paymentChannels: {
        number: string;
        provider: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "visa" | "cash";
        label: string;
    }[];
    subscription: {
        status: "cancelled" | "trial" | "active" | "past_due";
        plan: "premium" | "starter" | "business";
        expiresAt: string | null;
    };
    aiSettings: {
        personality: "friendly" | "professional" | "premium" | "dynamic";
        responseStyle: "short" | "normal" | "detailed";
        autoReply: boolean;
    };
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    ownerId: string;
    businessName: string;
    category: "fashion" | "food" | "beauty" | "electronics" | "services" | "digital" | "artisan" | "other";
    description: string;
    city: string;
    address: string;
    phone: string;
    whatsappNumber: string;
    subscription: {
        expiresAt: string | null;
        status?: "cancelled" | "trial" | "active" | "past_due" | undefined;
        plan?: "premium" | "starter" | "business" | undefined;
    };
    aiSettings: {
        personality?: "friendly" | "professional" | "premium" | "dynamic" | undefined;
        responseStyle?: "short" | "normal" | "detailed" | undefined;
        autoReply?: boolean | undefined;
    };
    createdAt: string;
    updatedAt: string;
    country?: string | undefined;
    currency?: string | undefined;
    language?: "fr" | "en" | "wolof" | "yoruba" | "lingala" | undefined;
    paymentChannels?: {
        number: string;
        provider: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "visa" | "cash";
        label: string;
    }[] | undefined;
}>;
export type Merchant = z.infer<typeof merchantSchema>;
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    merchantId: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    images: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    stock: z.ZodDefault<z.ZodNumber>;
    availability: z.ZodDefault<z.ZodEnum<["available", "limited", "sold_out", "hidden"]>>;
    aiMetadata: z.ZodObject<{
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        tiktokCaption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags: string[];
        tiktokCaption?: string | undefined;
    }, {
        tags?: string[] | undefined;
        tiktokCaption?: string | undefined;
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    category: string;
    description: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
    merchantId: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    availability: "available" | "limited" | "sold_out" | "hidden";
    aiMetadata: {
        tags: string[];
        tiktokCaption?: string | undefined;
    };
}, {
    id: string;
    category: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    merchantId: string;
    name: string;
    price: number;
    aiMetadata: {
        tags?: string[] | undefined;
        tiktokCaption?: string | undefined;
    };
    currency?: string | undefined;
    images?: string[] | undefined;
    stock?: number | undefined;
    availability?: "available" | "limited" | "sold_out" | "hidden" | undefined;
}>;
export type Product = z.infer<typeof productSchema>;
export declare const orderSchema: z.ZodObject<{
    id: z.ZodString;
    merchantId: z.ZodString;
    customerId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        name: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
    }, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
    }>, "many">;
    totalAmount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    status: z.ZodEnum<["pending", "confirmed", "paid", "delivery", "completed", "cancelled"]>;
    paymentStatus: z.ZodEnum<["waiting", "pending", "succeeded", "failed", "cancelled"]>;
    paymentProvider: z.ZodOptional<z.ZodEnum<["wave", "orange_money", "mtn_momo", "moov_money", "visa", "cash"]>>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "pending" | "confirmed" | "paid" | "delivery" | "completed" | "cancelled";
    currency: string;
    createdAt: string;
    updatedAt: string;
    merchantId: string;
    customerId: string;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
    }[];
    totalAmount: number;
    paymentStatus: "pending" | "cancelled" | "waiting" | "succeeded" | "failed";
    paymentProvider?: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "visa" | "cash" | undefined;
    deliveryAddress?: string | undefined;
}, {
    id: string;
    status: "pending" | "confirmed" | "paid" | "delivery" | "completed" | "cancelled";
    createdAt: string;
    updatedAt: string;
    merchantId: string;
    customerId: string;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
    }[];
    totalAmount: number;
    paymentStatus: "pending" | "cancelled" | "waiting" | "succeeded" | "failed";
    currency?: string | undefined;
    paymentProvider?: "wave" | "orange_money" | "mtn_momo" | "moov_money" | "visa" | "cash" | undefined;
    deliveryAddress?: string | undefined;
}>;
export type Order = z.infer<typeof orderSchema>;
export declare const conversationSchema: z.ZodObject<{
    id: z.ZodString;
    merchantId: z.ZodString;
    customerId: z.ZodString;
    status: z.ZodEnum<["active", "needs_human", "converted", "closed"]>;
    lastMessageAt: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "active" | "needs_human" | "converted" | "closed";
    createdAt: string;
    merchantId: string;
    customerId: string;
    lastMessageAt: string;
}, {
    id: string;
    status: "active" | "needs_human" | "converted" | "closed";
    createdAt: string;
    merchantId: string;
    customerId: string;
    lastMessageAt: string;
}>;
export type Conversation = z.infer<typeof conversationSchema>;
