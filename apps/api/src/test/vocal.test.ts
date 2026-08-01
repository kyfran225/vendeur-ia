import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiProvider } from '../services/ai-provider.js';
import { aiWorker } from '../services/ai-queue.service.js';
import { CommerceMessageModel, CommerceMerchantModel, CommerceConversationModel } from '../modules/commerce/commerce.model.js';
import { messagingService } from '../services/messaging.service.js';

vi.mock('../services/ai-provider.js', () => ({
  aiProvider: {
    generateText: vi.fn().mockResolvedValue("Ceci est un test vocal"),
    generateSpeech: vi.fn().mockResolvedValue(Buffer.from("fake_audio_content"))
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger TTS generation when voiceMode is enabled', async () => {
    // Mock Merchant with voiceMode active
    vi.spyOn(CommerceMerchantModel, 'findById').mockResolvedValue({
      _id: merchantId,
      ownerId: userId,
      aiSettings: { voiceMode: true }
    } as any);

    vi.spyOn(CommerceMessageModel, 'create').mockResolvedValue({ _id: "msg_1" } as any);
    vi.spyOn(CommerceConversationModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

    const job = {
      id: 'job_1',
      name: 'process-message',
      data: {
        userId,
        conversationId: "conv_1",
        remoteJid: "12345@s.whatsapp.net",
        merchant: {
            _id: merchantId,
            businessName: "Vocal Test",
            category: "mode",
            city: "Abidjan",
            country: "CI"
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
      aiSettings: { voiceMode: true }
    } as any);

    vi.spyOn(aiProvider, 'generateSpeech').mockRejectedValue(new Error("TTS Error"));

    const job = {
      id: 'job_2',
      name: 'process-message',
      data: {
        userId,
        conversationId: "conv_2",
        remoteJid: "12345@s.whatsapp.net",
        merchant: {
            _id: merchantId,
            category: "mode",
            city: "Abidjan",
            country: "CI"
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
