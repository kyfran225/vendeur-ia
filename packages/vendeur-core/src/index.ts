import { z } from "zod";

export * from "./data/countries.js";
export * from "./data/cities.js";
export * from "./data/currencies.js";

// --- Enums & Constants ---

export const commerceCategories = ["fashion", "food", "beauty", "electronics", "services", "digital", "artisan", "home", "grocery", "health", "auto", "other"] as const;
export const commerceLanguages = ["fr", "en", "wolof", "yoruba", "lingala"] as const;
export const commerceAgentTones = ["friendly", "professional", "premium", "dynamic"] as const;
export const commerceResponseStyles = ["short", "normal", "detailed"] as const;
export const commerceOrderStatuses = ["pending", "confirmed", "paid", "delivery", "completed", "cancelled"] as const;
export const commercePaymentProviders = ["wave", "orange_money", "mtn_momo", "moov_money", "visa", "cash"] as const;
export const commercePaymentStatuses = ["waiting", "pending", "succeeded", "failed", "cancelled"] as const;

// --- Subscription & Offers ---

export const subscriptionPlans = ["starter", "essential", "pro"] as const;
export const subscriptionStatuses = ["pending", "active", "past_due", "cancelled", "expired", "scheduled_change"] as const;
export const whatsappConnectionStatuses = ["NOT_CONNECTED", "CONNECTING", "CONNECTED", "DISCONNECTED", "ERROR", "RECONNECTING"] as const;

export const offerSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  monthlyPrice: z.number(),
  currency: z.string(),
  features: z.array(z.string()),
  isActive: z.boolean(),
  setupRequired: z.boolean().default(false),
  setupOptions: z.array(z.object({
    type: z.string(),
    price: z.number(),
    label: z.string()
  })).optional()
});

export type Offer = z.infer<typeof offerSchema>;

export const subscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  offerId: z.string(),
  status: z.enum(subscriptionStatuses),
  billingInterval: z.enum(["monthly", "yearly"]).default("monthly"),
  price: z.number(),
  currency: z.string(),
  startDate: z.string().optional(),
  currentPeriodStart: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
  nextBillingDate: z.string().nullable().optional(),
  paymentMethod: z.enum(['card', 'mobile_money', 'unknown']).default('unknown'),
  provider: z.string().default("paystack"),
  providerSubscriptionId: z.string().optional(),
  cancellationRequestedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  scheduledOfferId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export const whatsAppConnectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  phoneNumber: z.string().optional(),
  status: z.enum(whatsappConnectionStatuses),
  provider: z.enum(['baileys', 'meta']).default('baileys'),
  meta: z.object({
    phoneNumberId: z.string().optional(),
    accessToken: z.string().optional(),
    wabaId: z.string().optional()
  }).optional(),
  connectedAt: z.string().optional(),
  disconnectedAt: z.string().optional(),
  lastSeenAt: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type WhatsAppConnection = z.infer<typeof whatsAppConnectionSchema>;

// --- Merchant ---

export const merchantSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  businessName: z.string(),
  category: z.enum(commerceCategories),
  description: z.string(),
  country: z.string().default("CI"),
  city: z.string(),
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
  // Legacy subscription field - to be deprecated
  subscription: z.object({
    plan: z.string().nullable(),
    status: z.string().nullable(),
    expiresAt: z.string().nullable()
  }).optional(),
  aiSettings: z.object({
    personality: z.enum(commerceAgentTones).default("friendly"),
    responseStyle: z.enum(commerceResponseStyles).default("normal"),
    autoReply: z.boolean().default(true),
    weeklyReport: z.boolean().default(true)
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Merchant = z.infer<typeof merchantSchema>;

// --- Product ---

export const productSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().default("XOF"),
  images: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative().default(0),
  availability: z.enum(["available", "limited", "sold_out", "hidden"]).default("available"),
  isService: z.boolean().optional(),
  aiMetadata: z.object({
    tags: z.array(z.string()).default([]),
    tiktokCaption: z.string().optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Product = z.infer<typeof productSchema>;

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

export type Order = z.infer<typeof orderSchema>;

// --- Conversation ---

export const conversationSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  customerId: z.string(),
  platform: z.enum(["whatsapp", "instagram", "tiktok", "facebook"]).default("whatsapp"),
  status: z.enum(["active", "needs_human", "converted", "closed"]),
  lastMessageAt: z.string(),
  createdAt: z.string()
});

export type Conversation = z.infer<typeof conversationSchema>;
