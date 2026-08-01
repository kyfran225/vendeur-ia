import request from 'supertest';
import { app } from '../../app.js';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { CommerceMerchantModel, CommerceProductModel, CommerceOrderModel, CommerceCustomerModel } from './commerce.model.js';

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
});
