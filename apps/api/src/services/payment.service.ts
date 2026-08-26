import fs from "node:fs/promises";
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
import { paymentShieldService, ForensicExtractionResult } from "./payment-shield.service.js";
import { storageService } from "./storage.service.js";
import { auditLogService } from "./audit-log.service.js";

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
        planName = "Vendeur IA Pro";
        amount = billingInterval === "yearly" ? 200000 : 20000;
      } else if (offerSlug === "business") {
        planName = "Vendeur IA Business";
        amount = billingInterval === "yearly" ? 350000 : 35000;
      } else if (offerSlug === "pack_pro") {
        planName = "Pack Pro Expert (Clé en Main)";
        // 20k (Pro) + 25k (Expert Setup) = 45k
        amount = 45000;
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
   * Scans a receipt screenshot with Forensic Multimodal AI and Anti-Fraud shield
   */
  async scanReceiptProof(intentId: string, userId: string, file: Express.Multer.File) {
    const intent = await PaymentIntentModel.findOne({ _id: intentId, userId });
    if (!intent) {
      throw new Error("Intention de paiement introuvable.");
    }

    if (intent.status === "confirmed") {
      return {
        success: true,
        alreadyConfirmed: true,
        message: "Paiement déjà confirmé !"
      };
    }

    // 1. Read file buffer & compute SHA-256 hash for anti-replay check
    const imageBuffer = await fs.readFile(file.path);
    const imageHash = paymentShieldService.computeImageHash(imageBuffer);

    // 2. Upload file to permanent storage
    const uploadResult = await storageService.uploadFile(file, "payment-proofs");

    // Clean temp multer file
    await fs.unlink(file.path).catch(() => {});

    // 3. Anti-Replay Defense: Verify if image was previously used in another confirmed intent
    const duplicateHash = await PaymentIntentModel.findOne({
      _id: { $ne: intent._id },
      proofImageHash: imageHash,
      status: "confirmed"
    });

    // 4. Run Deep Forensic AI Vision Audit
    const extraction: ForensicExtractionResult = await paymentShieldService.runForensicVisionAudit(imageBuffer, file.mimetype);

    // 5. Build Fraud & Forensic assessment
    const flags: string[] = [];
    let isFraudulent = false;

    if (duplicateHash) {
      flags.push("IMAGE_DÉJÀ_UTILISÉE_SUR_UN_AUTRE_COMPTE");
      isFraudulent = true;
    }

    if (extraction.forensics?.isPhotoshopTampered) {
      flags.push("RETOUCHE_GRAPHIQUE_DÉTECTÉE");
      isFraudulent = true;
    }

    if (extraction.forensics?.isAiGenerated) {
      flags.push("FAUX_REÇU_GÉNÉRÉ_PAR_IA");
      isFraudulent = true;
    }

    if (extraction.forensics?.fontMismatchDetected) {
      flags.push("TYPOGRAPHIE_INCOHÉRENTE");
    }

    if (extraction.forensics?.compressionArtifactsDetected) {
      flags.push("ARTEFACTS_DE_COMPRESSION_SUSPECTS");
    }

    const amountMatches = Boolean(
      extraction.amount &&
      (extraction.amount === intent.amount || Math.abs(extraction.amount - intent.amount) <= 50)
    );

    // Dynamic AI confidence rating
    let confidenceScore = extraction.isPaymentProof ? (extraction.forensics?.confidenceRating || 75) : 10;
    if (isFraudulent) {
      confidenceScore = 0;
    } else if (amountMatches && extraction.transactionId) {
      confidenceScore = Math.min(100, confidenceScore + 15);
    }

    // Persist scan and forensic metadata on intent
    intent.proofImageUrl = uploadResult.url;
    intent.proofImageHash = imageHash;
    intent.forensics = {
      isAiGenerated: extraction.forensics?.isAiGenerated || false,
      isPhotoshopTampered: extraction.forensics?.isPhotoshopTampered || false,
      fontMismatchDetected: extraction.forensics?.fontMismatchDetected || false,
      compressionArtifactsDetected: extraction.forensics?.compressionArtifactsDetected || false,
      uiInconsistencies: extraction.forensics?.uiInconsistencies || [],
      confidenceRating: confidenceScore,
      analysisSummary: extraction.forensics?.analysisSummary || "Audit visuel IA complété."
    };

    if (extraction.transactionId && (!intent.transactionId || intent.transactionId.length < 4)) {
      intent.transactionId = extraction.transactionId;
    }
    if (extraction.senderPhone && (!intent.senderPhoneNumber || intent.senderPhoneNumber.length < 6)) {
      intent.senderPhoneNumber = extraction.senderPhone;
    }
    if (extraction.senderName && !intent.senderName) {
      intent.senderName = extraction.senderName;
    }
    await intent.save();

    logger.info(`[Payment Shield] Reçu scanné pour intent ${intent.reference}: Platform=${extraction.platform}, TID=${extraction.transactionId || 'N/A'}, Confiance=${confidenceScore}%, Flags=${flags.join(', ') || 'None'}`);

    return {
      success: true,
      proofImageUrl: uploadResult.url,
      isPaymentProof: extraction.isPaymentProof,
      platform: extraction.platform,
      amount: extraction.amount,
      currency: extraction.currency,
      transactionId: extraction.transactionId,
      senderPhone: extraction.senderPhone,
      senderName: extraction.senderName,
      confidenceScore,
      amountMatches,
      forensics: intent.forensics,
      flags,
      analysisSummary: extraction.forensics?.analysisSummary || ""
    };
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

    // 2. Compute Confidence Score incorporating Forensics
    let confidence = 40; // Base score for submitting proof
    const notes: string[] = [];

    // Check if forensic flags were raised on image
    const hasForensicFraud = Boolean(
      intent.forensics?.isPhotoshopTampered ||
      intent.forensics?.isAiGenerated
    );

    if (cleanTransactionId && cleanTransactionId.length >= 6) {
      confidence += 30;
      notes.push("Identifiant de transaction fourni");
    } else {
      notes.push("Identifiant de transaction manquant ou court");
    }

    if (isTidUnique && !hasForensicFraud) {
      confidence += 15;
      notes.push("Identifiant transaction unique vérifié");
      if (cleanSenderPhone && cleanSenderPhone.length >= 8) {
        confidence += 15;
        notes.push("Numéro expéditeur renseigné");
      }
      if (data.proofImageUrl || intent.proofImageUrl) {
        confidence += 10;
        notes.push("Capture d'écran de reçu fournie");
      }
      if (intent.forensics?.confidenceRating && intent.forensics.confidenceRating >= 85) {
        confidence += 10;
        notes.push("Validation visuelle IA haute fidélité");
      }
    } else {
      confidence = 0;
      if (!isTidUnique) notes.push("ATTENTION: Identifiant déjà utilisé sur un autre compte !");
      if (hasForensicFraud) notes.push("ATTENTION: Retouche ou faux reçu IA détecté par le bouclier anti-fraude !");
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

    if (confidence >= threshold && isTidUnique && !hasForensicFraud) {
      // Auto-approve if criteria met
      await this.activateSubscriptionForIntent(intent, "system_auto_verify");
    } else {
      intent.status = "under_verification";
      await intent.save();

      // Alert Admins via Web Push and Realtime Sockets
      this.notifyAdminsNewPayment(intent, data.senderName || intent.senderName).catch(err => {
        logger.warn(`[PaymentService] Erreur alerte admins: ${err.message}`);
      });

      emitToUser("admin", "payment:pending_review", {
        intentId: intent._id,
        reference: intent.reference,
        amount: intent.amount,
        senderName: intent.senderName,
        phone: intent.senderPhoneNumber,
        confidenceScore: intent.confidenceScore
      });

      emitToUser(userId, "payment:update", {
        intentId: intent._id,
        reference: intent.reference,
        status: intent.status,
        amount: intent.amount
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
   * Broadcast real-time alerts and web push to all administrators
   */
  async notifyAdminsNewPayment(intent: IPaymentIntent, merchantName?: string) {
    try {
      const admins = await UserModel.find({
        $or: [{ roles: "admin" }, { email: "franck@vendeur-ia.com" }]
      });

      const bodyText = `${intent.amount.toLocaleString("fr-FR")} ${intent.currency} - ${intent.planName} (${intent.paymentMethod?.toUpperCase() || "MOBILE MONEY"}) pour ${merchantName || intent.senderName || "un commerçant"}`;

      for (const admin of admins) {
        await pushService.sendNotification(admin._id.toString(), {
          title: "⏳ Nouveau Virement à Vérifier",
          body: bodyText,
          icon: "/apple-touch-icon.png",
          data: {
            url: "/admin",
            intentId: intent._id.toString(),
            reference: intent.reference
          }
        });

        emitToUser(admin._id.toString(), "admin:payment_incoming", {
          intentId: intent._id.toString(),
          reference: intent.reference,
          amount: intent.amount,
          currency: intent.currency,
          planName: intent.planName,
          senderPhone: intent.senderPhoneNumber,
          merchantName: merchantName || intent.senderName
        });
      }
    } catch (err: any) {
      logger.warn(`[PaymentService] Erreur notification push admins: ${err.message}`);
    }
  }

  /**
   * Admin approves, rejects or requests rescan for a PaymentIntent
   */
  async processAdminDecision(intentId: string, adminId: string, decision: {
    action: "approve" | "reject" | "request_rescan";
    adminNotes?: string;
    rejectionCode?: string;
    rejectionReason?: string;
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

      await auditLogService.log({
        userId: adminId as any,
        merchantId: intent.merchantId,
        action: "payment_approved",
        entity: "payment",
        entityId: intent._id.toString(),
        severity: "info",
        metadata: { reference: intent.reference, amount: intent.amount, notes: decision.adminNotes }
      });

      logger.info(`[PaymentService] Intent ${intent.reference} approuvé manuellement par admin ${adminId}`);
      return { message: "Paiement validé et abonnement activé !", intent };
    } else if (decision.action === "request_rescan") {
      intent.status = "under_verification";
      intent.adminNotes = decision.adminNotes || "Veuillez fournir une capture d'écran plus nette du reçu.";
      intent.verifiedBy = adminId;
      await intent.save();

      await auditLogService.log({
        userId: adminId as any,
        merchantId: intent.merchantId,
        action: "payment_rescan_requested",
        entity: "payment",
        entityId: intent._id.toString(),
        severity: "warning",
        metadata: { reference: intent.reference, notes: decision.adminNotes }
      });

      // Notify merchant via WebSocket
      emitToUser(intent.userId, "payment:rescan_requested", {
        reference: intent.reference,
        instructions: intent.adminNotes
      });

      // Send Push notification to merchant
      pushService.sendNotification(intent.userId, {
        title: "📸 Capture de reçu demandée",
        body: intent.adminNotes,
        icon: "/apple-touch-icon.png",
        data: { url: "/checkout" }
      }).catch(() => {});

      logger.info(`[PaymentService] Intent ${intent.reference}: Nouvelle capture demandée par admin ${adminId}`);
      return { message: "Demande de nouvelle capture envoyée au commerçant.", intent };
    } else {
      intent.status = "rejected";
      intent.rejectionCode = decision.rejectionCode || "manual_rejection";
      intent.rejectionReason = decision.rejectionReason || decision.adminNotes || "Paiement non identifié.";
      intent.verifiedBy = adminId;
      intent.verifiedAt = new Date();
      await intent.save();

      await auditLogService.log({
        userId: adminId as any,
        merchantId: intent.merchantId,
        action: "payment_rejected",
        entity: "payment",
        entityId: intent._id.toString(),
        severity: "error",
        metadata: { reference: intent.reference, reason: intent.rejectionReason }
      });

      const reasonMsg = intent.rejectionReason || "Le virement n'a pas pu être validé.";

      // Notify merchant via WebSocket
      emitToUser(intent.userId, "payment:rejected", {
        reference: intent.reference,
        reason: reasonMsg
      });

      // Send Push notification to merchant
      pushService.sendNotification(intent.userId, {
        title: "❌ Paiement non validé",
        body: reasonMsg,
        icon: "/apple-touch-icon.png",
        data: { url: "/settings?tab=billing" }
      }).catch(() => {});

      logger.warn(`[PaymentService] Intent ${intent.reference} rejeté par admin ${adminId}: ${reasonMsg}`);
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
      merchantId: intent.merchantId || existingMerchant?._id,
      ownerId: userId,
      reference: intent.reference,
      amount: intent.amount,
      currency: intent.currency,
      status: "success",
      type: "subscription",
      paymentMethod: intent.paymentMethod,
      paidAt: new Date(),
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
