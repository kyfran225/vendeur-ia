import request from 'supertest';
import { app } from '../../app.js';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { CommerceMerchantModel, CommerceCustomerModel } from './commerce.model.js';
import { PaymentIntentModel } from './payment-intent.model.js';
import { SubscriptionModel } from './subscription.model.js';
import { TransactionModel } from './transaction.model.js';
import { commerceService } from './commerce.service.js';
import { marketingService } from '../../services/marketing.service.js';
import { paymentService } from '../../services/payment.service.js';
import { paymentShieldService } from '../../services/payment-shield.service.js';
import { env } from '../../config/env.js';

// Mock Redis
vi.mock('../../config/redis.js', () => ({
  connectRedis: vi.fn(),
  getRedisClient: vi.fn(() => ({
    isOpen: true,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
  })),
}));

// Mock logger
vi.mock('../../services/logger.service.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock WhatsApp
vi.mock('../whatsapp/whatsapp.service.js', () => ({
  whatsappService: {
    sendMessage: vi.fn().mockResolvedValue(true),
    sendMetaMessage: vi.fn().mockResolvedValue(true),
    activeSessions: { get: vi.fn() }
  }
}));

// Mock Push Service
vi.mock('../../services/push.service.js', () => ({
  pushService: {
    sendNotification: vi.fn().mockResolvedValue(true)
  }
}));

// Mock AI Queue
vi.mock('../../services/ai-queue.service.js', () => ({
  aiQueue: {
    add: vi.fn().mockResolvedValue({ id: 'job-123' })
  },
  addAIJob: vi.fn().mockResolvedValue({ id: 'job-123' })
}));

// Mock socket server
vi.mock('../../realtime/socketServer.js', () => ({
  initSocketServer: vi.fn(),
  getIO: vi.fn(() => ({ emit: vi.fn(), to: vi.fn(() => ({ emit: vi.fn() })) })),
  emitToUser: vi.fn(),
  emitGlobal: vi.fn()
}));

describe('Payment & Paywall End-to-End Suite', () => {
  let accessToken: string;
  let adminAccessToken: string;
  let userId: string;
  let merchant: any;

  beforeAll(async () => {
    const userData = {
      email: `payment_e2e_${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'Payment E2E Tester',
    };
    const regRes = await request(app).post('/api/auth/register').send(userData);
    accessToken = regRes.body.accessToken;
    userId = (jwt.decode(accessToken) as any).id;

    adminAccessToken = jwt.sign(
      { id: 'admin_super_id', email: 'franck@vendeur-ia.com', roles: ['admin'] },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );
  });

  beforeEach(async () => {
    await CommerceMerchantModel.deleteMany({ ownerId: userId });
    await SubscriptionModel.deleteMany({ userId });
    await PaymentIntentModel.deleteMany({ userId });
    await TransactionModel.deleteMany({ ownerId: userId });

    merchant = await CommerceMerchantModel.create({
      ownerId: userId,
      businessName: "E2E Test Boutique",
      category: "fashion",
      city: "Abidjan",
      whatsappNumber: "+2250102030405",
      whatsappConfig: { status: 'connected' },
      subscription: {
        status: "free_trial",
        plan: "starter"
      }
    });
  });

  describe('Phase 1: getDashboard Injection of latestPaymentIntent', () => {
    it('should return latestPaymentIntent as null when no pending intent exists', async () => {
      const dashboard = await commerceService.getDashboard(userId);
      expect(dashboard).toBeDefined();
      expect(dashboard.latestPaymentIntent).toBeNull();
    });

    it('should return active intent when payment intent is under_verification', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-TEST-001",
        provider: "wave",
        paymentMethod: "wave",
        senderPhoneNumber: "+2250102030405",
        status: "under_verification",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const dashboard = await commerceService.getDashboard(userId);
      expect(dashboard.latestPaymentIntent).toBeDefined();
      expect(dashboard.latestPaymentIntent?._id.toString()).toBe(intent._id.toString());
      expect(dashboard.latestPaymentIntent?.reference).toBe("VIA-TEST-001");
      expect(dashboard.latestPaymentIntent?.status).toBe("under_verification");
      expect(dashboard.latestPaymentIntent?.amount).toBe(5000);
    });

    it('should query getDashboard via HTTP endpoint and include latestPaymentIntent', async () => {
      await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "pro",
        planName: "Pack Pro Expert",
        billingInterval: "yearly",
        amount: 50000,
        currency: "XOF",
        reference: "VIA-TEST-002",
        provider: "orange_money",
        paymentMethod: "orange_money",
        senderPhoneNumber: "+2250708091011",
        status: "under_verification",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const res = await request(app)
        .get('/api/commerce/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.latestPaymentIntent).toBeDefined();
      expect(res.body.latestPaymentIntent.reference).toBe("VIA-TEST-002");
      expect(res.body.latestPaymentIntent.planName).toBe("Pack Pro Expert");
      expect(res.body.latestPaymentIntent.billingInterval).toBe("yearly");
    });
  });

  describe('Phase 1: Marketing Route Paywall Protection', () => {
    it('should throw error when launching broadcast with no active subscription', async () => {
      await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: "+2250701020304",
        name: "Client Test"
      });

      await expect(
        marketingService.launchBroadcast(
          merchant._id.toString(),
          "",
          "all",
          "Offre exclusive du week-end !"
        )
      ).rejects.toThrow("Les campagnes de diffusion WhatsApp nécessitent un forfait Vendeur IA actif.");
    });

    it('should allow launching broadcast when subscription is active in SubscriptionModel', async () => {
      await SubscriptionModel.create({
        userId,
        offerId: merchant._id,
        status: "active",
        billingInterval: "monthly",
        price: 5000,
        currency: "XOF",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        paymentMethod: "mobile_money",
        provider: "wave"
      });

      await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: "+2250701020304",
        name: "Client Test"
      });

      const result = await marketingService.launchBroadcast(
        merchant._id.toString(),
        "",
        "all",
        "Offre exclusive du week-end !"
      );

      expect(result).toBeDefined();
      expect(result.count).toBeGreaterThan(0);
      expect(result.status).toBe("active");
    });
  });

  describe('Phase 2 & 4: Payment Intent Proof Submission & Activation', () => {
    it('should submit proof and transition intent to under_verification when manual review required', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-E2E-PROOF-VERIF",
        provider: "wave",
        paymentMethod: "wave",
        senderPhoneNumber: "+2250102030405",
        status: "initiated",
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Submit only sender phone without transaction ID -> score 55 (< 95 threshold) -> under_verification
      const res = await paymentService.submitPaymentProof(intent._id.toString(), userId, {
        senderPhoneNumber: "+2250102030405"
      });

      expect(res.intent.status).toBe("under_verification");
      expect(res.intent.confidenceScore).toBe(70);
      expect(res.intent.verificationSignals?.senderMatch).toBe(true);
    });

    it('should auto-approve payment intent when confidence score reaches threshold', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-E2E-AUTO-CONFIRM",
        provider: "wave",
        paymentMethod: "wave",
        senderPhoneNumber: "+2250102030405",
        status: "initiated",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const res = await paymentService.submitPaymentProof(intent._id.toString(), userId, {
        transactionId: "TRX_WAVE_998877",
        senderPhoneNumber: "+2250102030405"
      });

      expect(res.intent.status).toBe("confirmed");
      expect(res.intent.confidenceScore).toBe(100);
      expect(res.intent.verificationSignals?.transactionIdUnique).toBe(true);

      const sub = await SubscriptionModel.findOne({ userId });
      expect(sub?.status).toBe("active");
    });

    it('should prevent replay attack by flagging duplicate transactionId', async () => {
      // First confirmed intent with this transaction ID
      await PaymentIntentModel.create({
        userId: "other_user_123",
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-FIRST-CONFIRMED",
        provider: "wave",
        paymentMethod: "wave",
        transactionId: "DUPLICATE_TX_ID",
        status: "confirmed",
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Second intent trying to reuse the same transaction ID
      const secondIntent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-SECOND-INTENT",
        provider: "wave",
        paymentMethod: "wave",
        status: "initiated",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const res = await paymentService.submitPaymentProof(secondIntent._id.toString(), userId, {
        transactionId: "DUPLICATE_TX_ID",
        senderPhoneNumber: "+2250102030405"
      });

      expect(res.intent.status).toBe("under_verification");
      expect(res.intent.confidenceScore).toBe(0);
      expect(res.intent.verificationSignals?.transactionIdUnique).toBe(false);
    });

    it('should activate subscription idempotently when admin approves intent', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-APPROVAL-TEST",
        provider: "wave",
        paymentMethod: "wave",
        senderPhoneNumber: "+2250102030405",
        status: "under_verification",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const res = await paymentService.processAdminDecision(intent._id.toString(), "admin_user_id", {
        action: "approve",
        adminNotes: "Paiement Wave vérifié avec succès."
      });

      expect(res.intent.status).toBe("confirmed");
      expect(res.intent.verifiedBy).toBe("admin_user_id");

      // Verify SubscriptionModel updated
      const sub = await SubscriptionModel.findOne({ userId });
      expect(sub).toBeDefined();
      expect(sub?.status).toBe("active");
      expect(sub?.price).toBe(5000);

      // Verify Merchant updated
      const updatedMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      expect(updatedMerchant?.subscription?.status).toBe("active");
      expect(updatedMerchant?.subscription?.plan).toBe("essential");

      // Verify TransactionModel created
      const trx = await TransactionModel.findOne({ reference: "VIA-APPROVAL-TEST" });
      expect(trx).toBeDefined();
      expect(trx?.status).toBe("success");
      expect(trx?.amount).toBe(5000);
    });
  });

  describe('Phase 5: Forensic AI Vision Receipt Scanner & Anti-Fraud Shield', () => {
    it('should scan receipt proof, extract metadata and verify authenticity', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-SCAN-TEST",
        provider: "wave",
        paymentMethod: "wave",
        status: "initiated",
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Mock runForensicVisionAudit to simulate genuine receipt
      const auditSpy = vi.spyOn(paymentShieldService, 'runForensicVisionAudit').mockResolvedValueOnce({
        isPaymentProof: true,
        platform: "Wave",
        amount: 5000,
        currency: "XOF",
        transactionId: "T-WAVE-123456",
        senderPhone: "+2250102030405",
        senderName: "Konan Kouassi",
        status: "success",
        forensics: {
          isAiGenerated: false,
          isPhotoshopTampered: false,
          fontMismatchDetected: false,
          compressionArtifactsDetected: false,
          uiInconsistencies: [],
          confidenceRating: 95,
          analysisSummary: "Reçu authentique Wave validé."
        }
      });

      const res = await request(app)
        .post(`/api/commerce/payments/intent/${intent._id}/scan-proof`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('receipt', Buffer.from('fake-image-bytes'), 'wave_receipt.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.platform).toBe("Wave");
      expect(res.body.transactionId).toBe("T-WAVE-123456");
      expect(res.body.amount).toBe(5000);
      expect(res.body.amountMatches).toBe(true);
      expect(res.body.confidenceScore).toBeGreaterThanOrEqual(95);

      // Verify intent was updated with forensic data
      const updatedIntent = await PaymentIntentModel.findById(intent._id);
      expect(updatedIntent?.transactionId).toBe("T-WAVE-123456");
      expect(updatedIntent?.forensics?.isPhotoshopTampered).toBe(false);

      auditSpy.mockRestore();
    });

    it('should detect photoshop tampered receipts and flag for fraud', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "pro",
        planName: "Pack Pro Expert",
        billingInterval: "yearly",
        amount: 50000,
        currency: "XOF",
        reference: "VIA-FRAUD-TEST",
        provider: "orange_money",
        paymentMethod: "orange_money",
        status: "initiated",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const auditSpy = vi.spyOn(paymentShieldService, 'runForensicVisionAudit').mockResolvedValueOnce({
        isPaymentProof: true,
        platform: "Orange Money",
        amount: 50000,
        currency: "XOF",
        transactionId: "CI2608FAKE999",
        senderPhone: "+2250708091011",
        status: "success",
        forensics: {
          isAiGenerated: false,
          isPhotoshopTampered: true,
          fontMismatchDetected: true,
          compressionArtifactsDetected: true,
          uiInconsistencies: ["Police de caractère modifiée sur le montant"],
          confidenceRating: 10,
          analysisSummary: "Altération graphique détectée sur les chiffres du montant."
        }
      });

      const res = await request(app)
        .post(`/api/commerce/payments/intent/${intent._id}/scan-proof`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('receipt', Buffer.from('fake-fraud-image'), 'fraud_receipt.jpg');

      expect(res.status).toBe(200);
      expect(res.body.confidenceScore).toBe(0);
      expect(res.body.flags).toContain("RETOUCHE_GRAPHIQUE_DÉTECTÉE");

      auditSpy.mockRestore();
    });

    it('should allow admin to reject payment with structured reason code and notify merchant', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-REJECT-REASON-TEST",
        provider: "wave",
        paymentMethod: "wave",
        senderPhoneNumber: "+2250102030405",
        status: "under_verification",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const res = await request(app)
        .post(`/api/admin/payments/${intent._id}/decision`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: "reject",
          rejectionCode: "amount_mismatch",
          rejectionReason: "Montant reçu inférieur au tarif du forfait",
          adminNotes: "Reçu 2 500 CFA au lieu de 5 000 CFA."
        });

      expect(res.status).toBe(200);
      expect(res.body.intent.status).toBe("rejected");
      expect(res.body.intent.rejectionCode).toBe("amount_mismatch");
      expect(res.body.intent.rejectionReason).toBe("Montant reçu inférieur au tarif du forfait");
      expect(res.body.intent.adminNotes).toContain("Reçu 2 500 CFA");
    });

    it('should allow admin to request a clearer receipt rescan', async () => {
      const intent = await PaymentIntentModel.create({
        userId,
        merchantId: merchant._id,
        offerSlug: "essential",
        planName: "Formule Essentiel",
        billingInterval: "monthly",
        amount: 5000,
        currency: "XOF",
        reference: "VIA-RESCAN-TEST",
        provider: "wave",
        paymentMethod: "wave",
        status: "under_verification",
        expiresAt: new Date(Date.now() + 3600000)
      });

      const res = await request(app)
        .post(`/api/admin/payments/${intent._id}/decision`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: "request_rescan",
          adminNotes: "Capture floue, merci de renvoyer le reçu complet."
        });

      expect(res.status).toBe(200);
      expect(res.body.intent.status).toBe("under_verification");
      expect(res.body.intent.adminNotes).toBe("Capture floue, merci de renvoyer le reçu complet.");
    });

    it('should update multi-country manual payment numbers and threshold', async () => {
      const res = await request(app)
        .patch(`/api/admin/payments/config`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          recipientName: "Vendeur IA Trésorerie Officielle",
          waveNumber: "+2250700001111",
          orangeMoneyNumber: "+2250700002222",
          autoApproveConfidenceThreshold: 90,
          regionalRoutes: [
            {
              countryCode: "SN",
              waveNumber: "+221770001111",
              orangeMoneyNumber: "+221770002222",
              instructions: "Transfert direct Wave Sénégal"
            },
            {
              countryCode: "FR",
              bankDetails: "FR76 3000 6000 0112 3456 7890 123",
              instructions: "Virement SEPA Europe"
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.manualPaymentConfig.recipientName).toBe("Vendeur IA Trésorerie Officielle");
      expect(res.body.manualPaymentConfig.autoApproveConfidenceThreshold).toBe(90);
      expect(res.body.manualPaymentConfig.regionalRoutes.length).toBe(2);
    });
  });
});
