import crypto from "crypto";
import { PaymentIntentModel, IPaymentIntent } from "../modules/commerce/payment-intent.model.js";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";
import { CommerceMerchantModel } from "../modules/commerce/commerce.model.js";
import { SubscriptionModel } from "../modules/commerce/subscription.model.js";
import { OfferModel } from "../modules/commerce/offer.model.js";
import { TransactionModel } from "../modules/commerce/transaction.model.js";
import { UserModel } from "../modules/auth/user.model.js";
import { whatsappService } from "../modules/whatsapp/whatsapp.service.js";
import { messagingService } from "./messaging.service.js";
import { pushService } from "./push.service.js";
import { logger } from "./logger.service.js";
import { emitToUser } from "../realtime/socketServer.js";

export class PaymentService {
  public static readonly RATES: Record<string, { rate: number; round: number; symbol: string }> = {
    XOF: { rate: 1, round: 500, symbol: "CFA" },
    XAF: { rate: 1, round: 500, symbol: "FCFA" },
    GNF: { rate: 14, round: 5000, symbol: "FG" },
    NGN: { rate: 2.5, round: 100, symbol: "₦" },
    GHS: { rate: 0.025, round: 5, symbol: "GH₵" },
    KES: { rate: 0.22, round: 50, symbol: "KSh" },
    MAD: { rate: 0.016, round: 10, symbol: "DH" },
    DZD: { rate: 0.22, round: 50, symbol: "DA" },
    TND: { rate: 0.005, round: 1, symbol: "DT" },
    CDF: { rate: 4.6, round: 500, symbol: "FC" },
    MRU: { rate: 0.065, round: 10, symbol: "UM" },
    EUR: { rate: 0.00152, round: 1, symbol: "€" },
    USD: { rate: 0.00165, round: 1, symbol: "$" },
    ZAR: { rate: 0.03, round: 5, symbol: "R" }
  };

  /**
   * Generates a clean human-readable reference, e.g. VIA-2608-A7K9
   */
  generateReference(): string {
    const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // e.g. 2608
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `VIA-${dateStr}-${randNum}-${randomHex}`;
  }

  /**
   * Retrieves public/operational manual payment settings for the checkout screen
   */
  async getPaymentConfig(countryCode?: string, amountXof?: number) {
    let settings = await SystemSettingsModel.findOne();
    if (!settings) {
      settings = await SystemSettingsModel.create({});
    }

    const cfg = (settings as any).manualPaymentConfig || {
      enabled: true,
      recipientName: "Vendeur IA",
      waveNumber: "+2250505111157",
      orangeMoneyNumber: "+2250708292693",
      mtnNumber: "+2250505111157",
      moovNumber: "+2250100000000",
      djamoTag: "$vendeuria",
      instructions: "Effectuez votre transfert vers le numéro correspondant avec votre référence en motif.",
      regionalRoutes: [],
      autoApproveConfidenceThreshold: 95
    };

    // Regional override logic
    let regional = cfg.regionalRoutes?.find((r: any) => r.countryCode === (countryCode || "").toUpperCase());

    // Regional smart routing based on 2024-2025 fintech corridors (UEMOA Interoperability)
    const regionalData: Record<string, any> = {
      BF: {
        instructions: "Depuis le Burkina Faso, utilisez Orange Money (menu #144#7# ou App Max It) pour envoyer vers MTN CI (+2250505111157) ou Moov Money BF pour envoyer vers Moov CI. L'interopérabilité permet aussi d'envoyer de Orange vers MTN.",
        methods: ["wave", "orange_money", "mtn_momo"],
        currency: "XOF"
      },
      SN: {
        instructions: "Depuis le Sénégal, utilisez Wave (bouton 'Transfert International') ou Orange Money (#144#7#) pour envoyer directement vers nos comptes Wave ou Orange en Côte d'Ivoire.",
        methods: ["wave", "orange_money"],
        currency: "XOF"
      },
      ML: {
        instructions: "Depuis le Mali, utilisez Orange Money Mali (#144#7#) ou Wave Mali pour envoyer vers nos numéros Orange ou Wave en Côte d'Ivoire.",
        methods: ["orange_money", "wave"],
        currency: "XOF"
      },
      BJ: {
        instructions: "Depuis le Bénin, utilisez MTN MoMo (*122# menu International) pour envoyer directement vers notre numéro MTN CI (+2250505111157).",
        methods: ["mtn_momo", "moov"],
        currency: "XOF"
      },
      TG: {
        instructions: "Depuis le Togo, utilisez Moov Money (Flooz *155#) ou T-Money (*145#) pour envoyer vers nos numéros Moov ou MTN en Côte d'Ivoire via les transferts régionaux.",
        methods: ["moov", "mtn_momo"],
        currency: "XOF"
      },
      GH: {
        instructions: "Depuis le Ghana, utilisez MTN MoMo (*170#), sélectionnez 'Transfer' puis 'International' pour envoyer vers notre MTN CI (+2250505111157). La conversion Cedi/CFA est automatique.",
        methods: ["mtn_momo"],
        currency: "GHS"
      },
      GN: {
        instructions: "Depuis la Guinée, utilisez Orange Money Guinée (#144# menu International) pour envoyer vers notre numéro Orange Côte d'Ivoire (+2250708292693).",
        methods: ["orange_money"],
        currency: "GNF"
      }
    };

    const countryKey = (countryCode || "").toUpperCase();
    let regionalInfo = regionalData[countryKey];

    // Fallback logic for UEMOA countries not explicitly listed
    if (!regionalInfo && (countryKey === "NE" || countryKey === "GW")) {
       regionalInfo = {
         instructions: `Depuis ${countryKey}, utilisez les services de transfert régionaux UEMOA pour envoyer vers nos numéros en Côte d'Ivoire.`,
         methods: ["orange_money", "mtn_momo"],
         currency: "XOF"
       };
    }

    const instructions = regionalInfo?.instructions || cfg.instructions;
    const isLocal = !countryCode || countryCode.toUpperCase() === "CI";
    const targetCurrency = regionalInfo?.currency || "XOF";

    let localAmount = amountXof || 5000;
    let currencySymbol = "CFA";

    if (amountXof && targetCurrency !== "XOF") {
      const conv = PaymentService.RATES[targetCurrency];
      if (conv) {
        localAmount = Math.ceil((amountXof * conv.rate) / conv.round) * conv.round;
        currencySymbol = conv.symbol;
      }
    } else {
        currencySymbol = PaymentService.RATES[targetCurrency]?.symbol || "CFA";
    }

    return {
      manualPaymentsEnabled: cfg.enabled ?? true,
      recipientName: cfg.recipientName || "Vendeur IA Trésorerie",
      targetCurrency,
      currencySymbol,
      localAmount,
      methods: [
        {
          id: "wave",
          name: "Wave Mobile Money",
          number: regional?.waveNumber || cfg.waveNumber || "+2250505111157",
          color: "#1dc5d8",
          badge: isLocal ? "Instantané & 0% frais" : "Wave International",
          instructions: isLocal
            ? "Ouvrez l'app Wave, sélectionnez 'Transférer' et envoyez le montant exact au numéro ci-dessus."
            : instructions,
          visible: !regionalInfo || regionalInfo.methods.includes("wave")
        },
        {
          id: "orange_money",
          name: "Orange Money (OM)",
          number: regional?.orangeMoneyNumber || cfg.orangeMoneyNumber || "+2250708292693",
          color: "#ff7900",
          badge: isLocal ? "Côte d'Ivoire" : "OM Afrique / International",
          instructions: isLocal
            ? "Composez #144# ou utilisez Orange Money Max pour envoyer le montant exact."
            : instructions,
          visible: !regionalInfo || regionalInfo.methods.includes("orange_money")
        },
        {
          id: "mtn_momo",
          name: "MTN Mobile Money (MoMo)",
          number: regional?.mtnNumber || cfg.mtnNumber || "+2250505111157",
          color: "#ffcc00",
          badge: isLocal ? "MoMo CI" : "MoMo International",
          instructions: isLocal
            ? "Composez *133# ou utilisez l'app MoMo pour transférer le montant exact."
            : instructions,
          visible: !regionalInfo || regionalInfo.methods.includes("mtn_momo")
        },
        {
          id: "moov",
          name: "Moov Money",
          number: cfg.moovNumber || "+2250100000000",
          color: "#0066b2",
          badge: "Moov CI",
          instructions: isLocal
            ? "Composez *155# ou utilisez l'app Moov Money pour effectuer le transfert."
            : instructions,
          visible: !regionalInfo || regionalInfo.methods.includes("moov")
        },
        {
          id: "djamo",
          name: "Djamo",
          number: cfg.djamoTag || "$vendeuria",
          color: "#10b981",
          badge: "Tag Djamo",
          instructions: "Ouvrez l'app Djamo, envoyez au Djamo Tag indiqué avec votre référence.",
          visible: isLocal
        },
        {
          id: "google_play",
          name: "Google Play / Carte",
          number: "In-App Purchase",
          color: "#4285F4",
          badge: "International / Cartes",
          instructions: "Utilisez le bouton 'Payer avec Google Play' pour régler par carte bancaire internationale en toute sécurité.",
          visible: true
        }
      ].filter(m => m.visible),
      supportWhatsApp: settings.supportWhatsApp || "+2250700000000"
    };
  }

  /**
   * Creates a new PaymentIntent for a merchant
   */
  async createPaymentIntent(userId: string, data: {
    offerSlug: string;
    billingInterval?: "monthly" | "yearly";
    paymentMethod?: "wave" | "orange_money" | "mtn_momo" | "moov" | "djamo" | "card" | "google_play" | "other";
    provider?: string;
    senderPhoneNumber?: string;
    senderName?: string;
    country?: string;
  }) {
    const { offerSlug, billingInterval = "monthly", paymentMethod = "wave", provider = "manual_mobile_money", senderPhoneNumber, senderName, country } = data;

    // Find offer and compute exact price
    const offer = await OfferModel.findOne({ slug: offerSlug });
    let amount = 5000;
    let planName = "Essentiel";
    let currency = "XOF";

    if (offer) {
      planName = offer.name;
      currency = offer.currency || "XOF";
      if (billingInterval === "yearly") {
        amount = offer.yearlyPrice || Math.round(offer.monthlyPrice * 10);
      } else {
        amount = offer.monthlyPrice;
      }
    } else {
      // Fallbacks
      if (offerSlug === "pro" || offerSlug === "premium") {
        planName = "Pro";
        amount = billingInterval === "yearly" ? 150000 : 15000;
      } else if (offerSlug === "business") {
        planName = "Business";
        amount = billingInterval === "yearly" ? 350000 : 35000;
      } else if (offerSlug === "pack_pro") {
        planName = "Pack Pro Assistance Déploiement";
        amount = 25000;
      }
    }

    const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
    const paymentConfig = await this.getPaymentConfig(country || merchant?.country, amount);
    const selectedMethodCfg = paymentConfig.methods.find(m => m.id === paymentMethod);

    const reference = this.generateReference();
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48h validity

    const finalCurrency = paymentConfig.targetCurrency || currency;
    const finalAmount = paymentConfig.localAmount || amount;

    const intent = await PaymentIntentModel.create({
      userId,
      merchantId: merchant?._id,
      offerSlug,
      planName,
      billingInterval,
      amount: finalAmount,
      currency: finalCurrency,
      reference,
      provider: paymentMethod === "google_play" ? "google_play" : ((provider as any) || "manual_mobile_money"),
      paymentMethod,
      senderPhoneNumber: senderPhoneNumber || merchant?.phone || merchant?.whatsappNumber || "",
      senderName: senderName || merchant?.businessName || "",
      recipientPhoneNumber: selectedMethodCfg?.number || "",
      recipientName: paymentConfig.recipientName,
      status: "initiated",
      confidenceScore: 0,
      expiresAt,
      metadata: { country, localAmount: finalAmount, localCurrency: finalCurrency, baseAmountXOF: amount }
    });

    logger.info(`[PaymentService] Intent créé: ${reference} (${finalAmount} ${finalCurrency}) pour user ${userId} [Method: ${paymentMethod}]`);
    return intent;
  }

  /**
   * Submits payment proof / transaction ID from merchant customer
   */
  async submitPaymentProof(intentId: string, userId: string, data: {
    transactionId?: string;
    proofImageUrl?: string;
    senderPhoneNumber?: string;
    senderName?: string;
    notes?: string;
  }) {
    const intent = await PaymentIntentModel.findOne({ _id: intentId, userId });
    if (!intent) {
      throw new Error("Intention de paiement introuvable.");
    }

    if (intent.status === "confirmed") {
      return { message: "Paiement déjà confirmé !", intent };
    }

    const cleanTransactionId = data.transactionId?.trim() || "";
    const cleanSenderPhone = data.senderPhoneNumber?.trim() || intent.senderPhoneNumber || "";

    // 1. Anti-Replay duplicate check on transactionId
    let isTidUnique = true;
    if (cleanTransactionId) {
      const duplicate = await PaymentIntentModel.findOne({
        _id: { $ne: intent._id },
        transactionId: cleanTransactionId,
        status: "confirmed"
      });
      if (duplicate) {
        isTidUnique = false;
        logger.warn(`[Payment Engine] ⚠️ Replay Attack / Doublon détecté pour TransactionID ${cleanTransactionId}`);
      }
    }

    // 2. Compute Confidence Score
    let confidence = 40; // Base score for submitting proof
    const notes: string[] = [];

    if (cleanTransactionId && cleanTransactionId.length >= 6) {
      confidence += 30;
      notes.push("Identifiant de transaction fourni");
    } else {
      notes.push("Identifiant de transaction manquant ou court");
    }

    if (isTidUnique) {
      confidence += 15;
      notes.push("Identifiant transaction unique vérifié");
    } else {
      confidence = 0;
      notes.push("ATTENTION: Identifiant déjà utilisé sur un autre compte !");
    }

    if (cleanSenderPhone && cleanSenderPhone.length >= 8) {
      confidence += 15;
      notes.push("Numéro expéditeur renseigné");
    }

    if (data.proofImageUrl) {
      confidence += 10;
      notes.push("Capture d'écran de reçu fournie");
    }

    // Cap confidence
    confidence = Math.min(100, Math.max(0, confidence));

    const settings = await SystemSettingsModel.findOne();
    const threshold = (settings as any)?.manualPaymentConfig?.autoApproveConfidenceThreshold || 95;

    intent.transactionId = cleanTransactionId;
    intent.proofImageUrl = data.proofImageUrl || intent.proofImageUrl || "";
    if (cleanSenderPhone) intent.senderPhoneNumber = cleanSenderPhone;
    if (data.senderName) intent.senderName = data.senderName;
    if (data.notes) intent.adminNotes = data.notes;

    intent.confidenceScore = confidence;
    intent.verificationSignals = {
      amountMatch: true,
      senderMatch: Boolean(cleanSenderPhone),
      transactionIdUnique: isTidUnique,
      withinTimeWindow: intent.expiresAt > new Date(),
      notes
    };

    if (confidence >= threshold && isTidUnique) {
      // Auto-approve if criteria met
      await this.activateSubscriptionForIntent(intent, "system_auto_verify");
    } else {
      intent.status = "under_verification";
      await intent.save();

      // Alert Admin via Realtime and Push
      emitToUser("admin", "payment:pending_review", {
        intentId: intent._id,
        reference: intent.reference,
        amount: intent.amount,
        senderName: intent.senderName,
        phone: intent.senderPhoneNumber,
        confidenceScore: intent.confidenceScore
      });

      logger.info(`[Payment Engine] Intent ${intent.reference} soumis à vérification (Score: ${confidence}%)`);
    }

    const isConfirmed = (intent.status as string) === "confirmed";

    return {
      message: isConfirmed ? "Paiement validé avec succès !" : "Paiement en cours de vérification.",
      intent
    };
  }

  /**
   * Admin approves or rejects a PaymentIntent
   */
  async processAdminDecision(intentId: string, adminId: string, decision: {
    action: "approve" | "reject";
    adminNotes?: string;
  }) {
    const intent = await PaymentIntentModel.findById(intentId);
    if (!intent) {
      throw new Error("Intention de paiement introuvable.");
    }

    if (intent.status === "confirmed" && decision.action === "approve") {
      return { message: "Déjà validé", intent };
    }

    intent.adminNotes = decision.adminNotes || intent.adminNotes || "";

    if (decision.action === "approve") {
      await this.activateSubscriptionForIntent(intent, adminId);
      logger.info(`[PaymentService] Intent ${intent.reference} approuvé manuellement par admin ${adminId}`);
      return { message: "Paiement validé et abonnement activé !", intent };
    } else {
      intent.status = "rejected";
      intent.verifiedBy = adminId;
      intent.verifiedAt = new Date();
      await intent.save();

      // Notify user realtime
      emitToUser(intent.userId, "payment:rejected", {
        reference: intent.reference,
        reason: decision.adminNotes || "Paiement non reconnu."
      });

      logger.warn(`[PaymentService] Intent ${intent.reference} rejeté par admin ${adminId}`);
      return { message: "Paiement rejeté.", intent };
    }
  }

  /**
   * Idempotent Subscription & Merchant Activation Engine
   */
  async activateSubscriptionForIntent(intent: IPaymentIntent, verifiedBy: string) {
    const userId = intent.userId;
    const now = new Date();
    const isYearly = intent.billingInterval === "yearly";

    // 1. Calculate new expiration
    const existingSub = await SubscriptionModel.findOne({ userId });
    const existingMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });

    const currentValidUntil = (existingSub?.currentPeriodEnd && new Date(existingSub.currentPeriodEnd) > now)
      ? new Date(existingSub.currentPeriodEnd)
      : (existingMerchant?.subscription?.expiresAt && new Date(existingMerchant.subscription.expiresAt) > now)
      ? new Date(existingMerchant.subscription.expiresAt)
      : now;

    const newExpiresAt = new Date(currentValidUntil);
    if (isYearly) {
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
    } else {
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
    }

    // 2. Find offer doc
    const offer = await OfferModel.findOne({ slug: intent.offerSlug });

    // 3. Upsert Subscription
    const subscription = await SubscriptionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          offerId: offer?._id || intent.merchantId,
          status: "active",
          billingInterval: intent.billingInterval,
          price: intent.amount,
          currency: intent.currency,
          currentPeriodStart: now,
          currentPeriodEnd: newExpiresAt,
          nextBillingDate: newExpiresAt,
          paymentMethod: "mobile_money",
          provider: intent.provider || "manual_mobile_money",
          cancelledAt: null,
          cancellationRequestedAt: null
        }
      },
      { upsert: true, new: true }
    );

    // 4. Update Merchant
    await CommerceMerchantModel.findOneAndUpdate(
      { ownerId: userId },
      {
        $set: {
          "subscription.plan": intent.offerSlug,
          "subscription.status": "active",
          "subscription.expiresAt": newExpiresAt,
          "subscription.billingInterval": intent.billingInterval,
          "subscription.paymentMethod": "mobile_money"
        }
      }
    );

    // 5. Update Intent
    intent.status = "confirmed";
    intent.verifiedBy = verifiedBy;
    intent.verifiedAt = new Date();
    intent.subscriptionId = subscription._id;
    await intent.save();

    // 6. Log in TransactionModel for reporting
    await TransactionModel.create({
      ownerId: userId,
      reference: intent.reference,
      amount: intent.amount,
      currency: intent.currency,
      status: "success",
      type: "subscription",
      channel: intent.paymentMethod,
      customerEmail: (await UserModel.findById(userId))?.email || "",
      metadata: {
        intentId: intent._id,
        offerSlug: intent.offerSlug,
        billingInterval: intent.billingInterval,
        transactionId: intent.transactionId,
        verifiedBy
      }
    });

    // 7. Emit Realtime Events
    emitToUser(userId, "payment:confirmed", {
      reference: intent.reference,
      planName: intent.planName,
      amount: intent.amount,
      expiresAt: newExpiresAt
    });

    // 8. Send Push and WhatsApp Notifications
    pushService.sendNotification(userId, {
      title: "🎉 Forfait Vendeur IA Activé !",
      body: `Votre abonnement ${intent.planName} est désormais actif jusqu'au ${newExpiresAt.toLocaleDateString("fr-FR")}.`,
      data: { url: "/dashboard" }
    }).catch(() => {});

    this.sendWhatsAppConfirmation(userId, intent, newExpiresAt).catch(err => {
      logger.warn(`[PaymentService] Échec envoi WhatsApp notification: ${err.message}`);
    });

    logger.info(`[PaymentService] ✅ Souscription activée pour ${userId} jusqu'au ${newExpiresAt.toISOString()}`);
    return subscription;
  }

  /**
   * Sends transactional confirmation message via WhatsApp
   */
  async sendWhatsAppConfirmation(userId: string, intent: IPaymentIntent, expiresAt: Date) {
    try {
      const user = await UserModel.findById(userId);
      const merchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      const targetPhone = merchant?.whatsappNumber || merchant?.phone || user?.whatsappNumber;

      if (!targetPhone) return;

      const formattedDate = expiresAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const messageText = `🎉 *Paiement Confirmé - Vendeur IA*\n\n` +
        `Votre paiement de *${intent.amount.toLocaleString("fr-FR")} ${intent.currency}* pour la formule *${intent.planName}* (${intent.billingInterval === "yearly" ? "Annuel" : "Mensuel"}) a été validé avec succès !\n\n` +
        `🟢 *Statut* : Actif\n` +
        `📅 *Expiration* : ${formattedDate}\n` +
        `🔖 *Réf* : ${intent.reference}\n\n` +
        `Votre Vendeur IA est opérationnel 24h/24 pour convertir vos prospects en clients. 🚀`;

      await whatsappService.sendMessage(userId, targetPhone, messageText);
    } catch (err: any) {
      logger.error(`[WhatsApp Notif] Failed to send payment confirmation:`, err);
    }
  }
}

export const paymentService = new PaymentService();
