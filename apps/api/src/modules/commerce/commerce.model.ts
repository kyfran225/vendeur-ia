import mongoose, { Schema, Document } from "mongoose";

// --- MERCHANT ---
const MerchantSchema = new Schema({
  ownerId: { type: String, required: true, unique: true, index: true },
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, default: "" },
  country: { type: String, default: "CI" },
  city: { type: String, default: "" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  whatsappNumber: { type: String, default: "" },
  currency: { type: String, default: "XOF" },
  language: { type: String, default: "fr" },
  paymentChannels: [{
    provider: String,
    label: String,
    number: String
  }],
  subscription: {
    plan: { type: String, default: "starter" },
    status: { type: String, default: "trial" },
    expiresAt: { type: Date, default: null }
  },
  aiSettings: {
    personality: { type: String, default: "friendly" },
    responseStyle: { type: String, default: "normal" },
    autoReply: { type: Boolean, default: true },
    voiceMode: { type: Boolean, default: false },
    localSlang: { type: Boolean, default: false }
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
    lastBillingDate: { type: Date, default: null }
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
  }
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
  stock: { type: Number, default: 0 },
  availability: { type: String, enum: ["available", "limited", "sold_out", "hidden"], default: "available" },
  aiMetadata: {
    tags: [String],
    tiktokCaption: String
  }
}, { timestamps: true });

// --- CUSTOMER ---
const CustomerSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  phone: { type: String, required: true, index: true },
  platform: { type: String, enum: ["whatsapp", "instagram", "tiktok"], default: "whatsapp" },
  platformId: { type: String }, // For non-phone IDs like Instagram Scoped ID
  name: String,
  location: String,
  leadScore: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 }
}, { timestamps: true });

// --- CONVERSATION ---
const ConversationSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "CommerceCustomer", required: true },
  platform: { type: String, enum: ["whatsapp", "instagram", "tiktok"], default: "whatsapp" },
  status: { type: String, enum: ["active", "needs_human", "converted", "closed"], default: "active" },
  lastMessageAt: { type: Date, default: Date.now },
  messagesCount: { type: Number, default: 0 },
  aiSummary: { type: String, default: "" }
}, { timestamps: true });

// --- MESSAGE ---
const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "CommerceConversation", required: true, index: true },
  sender: { type: String, enum: ["customer", "ai", "human"], required: true },
  type: { type: String, enum: ["text", "audio", "image"], default: "text" },
  content: { type: String, required: true },
  mediaUrl: String,
  aiMetadata: {
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
  deliveredAt: Date
}, { timestamps: true });

export const CommerceOrderModel = mongoose.model("CommerceOrder", OrderSchema);

// --- MARKETING CAMPAIGN ---
const MarketingCampaignSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: "CommerceProduct" },
  segment: { type: String, required: true },
  content: { type: String, required: true },
  targetCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "active", "completed", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const MarketingCampaignModel = mongoose.model("MarketingCampaign", MarketingCampaignSchema);
