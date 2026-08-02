import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock socketServer to avoid real WebSocket connections
vi.mock('../realtime/socketServer.js', () => ({
  emitToUser: vi.fn(),
}));

// Mock ai-queue to avoid real job queue
vi.mock('../services/ai-queue.service.js', () => ({
  addAIJob: vi.fn(),
}));

// Mock commerceService
vi.mock('../modules/commerce/commerce.service.js', () => ({
  commerceService: {
    getSalesContext: vi.fn().mockResolvedValue({}),
  },
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
      aiSettings: { autoReply: false }, // autoReply off pour éviter getSalesContext
      toObject: function() { return this; }
    };

    const findSpy = vi.spyOn(CommerceMerchantModel, 'findOne').mockResolvedValue(mockMerchant as any);

    // Simule ce que le webhook handler fait : appelle handleIncomingMessage
    await instagramService.handleIncomingMessage(pageId, "customer_ig_1", "Prix ?");

    expect(findSpy).toHaveBeenCalledWith({ "instagramConfig.pageId": pageId });
  });

  it('should create conversation with platform "instagram"', async () => {
    const mockMerchant = { _id: merchantId, ownerId: "user_1", instagramConfig: { pageId }, aiSettings: { autoReply: false } };
    vi.spyOn(CommerceMerchantModel, 'findOne').mockResolvedValue(mockMerchant as any);

    const createConvSpy = vi.spyOn(CommerceConversationModel, 'create');

    await instagramService.handleIncomingMessage(pageId, "sender_1", "Hello");

    expect(createConvSpy).toHaveBeenCalledWith(expect.objectContaining({
      platform: "instagram"
    }));
  });
});
