import mongoose, { Schema } from "mongoose";

const SystemSettingsSchema = new Schema({
  supportWhatsApp: { type: String, default: "+22505111157" },
  pricing: {
    ramContributionFee: { type: Number, default: 5000 },
    packProFee: { type: Number, default: 25000 },
    premiumSubscriptionMonthly: { type: Number, default: 5000 },
    regional: [{
      currency: { type: String, required: true },
      premiumMonthly: { type: Number, required: true },
      businessMonthly: { type: Number, required: true },
      packPro: { type: Number, required: true },
      ramFee: { type: Number, required: true }
    }]
  },
  metaConfig: {
    globalAppId: String,
    globalVerifyToken: String,
    whatsappDefaults: {
      phoneNumberId: String,
      accessToken: String
    }
  },
  aiConfig: {
    providers: [{
      name: { type: String, enum: ['gemini', 'openai', 'groq', 'elevenlabs', 'openrouter'], required: true },
      apiKey: String,
      isActive: { type: Boolean, default: true },
      models: {
        text: { type: String, default: "" },
        vision: { type: String, default: "" },
        audio: { type: String, default: "" }
      },
      quota: {
        limit: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
        resetDate: Date
      }
    }],
    defaultTextProvider: { type: String, default: 'gemini' },
    defaultVisionProvider: { type: String, default: 'gemini' },
    defaultAudioProvider: { type: String, default: 'elevenlabs' },
    lastErrors: [{
      provider: String,
      message: String,
      timestamp: { type: Date, default: Date.now }
    }],
    notificationSettings: {
      enablePush: { type: Boolean, default: true },
      enableEmail: { type: Boolean, default: false },
      alertThreshold: { type: String, enum: ['always', 'high_frequency'], default: 'always' }
    }
  },
  manualPaymentConfig: {
    enabled: { type: Boolean, default: true },
    recipientName: { type: String, default: "Vendeur IA" },
    waveNumber: { type: String, default: "+2250505111157" },
    orangeMoneyNumber: { type: String, default: "+2250708292693" },
    mtnNumber: { type: String, default: "+2250505111157" },
    moovNumber: { type: String, default: "+2250100000000" },
    djamoTag: { type: String, default: "$vendeuria" },
    instructions: { type: String, default: "Effectuez votre transfert vers le numéro correspondant, puis renseignez l'ID de transaction ci-dessous." },
    regionalRoutes: [{
      countryCode: { type: String, required: true },
      waveNumber: String,
      orangeMoneyNumber: String,
      mtnNumber: String,
      moovNumber: String,
      instructions: String
    }],
    autoApproveConfidenceThreshold: { type: Number, default: 95 }
  },
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export const SystemSettingsModel = mongoose.model("SystemSettings", SystemSettingsSchema);
