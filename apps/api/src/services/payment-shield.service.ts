import crypto from "crypto";
import axios from "axios";
import { env } from "../config/env.js";
import { GEMINI_DEFAULT_VISION_MODEL } from "../config/gemini.js";
import { logger } from "./logger.service.js";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";
import { PaymentProofLogModel } from "../modules/commerce/payment-proof.model.js";

export interface ForensicExtractionResult {
  isPaymentProof: boolean;
  platform: string;
  amount: number;
  currency: string;
  transactionId: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  extractedDateStr?: string;
  extractedTimestamp?: Date;
  status: "success" | "pending" | "failed" | "unknown";
  forensics: {
    isAiGenerated: boolean;
    isPhotoshopTampered: boolean;
    fontMismatchDetected: boolean;
    compressionArtifactsDetected: boolean;
    uiInconsistencies: string[];
    confidenceRating: number; // 0 to 100 according to visual forensics
    analysisSummary: string;
  };
}

export interface ShieldDecisionResult {
  decision: "AUTO_APPROVED" | "FLAGGED_FOR_REVIEW" | "REJECTED_FRAUD";
  confidenceScore: number; // Final weighted score
  flags: string[];
  extraction: ForensicExtractionResult;
  imageHash: string;
  logId?: string;
}

export class PaymentShieldService {
  /**
   * Compute SHA-256 hash of image buffer to prevent exact duplicate replay attacks
   */
  computeImageHash(imageBuffer: Buffer): string {
    return crypto.createHash("sha256").update(imageBuffer).digest("hex");
  }

  /**
   * Validate standard syntax rules for African Mobile Money operators
   */
  verifyOperatorSyntax(platform: string, transactionId: string): boolean {
    if (!transactionId || transactionId.trim().length < 4) return false;
    const cleanId = transactionId.trim().toUpperCase();

    const normalizedPlatform = platform.toLowerCase();

    if (normalizedPlatform.includes("wave")) {
      // Wave transaction IDs are typically alphanumeric, e.g. T-..., W-..., or 10-18 alphanumeric chars
      return cleanId.length >= 6 && /^[A-Z0-9\-_.]+$/.test(cleanId);
    }

    if (normalizedPlatform.includes("orange")) {
      // Orange Money CI commonly starts with CI followed by digits and reference codes, or standard alphanumeric
      return cleanId.length >= 6 && /^[A-Z0-9\-_.]+$/.test(cleanId);
    }

    if (normalizedPlatform.includes("mtn") || normalizedPlatform.includes("momo")) {
      // MTN MoMo transaction IDs
      return cleanId.length >= 6 && /^[A-Z0-9\-_.]+$/.test(cleanId);
    }

    if (normalizedPlatform.includes("moov")) {
      return cleanId.length >= 6 && /^[A-Z0-9\-_.]+$/.test(cleanId);
    }

    return cleanId.length >= 4;
  }

  /**
   * Forensic Multimodal AI Analysis with Gemini Vision / OpenAI Vision
   */
  async runForensicVisionAudit(imageBuffer: Buffer, mimeType: string): Promise<ForensicExtractionResult> {
    const settings = await SystemSettingsModel.findOne();
    const primaryProvider = settings?.aiConfig?.defaultVisionProvider || 'gemini';

    const systemPrompt = `Tu es un EXPERT EN AUDIT MÉDICO-LÉGAL FORENSIC ET CYBERSÉCURITÉ BANCAIRE spécialisé dans la détection de fraudes de paiements mobiles en Afrique (Wave, Orange Money, MTN MoMo, Moov Money, Djamo, KPay, etc.).

Ta mission : Examiner cette capture d'écran avec une vigilance extrême contre :
1. Les modifications PHOTOSHOP / CANVA : Cherche les bords de texte trop nets, les polices de caractères qui diffèrent légèrement (ex: police Orange Money vs Helvetica classique), les décalages de pixels, et surtout le flou JPEG anormal autour des chiffres du MONTANT ou du DESTINATAIRE.
2. Les faux reçus GÉNÉRÉS PAR IA : Typographie déformée, logos système Android/iOS incohérents, barre d'état (batterie, heure) qui semble dessinée ou floue.
3. Le REUSE de captures : Si la date semble ancienne ou si le reçu appartient à une autre plateforme.

Extrais TOUTES les informations au format JSON STRICT suivant :
{
  "isPaymentProof": true/false,
  "platform": "Wave" | "Orange Money" | "MTN MoMo" | "Moov Money" | "Djamo" | "Virement Bancaire" | "Autre",
  "amount": number (chiffre exact sans séparateur, ex: 15000),
  "currency": "XOF" | "XAF" | "GNF" | "CDF" | "USD" | "EUR",
  "transactionId": "Identifiant exact de la transaction (numéro de référence ou TID)",
  "senderName": "Nom de l'expéditeur si visible",
  "senderPhone": "Numéro de l'expéditeur si visible",
  "recipientName": "Nom du destinataire / marchand affiché sur le reçu (ex: Vendeur IA)",
  "recipientPhone": "Numéro du destinataire affiché sur le reçu (ex: +225...)",
  "extractedDateStr": "Date et heure exactes affichées (ex: 2026-08-16 16:45)",
  "status": "success" | "pending" | "failed" | "unknown",
  "forensics": {
    "isAiGenerated": boolean,
    "isPhotoshopTampered": boolean (true si une zone de texte semble collée ou retouchée),
    "fontMismatchDetected": boolean (true si la police des chiffres du montant ne correspond pas au standard de l'opérateur),
    "compressionArtifactsDetected": boolean (true si des pixels "sales" entourent uniquement le montant),
    "uiInconsistencies": ["liste", "des", "anomalies"],
    "confidenceRating": number (0-100),
    "analysisSummary": "Verdict forensic détaillé"
  }
}
Réponds UNIQUEMENT avec le JSON strict.`;

    // Attempt Gemini first
    const geminiKey = settings?.aiConfig?.providers?.find((p: any) => p.name === 'gemini' && p.isActive)?.apiKey || env.GEMINI_API_KEY;
    if (primaryProvider === 'gemini' && geminiKey && !env.DISABLE_GEMINI) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_DEFAULT_VISION_MODEL}:generateContent?key=${geminiKey}`,
          {
            contents: [{
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType,
                    data: imageBuffer.toString("base64")
                  }
                }
              ]
            }]
          },
          { timeout: 25000 }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return this.normalizeExtraction(parsed);
          }
        }
      } catch (err: any) {
        console.warn("[PaymentShield] Gemini Vision audit failed, falling back...", err.message);
      }
    }

    // Fallback: OpenAI GPT-4o Vision
    const openaiKey = settings?.aiConfig?.providers?.find((p: any) => p.name === 'openai' && p.isActive)?.apiKey || env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: systemPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${imageBuffer.toString("base64")}`
                    }
                  }
                ]
              }
            ]
          },
          {
            headers: {
              Authorization: `Bearer ${openaiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 30000
          }
        );

        const text = response.data?.choices?.[0]?.message?.content;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return this.normalizeExtraction(parsed);
          }
        }
      } catch (err: any) {
        logger.warn(`[Payment Shield] OpenAI vision analysis error: ${err.message}`);
      }
    }

    // Default fallback if vision extraction fails
    return {
      isPaymentProof: false,
      platform: "Inconnu",
      amount: 0,
      currency: "XOF",
      transactionId: "",
      status: "unknown",
      forensics: {
        isAiGenerated: false,
        isPhotoshopTampered: false,
        fontMismatchDetected: false,
        compressionArtifactsDetected: false,
        uiInconsistencies: ["Extraction visuelle impossible"],
        confidenceRating: 0,
        analysisSummary: "Échec de l'analyse visuelle de la capture."
      }
    };
  }

  private normalizeExtraction(raw: any): ForensicExtractionResult {
    let extractedTimestamp: Date | undefined;
    if (raw.extractedDateStr) {
      const parsedDate = new Date(raw.extractedDateStr);
      if (!isNaN(parsedDate.getTime())) {
        extractedTimestamp = parsedDate;
      }
    }

    return {
      isPaymentProof: !!raw.isPaymentProof,
      platform: raw.platform || "Autre",
      amount: typeof raw.amount === "number" ? raw.amount : parseFloat(raw.amount) || 0,
      currency: raw.currency || "XOF",
      transactionId: raw.transactionId ? String(raw.transactionId).trim() : "",
      senderName: raw.senderName || "",
      senderPhone: raw.senderPhone || "",
      recipientName: raw.recipientName || "",
      recipientPhone: raw.recipientPhone || "",
      extractedDateStr: raw.extractedDateStr || "",
      extractedTimestamp,
      status: raw.status || "success",
      forensics: {
        isAiGenerated: !!raw.forensics?.isAiGenerated,
        isPhotoshopTampered: !!raw.forensics?.isPhotoshopTampered,
        fontMismatchDetected: !!raw.forensics?.fontMismatchDetected,
        compressionArtifactsDetected: !!raw.forensics?.compressionArtifactsDetected,
        uiInconsistencies: Array.isArray(raw.forensics?.uiInconsistencies) ? raw.forensics.uiInconsistencies : [],
        confidenceRating: typeof raw.forensics?.confidenceRating === "number" ? raw.forensics.confidenceRating : 50,
        analysisSummary: raw.forensics?.analysisSummary || "Audit visuel réalisé."
      }
    };
  }

  /**
   * Master Multi-Layer Evaluation Engine
   * Evaluates vision forensics, replay attacks, recipient consistency, freshness, and order amount match
   */
  async evaluatePaymentProof(params: {
    merchant: any;
    customer: any;
    expectedOrder?: any;
    imageBuffer: Buffer;
    mimeType: string;
  }): Promise<ShieldDecisionResult> {
    const { merchant, customer, expectedOrder, imageBuffer, mimeType } = params;
    const imageHash = this.computeImageHash(imageBuffer);
    const flags: string[] = [];

    // 1. Run Deep Forensic Vision Extraction
    const extraction = await this.runForensicVisionAudit(imageBuffer, mimeType);

    if (!extraction.isPaymentProof) {
      flags.push("IMAGE_NOT_PAYMENT_PROOF");
      return {
        decision: "REJECTED_FRAUD",
        confidenceScore: 0,
        flags,
        extraction,
        imageHash
      };
    }

    let confidenceScore = extraction.forensics.confidenceRating || 70;

    // 2. Anti-Replay Defense: Check Duplicate Image Hash
    const duplicateHashLog = await PaymentProofLogModel.findOne({
      merchantId: merchant._id,
      imageHash
    });

    if (duplicateHashLog) {
      flags.push("DUPLICATE_IMAGE_REPLAY_ATTACK");
      confidenceScore = 0;
      return {
        decision: "REJECTED_FRAUD",
        confidenceScore,
        flags,
        extraction,
        imageHash
      };
    }

    // 3. Anti-Replay Defense: Check Duplicate Transaction ID
    if (extraction.transactionId) {
      const duplicateTidLog = await PaymentProofLogModel.findOne({
        merchantId: merchant._id,
        platform: extraction.platform,
        transactionId: extraction.transactionId
      });

      if (duplicateTidLog) {
        flags.push(`DUPLICATE_TRANSACTION_ID_${extraction.transactionId}`);
        confidenceScore = 0;
        return {
          decision: "REJECTED_FRAUD",
          confidenceScore,
          flags,
          extraction,
          imageHash
        };
      }
    }

    // 4. Operator Syntax Check
    const isSyntaxValid = this.verifyOperatorSyntax(extraction.platform, extraction.transactionId);
    if (!isSyntaxValid) {
      flags.push("INVALID_OPERATOR_TRANSACTION_SYNTAX");
      confidenceScore -= 30;
    }

    // 5. Visual Tampering & AI Generation Checks
    if (extraction.forensics.isAiGenerated) {
      flags.push("AI_GENERATED_IMAGE_DETECTED");
      confidenceScore -= 60;
    }

    if (extraction.forensics.isPhotoshopTampered || extraction.forensics.fontMismatchDetected) {
      flags.push("VISUAL_TAMPERING_OR_FONT_MISMATCH_DETECTED");
      confidenceScore -= 50;
    }

    if (extraction.status !== "success") {
      flags.push(`PAYMENT_STATUS_NOT_SUCCESS_${extraction.status.toUpperCase()}`);
      confidenceScore -= 40;
    }

    // 6. Recipient Locking Check
    let recipientMatch = false;
    const cleanRecipientPhone = (extraction.recipientPhone || "").replace(/[^0-9]/g, "");
    const cleanRecipientName = (extraction.recipientName || "").toLowerCase().trim();

    // Check against merchant's configured numbers & payment channels
    const merchantPhones = [
      (merchant.whatsappNumber || "").replace(/[^0-9]/g, ""),
      (merchant.phone || "").replace(/[^0-9]/g, ""),
      "2250505111157",
      "2250708292693",
      ...(merchant.paymentChannels || []).map((c: any) => (c.number || "").replace(/[^0-9]/g, ""))
    ].filter(p => p.length >= 8);

    const merchantNames = [
      "vendeur ia",
      "vendeuria",
      (merchant.businessName || "").toLowerCase().trim(),
      ...(merchant.paymentChannels || []).map((c: any) => (c.label || "").toLowerCase().trim())
    ].filter(n => n.length >= 2);

    const phoneMatched = merchantPhones.some(mp => cleanRecipientPhone.includes(mp) || mp.includes(cleanRecipientPhone));
    const nameMatched = merchantNames.some(mn => cleanRecipientName.includes(mn) || mn.includes(cleanRecipientName));

    if (cleanRecipientPhone || cleanRecipientName) {
      if (phoneMatched || nameMatched) {
        recipientMatch = true;
        confidenceScore += 10;
      } else {
        flags.push(`SUSPICIOUS_RECIPIENT_MISMATCH (Screen: ${extraction.recipientName} ${extraction.recipientPhone})`);
        confidenceScore -= 35;
      }
    } else {
      // Recipient not explicitly printed on screenshot
      flags.push("RECIPIENT_INFO_NOT_VISIBLE_ON_PROOF");
      confidenceScore -= 10;
    }

    // 7. Freshness Time Window Check (Should be within 2 hours of order creation / present)
    let freshnessMatch = false;
    if (extraction.extractedTimestamp) {
      const now = Date.now();
      const proofTime = extraction.extractedTimestamp.getTime();
      const ageInHours = (now - proofTime) / (1000 * 60 * 60);

      if (ageInHours >= -0.5 && ageInHours <= 2.5) { // within 2.5 hours
        freshnessMatch = true;
      } else if (ageInHours > 2.5 && ageInHours <= 24) {
        flags.push(`PROOF_OLDER_THAN_2_HOURS (${Math.round(ageInHours)}h old)`);
        confidenceScore -= 20;
      } else if (ageInHours > 24) {
        flags.push(`STALE_PROOF_MORE_THAN_24H_OLD (${Math.round(ageInHours / 24)}d old)`);
        confidenceScore -= 45;
      } else {
        // Future timestamp error
        flags.push("INVALID_FUTURE_TIMESTAMP");
        confidenceScore -= 30;
      }
    } else {
      flags.push("TIMESTAMP_UNAVAILABLE_ON_PROOF");
      confidenceScore -= 5;
    }

    // 8. Order Amount Match Check
    let amountMatch = false;
    if (expectedOrder) {
      const expectedAmount = expectedOrder.totalAmount || 0;
      let actualAmountInXof = extraction.amount || 0;

      // Handle currency conversion for verification if needed
      if (extraction.currency !== "XOF") {
          const rates: any = {
            GHS: 40, // 1 GHS approx 40 XOF (Secure fixed rate for validation)
            GNF: 0.07, // 1 GNF approx 0.07 XOF
            NGN: 0.4, // 1 NGN approx 0.4 XOF
            USD: 600,
            EUR: 655.95
          };
          const rate = rates[extraction.currency.toUpperCase()];
          if (rate) {
              actualAmountInXof = (extraction.amount || 0) * rate;
          }
      }

      const diff = Math.abs(expectedAmount - actualAmountInXof);

      // Tolerance is higher for international transfers due to fees/fx (5% or 500 XOF)
      const tolerance = extraction.currency === "XOF" ? 100 : Math.max(500, expectedAmount * 0.05);

      if (diff <= tolerance) {
        amountMatch = true;
      } else {
        flags.push(`AMOUNT_MISMATCH (Expected XOF: ${expectedAmount}, Screen ${extraction.currency}: ${extraction.amount} -> approx ${Math.round(actualAmountInXof)} XOF)`);
        confidenceScore -= 40;
      }
    }

    // Clamp score to [0, 100]
    confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));

    // 9. Three-Tier Decision Engine
    let decision: "AUTO_APPROVED" | "FLAGGED_FOR_REVIEW" | "REJECTED_FRAUD";

    const hasCriticalRedFlags = flags.some(f => 
      f.includes("DUPLICATE") || 
      f.includes("AI_GENERATED") || 
      f.includes("VISUAL_TAMPERING") || 
      f.includes("STALE_PROOF")
    );

    if (confidenceScore >= 85 && !hasCriticalRedFlags && (expectedOrder ? amountMatch : true)) {
      decision = "AUTO_APPROVED";
    } else if (confidenceScore >= 50) {
      decision = "FLAGGED_FOR_REVIEW";
    } else {
      decision = "REJECTED_FRAUD";
    }

    // 10. Persist Audit Log in Database
    const logDoc = await PaymentProofLogModel.create({
      merchantId: merchant._id,
      customerId: customer._id,
      orderId: expectedOrder?._id,
      imageHash,
      platform: extraction.platform,
      transactionId: extraction.transactionId || `AUTO-${Date.now()}`,
      amount: extraction.amount,
      currency: extraction.currency,
      senderName: extraction.senderName,
      senderPhone: extraction.senderPhone,
      recipientName: extraction.recipientName,
      recipientPhone: extraction.recipientPhone,
      extractedTimestamp: extraction.extractedTimestamp,
      fraudAnalysis: {
        confidenceScore,
        isAiGenerated: extraction.forensics.isAiGenerated,
        isPhotoshopTampered: extraction.forensics.isPhotoshopTampered || extraction.forensics.fontMismatchDetected,
        recipientMatch,
        amountMatch,
        freshnessMatch,
        operatorSyntaxValid: isSyntaxValid,
        tamperingFlags: flags,
        rawAiVerdict: extraction.forensics.analysisSummary
      },
      decision,
      reviewedByMerchant: decision === "AUTO_APPROVED",
      merchantDecision: decision === "AUTO_APPROVED" ? "approved" : undefined
    });

    logger.info(`[Payment Shield] Audit for Order ${expectedOrder?._id || 'N/A'}: Decision=${decision}, Score=${confidenceScore}%, Flags=${flags.join(", ") || "None"}`);

    return {
      decision,
      confidenceScore,
      flags,
      extraction,
      imageHash,
      logId: logDoc._id.toString()
    };
  }
}

export const paymentShieldService = new PaymentShieldService();
