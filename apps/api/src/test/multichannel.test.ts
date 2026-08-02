import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel } from '../modules/commerce/commerce.model.js';
import { instagramService } from '../modules/instagram/instagram.service.js';
import { aiAgentService } from '../services/ai-agent.service.js';

// Mock Redis to avoid ECONNREFUSED :6379 during tests
vi.mock('../config/redis.js', () => ({
  connectRedis: vi.fn(),
  getRedisClient: vi.fn(() => ({
    isOpen: true,
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
  })),
}));

vi.mock('../services/ai-agent.service.js', () => ({
  aiAgentService: {
    generateResponse: vi.fn().mockResolvedValue("Réponse Insta")
  }
}));

describe('Multi-Canal (Instagram) Audit Tests', () => {
  const merchantId = "507f1f77bcf86cd799439011";
  const pageId = "insta_page_123";

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should route Instagram webhook to correct merchant', async () => {
    const mockMerchant = {
      _id: merchantId,
      ownerId: "user_1",
      businessName: "Boutique Insta",
      aiSettings: { autoReply: true },
      toObject: function() { return this; }
    };

    const findSpy = vi.spyOn(CommerceMerchantModel, 'findOne').mockResolvedValue(mockMerchant as any);
    vi.spyOn(CommerceMerchantModel, 'findById').mockResolvedValue(mockMerchant as any);

    const payload = {
      object: "instagram",
      entry: [{
        id: pageId,
        messaging: [{
          sender: { id: "customer_ig_1" },
          message: { text: "Prix ?" }
        }]
      }]
    };

    const response = await request(app)
      .post('/api/instagram/webhook')
      .send(payload);

    expect(response.status).toBe(200);
    expect(findSpy).toHaveBeenCalledWith({ "instagramConfig.pageId": pageId });
  });

  it('should create conversation with platform "instagram"', async () => {
    const mockMerchant = { _id: merchantId, ownerId: "user_1", instagramConfig: { pageId } };
    vi.spyOn(CommerceMerchantModel, 'findOne').mockResolvedValue(mockMerchant as any);

    const createConvSpy = vi.spyOn(CommerceConversationModel, 'create');
    const createMsgSpy = vi.spyOn(CommerceMessageModel, 'create');

    await instagramService.handleIncomingMessage(pageId, "sender_1", "Hello");

    expect(createConvSpy).toHaveBeenCalledWith(expect.objectContaining({
      platform: "instagram"
    }));
  });
});
