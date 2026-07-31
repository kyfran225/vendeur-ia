import mongoose, { Schema } from "mongoose";
// --- MERCHANT ---
const MerchantSchema = new Schema({
    ownerId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    country: { type: String, default: "CI" },
    city: { type: String, default: "Abidjan" },
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
        autoReply: { type: Boolean, default: true }
    }
}, { timestamps: true });
// --- KNOWLEDGE BASE ---
const KnowledgeSchema = new Schema({
    merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
    businessRules: {
        deliveryZones: [String],
        openingHours: String,
        returnPolicy: String,
        paymentMethods: [String]
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
    name: String,
    location: String,
    leadScore: { type: Number, default: 0 }
}, { timestamps: true });
// --- CONVERSATION ---
const ConversationSchema = new Schema({
    merchantId: { type: Schema.Types.ObjectId, ref: "CommerceMerchant", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "CommerceCustomer", required: true },
    status: { type: String, enum: ["active", "needs_human", "converted", "closed"], default: "active" },
    lastMessageAt: { type: Date, default: Date.now },
    messagesCount: { type: Number, default: 0 }
}, { timestamps: true });
// --- MESSAGE ---
const MessageSchema = new Schema({
    conversationId: { type: Schema.Types.ObjectId, ref: "CommerceConversation", required: true, index: true },
    sender: { type: String, enum: ["customer", "ai", "human"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
export const CommerceMerchantModel = mongoose.model("CommerceMerchant", MerchantSchema);
export const CommerceKnowledgeModel = mongoose.model("CommerceKnowledge", KnowledgeSchema);
export const CommerceProductModel = mongoose.model("CommerceProduct", ProductSchema);
export const CommerceCustomerModel = mongoose.model("CommerceCustomer", CustomerSchema);
export const CommerceConversationModel = mongoose.model("CommerceConversation", ConversationSchema);
export const CommerceMessageModel = mongoose.model("CommerceMessage", MessageSchema);
