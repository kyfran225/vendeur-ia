import request from 'supertest';
import { app } from '../../app.js';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { CommerceMerchantModel, CommerceProductModel, CommerceOrderModel, CommerceCustomerModel } from './commerce.model.js';
import { WhatsAppConnectionModel } from './whatsapp-connection.model.js';

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

describe('Commerce Module API', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const userData = {
      email: `commerce_test_${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'Commerce Tester',
    };
    const regRes = await request(app).post('/api/auth/register').send(userData);
    accessToken = regRes.body.accessToken;
    userId = (jwt.decode(accessToken) as any).id;
  });

  const setupMerchant = async () => {
    return await CommerceMerchantModel.create({
      ownerId: userId,
      businessName: "Test Shop",
      category: "fashion",
      city: "Abidjan"
    });
  };

  describe('Merchant Creation', () => {
    it('should be idempotent and return 201 or handle existing', async () => {
      const merchantData = {
        businessName: "Idempotent Shop",
        category: "fashion",
        city: "Abidjan",
        address: "Test Address",
        whatsappNumber: "+22500000000"
      };

      // First call
      const res1 = await request(app)
        .post('/api/commerce/merchant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(merchantData);

      expect([201, 200]).toContain(res1.status);
      expect(res1.body.businessName).toBe(merchantData.businessName);

      // Second call (should be idempotent)
      const res2 = await request(app)
        .post('/api/commerce/merchant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(merchantData);

      expect([201, 200, 409]).toContain(res2.status);
      if (res2.status === 409) {
        expect(res2.body.error).toMatch(/exists/i);
      } else {
        expect(res2.body.businessName).toBe(merchantData.businessName);
      }
    });
  });

  describe('Product Management', () => {
    it('should create and update a product', async () => {
      await setupMerchant();

      // Create
      const createRes = await request(app)
        .post('/api/commerce/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: "Test Product",
          price: 1000,
          stock: 10,
          imageUrl: "http://img.com/1.jpg"
        });

      expect(createRes.status).toBe(201);
      const productId = createRes.body._id;

      // Update
      const updateRes = await request(app)
        .patch(`/api/commerce/products/${productId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 2000 });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.price).toBe(2000);
    });
  });

  describe('Order Management', () => {
    it('should create and list orders', async () => {
      const merchant = await setupMerchant();
      const customer = await CommerceCustomerModel.create({
        merchantId: merchant._id,
        phone: "+22501010101",
        name: "Order Client"
      });

      // Create Order
      const createRes = await request(app)
        .post('/api/commerce/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ productId: "507f1f77bcf86cd799439011", name: "P1", price: 500, quantity: 1 }],
          totalAmount: 500
        });

      expect(createRes.status).toBe(201);

      // List Orders
      const listRes = await request(app)
        .get('/api/commerce/orders')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThan(0);
    });
  });

  describe('WhatsApp Cloud Direct (Auto-Provisioning & Setup Status)', () => {
    it('should initialize WhatsApp Baileys connection record when merchant has phone', async () => {
      const uniquePhone = `+225070000${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await request(app)
        .post('/api/commerce/merchant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessName: "Direct Cloud Shop",
          category: "beauty",
          city: "Abidjan",
          whatsappNumber: uniquePhone
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.whatsappConfig?.provider).toBe('baileys');
      expect(res.body.whatsappConfig?.status).toBe('disconnected');

      // Check WhatsAppConnectionModel is also created with NOT_CONNECTED & baileys
      const conn = await WhatsAppConnectionModel.findOne({ userId });
      expect(conn).toBeDefined();
      expect(conn?.status).toBe('NOT_CONNECTED');
      expect(conn?.connectionType).toBe('baileys');
    });

    it('should calculate setupStatus with whatsapp step completed only when actually connected', async () => {
      await request(app)
        .post('/api/commerce/merchant')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          businessName: "Direct Cloud Shop 2",
          category: "beauty",
          city: "Abidjan",
          whatsappNumber: "+2250700112233"
        });

      // 1. Initially NOT connected
      const dashRes1 = await request(app)
        .get('/api/commerce/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(dashRes1.status).toBe(200);
      expect(dashRes1.body.setupStatus).toBeDefined();
      const waStep1 = dashRes1.body.setupStatus.steps.find((s: any) => s.id === 'whatsapp');
      expect(waStep1).toBeDefined();
      expect(waStep1.completed).toBe(false);

      // 2. Once connected via socket/cloud
      await WhatsAppConnectionModel.updateOne(
        { userId },
        { status: 'CONNECTED', connectedAt: new Date() }
      );

      const dashRes2 = await request(app)
        .get('/api/commerce/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      const waStep2 = dashRes2.body.setupStatus.steps.find((s: any) => s.id === 'whatsapp');
      expect(waStep2.completed).toBe(true);
      expect(waStep2.weight).toBe(30);
    });
  });
});
