import mongoose, { Schema, Document } from "mongoose";

// --- MERCHANT ---
const MerchantSchema = new Schema({
  ownerId: { type: String, required: true, unique: true, index: true },
  businessName: { type: String, default: "" },
  category: { type: String, default: "" },
  description: { type: String, default: "" },
  country: { type: String, default: "CI" },
  city: { type: String, default: "" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  whatsappNumber: { type: String, default: "" },
  currency: { type: String, default: "XOF" },
  billingCurrency: { type: String, default: "XOF" },
  language: { type: String, default: "fr" },
  paymentChannels: [{
    provider: String,
    label: String,
    number: String
  }],
  subscription: {
    plan: { type: String, default: null },
    status: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    subscriptionCode: { type: String, default: null },
    emailToken: { type: String, default: null },
    nextPaymentDate: { type: Date, default: null },
    paymentMethod: { type: String, enum: ['card', 'mobile_money', 'unknown'], default: 'unknown' }
  },
  aiSettings: {
    personality: { type: String, default: "friendly" },
    responseStyle: { type: String, default: "normal" },
    autoReply: { type: Boolean, default: true },
    voiceMode: { type: Boolean, default: false },
    localSlang: { type: Boolean, default: false },
    weeklyReport: { type: Boolean, default: true }
  },
  whatsappConfig: {
    provider: { type: String, enum: ['baileys', 'meta'], default: 'baileys' },
    meta: {
      phoneNumberId: String,
      accessToken: String,
      verifyToken: String,
      wabaId: String
    },
    status: { type: String, enum: ['disconnected', 'connected', 'error'], default: 'disconnected' },
    lastBillingDate: { type: Date, default: null },
    reconnectAttempts: { type: Number, default: 0 },
    packProAssistance: { type: Boolean, default: false }
  },
  instagramConfig: {
    pageId: String,
    accessToken: String,
    status: { type: String, enum: ['disconnected', 'connected', 'error'], default: 'disconnected' }
  },
  tiktokConfig: {
    openId: String,
    accessToken: String,
    refreshToken: String,
    status: { type: String, enum: ['disconnected', 'connected', 'error'], default: 'disconnected' }
  },
  facebookConfig: {
    pageId: String,
    accessToken: String,
    status: { type: String, enum: ['disconnected', 'connected', 'error'], default: 'disconnected' }
  },
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referredBy: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", index: true },
  referralStats: {
    count: { type: Number, default: 0 },
    earnedMonths: { type: Number, default: 0 }
  },
  loyaltySettings: {
    enabled: { type: Boolean, default: false },
    pointsPerOrder: { type: Number, default: 10 },
    threshold: { type: Number, default: 50 }, // e.g. 5 orders
    rewardDescription: { type: String, default: "une surprise offerte sur votre prochaine commande" }
  },
  marketingAutomations: {
    abandonedCart: { type: Boolean, default: true },
    postPurchaseFollowup: { type: Boolean, default: true }
  },
  lastWeeklyReportDate: { type: Date, default: null }
}, { timestamps: true });

// --- KNOWLEDGE BASE ---
const KnowledgeSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  businessRules: {
    deliveryZones: [String], // Keep for backward compatibility
    deliveryFees: [{
      zone: { type: String, required: true },
      price: { type: Number, required: true }
    }],
    openingHours: String,
    returnPolicy: String,
    paymentMethods: [{
      provider: { type: String, required: true }, // e.g. "Wave", "Orange Money"
      number: { type: String, required: true },
      label: String
    }],
    dynamicInsights: [{
      insight: String,
      type: { type: String, enum: ["product", "customer", "business"], default: "business" },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  faq: [{
    question: String,
    answer: String
  }],
  customInstructions: String
}, { timestamps: true });

// --- PRODUCT ---
const ProductSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: { type: String, default: "" },
  price: { type: Number, required: true },
  currency: { type: String, default: "XOF" },
  images: [String],
  imageUrl: { type: String, default: "" }, // Alias used by frontend uploader
  stock: { type: Number, default: 0 },
  availability: { type: String, enum: ["available", "limited", "sold_out", "hidden"], default: "available" },
  // Domain-specific fields
  isService: { type: Boolean, default: false },
  digitalUrl: { type: String, default: "" },
  digitalFormat: { type: String, default: "" },
  serviceDuration: { type: String, default: "" },
  serviceDeliveryType: { type: String, default: "" },
  preparationTime: { type: String, default: "" },
  foodOptions: { type: String, default: "" },
  aiMetadata: {
    tags: [String],
    tiktokCaption: String,
    embedding: [Number] // For RAG search
  }
}, { timestamps: true });

// --- CUSTOMER ---
const CustomerSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  phone: { type: String, required: true, index: true },
  platform: { type: String, enum: ["whatsapp", "instagram", "tiktok", "facebook", "web"], default: "whatsapp" },
  platformId: { type: String, index: true }, // For non-phone IDs like Instagram Scoped ID or Web Session
  name: String,
  location: String,
  leadScore: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 }
}, { timestamps: true });

// --- CONVERSATION ---
const ConversationSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "CommerceCustomer", required: true },
  platform: { type: String, enum: ["whatsapp", "instagram", "tiktok", "facebook", "web"], default: "whatsapp" },
  status: { type: String, enum: ["active", "needs_human", "converted", "closed"], default: "active" },
  lastMessageAt: { type: Date, default: Date.now },
  messagesCount: { type: Number, default: 0 },
  aiSummary: { type: String, default: "" },
  followUpSent: { type: Boolean, default: false },
  isRecoveryPending: { type: Boolean, default: false }
}, { timestamps: true });

// --- MESSAGE ---
const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "CommerceConversation", required: true, index: true },
  sender: { type: String, enum: ["customer", "ai", "human"], required: true },
  type: { type: String, enum: ["text", "audio", "image"], default: "text" },
  content: { type: String, required: true },
  mediaUrl: String,
  aiMetadata: {
    provider: { type: String, default: 'unknown' },
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 }
  },
  timestamp: { type: Date, default: Date.now }
});

export const CommerceMerchantModel = mongoose.model("CommerceMerchant", MerchantSchema);
export const CommerceKnowledgeModel = mongoose.model("CommerceKnowledge", KnowledgeSchema);
export const CommerceProductModel = mongoose.model("CommerceProduct", ProductSchema);
export const CommerceCustomerModel = mongoose.model("CommerceCustomer", CustomerSchema);
export const CommerceConversationModel = mongoose.model("CommerceConversation", ConversationSchema);
export const CommerceMessageModel = mongoose.model("CommerceMessage", MessageSchema);

// --- ORDER ---
const OrderSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "CommerceCustomer", required: true, index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: "CommerceConversation" },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "CommerceProduct" },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: "XOF" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "paid", "delivered", "cancelled"],
    default: "pending"
  },
  paymentMethod: String,
  shippingAddress: String,
  paidAt: Date,
  deliveredAt: Date,
  recoveredByAi: { type: Boolean, default: false }
}, { timestamps: true });

export const CommerceOrderModel = mongoose.model("CommerceOrder", OrderSchema);

// --- MARKETING CAMPAIGN ---
const MarketingCampaignSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: "CommerceProduct" },
  name: { type: String, default: "Campagne Sans Nom" },
  segment: { type: String, required: true }, // vip, active, inactive, city:xxx, all
  content: { type: String, required: true }, // The core idea/offer
  targetCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  repliedCount: { type: Number, default: 0 }, // Engagement tracking
  repliedCustomerIds: [{ type: Schema.Types.ObjectId, ref: "CommerceCustomer" }],
  revenueGenerated: { type: Number, default: 0 }, // Total revenue attributed to this campaign (in local currency)
  ordersCount: { type: Number, default: 0 }, // Converted orders count
  convertedOrderIds: [{ type: Schema.Types.ObjectId, ref: "CommerceOrder" }],
  scheduledAt: { type: Date, default: null },
  status: { type: String, enum: ["pending", "scheduled", "active", "completed", "failed", "paused"], default: "pending" },
  personalizationLevel: { type: String, enum: ["basic", "ai_creative"], default: "basic" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const MarketingCampaignModel = mongoose.model("MarketingCampaign", MarketingCampaignSchema);
