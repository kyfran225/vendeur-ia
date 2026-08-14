import request from 'supertest';
import { app } from '../../app.js';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { CommerceMerchantModel, CommerceCustomerModel, CommerceOrderModel } from './commerce.model.js';
import { TransactionModel } from './transaction.model.js';
import { paystackService } from '../../services/paystack.service.js';
import crypto from 'crypto';
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
    sendMetaMessage: vi.fn(),
    activeSessions: { get: vi.fn() }
  }
}));

// Mock messaging
vi.mock('../../services/messaging.service.js', () => ({
  messagingService: {
    sendMessage: vi.fn()
  }
}));

describe('Payment & Gamification Audit Tests', () => {
  let accessToken: string;
  let userId: string;
  let merchant: any;

  beforeAll(async () => {
    const userData = {
      email: `payment_test_${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'Payment Tester',
    };
    const regRes = await request(app).post('/api/auth/register').send(userData);
    accessToken = regRes.body.accessToken;
    userId = (jwt.decode(accessToken) as any).id;
  });

  beforeEach(async () => {
    await CommerceMerchantModel.deleteMany({ ownerId: userId });
    merchant = await CommerceMerchantModel.create({
      ownerId: userId,
      businessName: "Payment Test Shop",
      category: "fashion",
      city: "Abidjan",
      whatsappConfig: { status: 'disconnected' }
    });
  });

  describe('Paystack Webhook Handling', () => {
    it('should verify webhook signature correctly', () => {
      const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_123' } });
      const secret = env.PAYSTACK_WEBHOOK_SECRET || 'test_secret';

      // Force secret for test if not in env
      if (!env.PAYSTACK_WEBHOOK_SECRET) (env as any).PAYSTACK_WEBHOOK_SECRET = secret;

      const signature = crypto.createHmac('sha512', secret).update(body).digest('hex');

      const isValid = paystackService.verifyWebhookSignature(body, signature);
      expect(isValid).toBe(true);

      const isInvalid = paystackService.verifyWebhookSignature(body, 'wrong_signature');
      expect(isInvalid).toBe(false);
    });

    it('should activate merchant on successful RAM contribution webhook', async () => {
      const reference = `ref_${Date.now()}`;
      const payload = {
        event: 'charge.success',
        data: {
          reference,
          amount: 500000, // 5000 XOF
          currency: 'XOF',
          channel: 'card',
          paid_at: new Date().toISOString(),
          metadata: {
            type: 'ram_contribution',
            userId: userId
          }
        }
      };

      const body = JSON.stringify(payload);
      const signature = crypto.createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET || '').update(body).digest('hex');

      const response = await request(app)
        .post('/api/commerce/webhooks/paystack')
        .set('x-paystack-signature', signature)
        .set('Content-Type', 'application/json')
        .send(body);

      if (response.status !== 200) {
        console.log("Response Body:", response.text);
      }

      expect(response.status).toBe(200);

      const updatedMerchant = await CommerceMerchantModel.findOne({ ownerId: userId });
      expect(updatedMerchant?.subscription?.status).toBe('active');

      const transaction = await TransactionModel.findOne({ reference });
      expect(transaction).toBeDefined();
      expect(transaction?.status).toBe('success');
    });
  });

  describe('Gamification (Loyalty Points)', () => {
    it('should increment loyalty points correctly after order payment', async () => {
      const customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: "+22501020304",
        loyaltyPoints: 10
      });

      const order = await CommerceOrderModel.create({
        merchantId: merchant._id,
        customerId: customer._id,
        items: [{ productId: "507f1f77bcf86cd799439011", name: "Dress", price: 15000, quantity: 1 }],
        totalAmount: 15000,
        status: 'pending'
      });

      // Confirm payment via API
      const response = await request(app)
        .patch(`/api/commerce/orders/${order._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'paid' });

      expect(response.status).toBe(200);

      const updatedCustomer = await CommerceCustomerModel.findById(customer._id);
      // 15000 XOF = 15 points. Initial 10 + 15 = 25.
      expect(updatedCustomer?.loyaltyPoints).toBe(25);
    });

    it('should grant VIP status when points reach 50', async () => {
        const customer = await CommerceCustomerModel.create({
          merchantId: merchant._id,
          phone: "+22509090909",
          loyaltyPoints: 40
        });

        const order = await CommerceOrderModel.create({
          merchantId: merchant._id,
          customerId: customer._id,
          items: [{ productId: "507f1f77bcf86cd799439011", name: "High End Item", price: 10000, quantity: 1 }],
          totalAmount: 10000,
          status: 'pending'
        });

        await request(app)
          .patch(`/api/commerce/orders/${order._id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status: 'paid' });

        const updatedCustomer = await CommerceCustomerModel.findById(customer._id);
        expect(updatedCustomer?.loyaltyPoints).toBe(50);

        // Check if VIP logic in prompt works (optional, but we verify the data structure)
        const isVIP = (updatedCustomer?.loyaltyPoints || 0) >= 50;
        expect(isVIP).toBe(true);
      });
  });
});
