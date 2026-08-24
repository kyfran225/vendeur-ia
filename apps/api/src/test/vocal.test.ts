import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { aiProvider } from '../services/ai-provider.js';
import { aiAgentService } from '../services/ai-agent.service.js';
import { aiWorker } from '../services/ai-queue.service.js';
import { CommerceMessageModel, CommerceMerchantModel, CommerceConversationModel } from '../modules/commerce/commerce.model.js';
import { messagingService } from '../services/messaging.service.js';

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

vi.mock('../services/ai-provider.js', () => ({
  aiProvider: {
    generateText: vi.fn().mockResolvedValue({ text: "Ceci est un test vocal" }),
    generateSpeech: vi.fn().mockResolvedValue(Buffer.from("fake_audio_content")),
    generateResponse: vi.fn().mockResolvedValue({
      text: "Ceci est un test vocal",
      provider: "mock",
      usage: { totalTokens: 100 }
    })
  }
}));

vi.mock('../services/ai-agent.service.js', () => ({
  aiAgentService: {
    generateResponse: vi.fn().mockResolvedValue({
      text: "Ceci est un test vocal",
      provider: "mock",
      usage: { totalTokens: 100 }
    })
  }
}));

vi.mock('../services/messaging.service.js', () => ({
  messagingService: {
    sendMessage: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('AI Vocal-First Experience Audit Tests', () => {
  const merchantId = "507f1f77bcf86cd799439011";
  const userId = "user_123";
  // ObjectIds valides requis par Mongoose pour findById
  const convId1 = new Types.ObjectId().toString();
  const convId2 = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger TTS generation when voiceMode is enabled', async () => {
    // Mock Merchant with voiceMode active
    vi.spyOn(CommerceMerchantModel, 'findById').mockResolvedValue({
      _id: merchantId,
      ownerId: userId,
      subscription: { status: 'active' },
      aiSettings: { voiceMode: true }
    } as any);

    vi.spyOn(CommerceMessageModel, 'create').mockResolvedValue({ _id: "msg_1" } as any);
    // Mock findById pour éviter le CastError (appelé ligne 131 de ai-queue.service.ts)
    vi.spyOn(CommerceConversationModel, 'findById').mockResolvedValue({ status: 'open' } as any);
    vi.spyOn(CommerceConversationModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

    const job = {
      id: 'job_1',
      name: 'process-message',
      data: {
        userId,
        conversationId: convId1,
        remoteJid: "12345@s.whatsapp.net",
        merchant: {
            _id: merchantId,
            businessName: "Vocal Test",
            category: "mode",
            city: "Abidjan",
            country: "CI",
            subscription: { status: 'active' }
        },
        products: [],
        knowledge: {},
        message: "Hello",
        history: []
      }
    };

    // We manually trigger the worker processing logic (simplified for test)
    // Normally we'd use the worker's internal function if exposed,
    // but here we verify the service orchestration in ai-queue.service.ts

    // Triggering generateSpeech is the key indicator
    await (aiWorker as any).processFn(job);

    expect(aiProvider.generateSpeech).toHaveBeenCalledWith("Ceci est un test vocal");
    expect(messagingService.sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        'whatsapp',
        "12345@s.whatsapp.net",
        "Ceci est un test vocal",
        expect.objectContaining({ audioBuffer: expect.any(Buffer) })
    );
  });

  it('should fallback to text if TTS fails', async () => {
    vi.spyOn(CommerceMerchantModel, 'findById').mockResolvedValue({
      _id: merchantId,
      subscription: { status: 'active' },
      aiSettings: { voiceMode: true }
    } as any);

    vi.spyOn(aiProvider, 'generateSpeech').mockRejectedValue(new Error("TTS Error"));
    // Mock findById pour éviter le CastError
    vi.spyOn(CommerceConversationModel, 'findById').mockResolvedValue({ status: 'open' } as any);

    const job = {
      id: 'job_2',
      name: 'process-message',
      data: {
        userId,
        conversationId: convId2,
        remoteJid: "12345@s.whatsapp.net",
        merchant: {
            _id: merchantId,
            category: "mode",
            city: "Abidjan",
            country: "CI",
            subscription: { status: 'active' }
        },
        products: [],
        knowledge: {},
        message: "Fail Test",
        history: []
      }
    };

    await (aiWorker as any).processFn(job);

    // Should still send text message
    expect(messagingService.sendMessage).toHaveBeenCalledWith(
        expect.anything(),
        'whatsapp',
        "12345@s.whatsapp.net",
        "Ceci est un test vocal",
        expect.not.objectContaining({ audioBuffer: expect.any(Buffer) })
    );
  });
});
