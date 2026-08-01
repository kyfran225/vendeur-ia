import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commerceService } from '../modules/commerce/commerce.service.js';
import { CommerceOrderModel, CommerceConversationModel, CommerceMessageModel, CommerceKnowledgeModel } from '../modules/commerce/commerce.model.js';
import { aiProvider } from '../services/ai-provider.js';

vi.mock('../services/ai-provider.js', () => ({
  aiProvider: {
    generateText: vi.fn()
  }
}));

describe('AI Learning & Memory Audit Tests', () => {
  const merchantId = "507f1f77bcf86cd799439011";
  const customerId = "507f1f77bcf86cd799439012";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger knowledge extraction after order payment', async () => {
    const mockOrder = {
      _id: "607f1f77bcf86cd799439013",
      merchantId,
      customerId,
      totalAmount: 10000,
      status: 'pending',
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(CommerceOrderModel, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockOrder)
    } as any);

    vi.spyOn(CommerceConversationModel, 'findOne').mockResolvedValue({ _id: "conv_1" } as any);
    vi.spyOn(CommerceMessageModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([{ sender: 'customer', content: 'Je veux du bleu' }])
    } as any);

    vi.spyOn(aiProvider, 'generateText').mockResolvedValue(JSON.stringify({
      insight: "Le bleu est très demandé",
      type: "product"
    }));

    const updateSpy = vi.spyOn(CommerceKnowledgeModel, 'findOneAndUpdate').mockResolvedValue({} as any);

    await commerceService.extractMerchantKnowledge(mockOrder._id);

    expect(aiProvider.generateText).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('should generate summary for long conversations', async () => {
    vi.spyOn(CommerceMessageModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([
            { sender: 'customer', content: 'Habite à Cocody' },
            { sender: 'ai', content: 'Ok' }
        ])
    } as any);

    vi.spyOn(aiProvider, 'generateText').mockResolvedValue("Lieu: Cocody");
    const updateSpy = vi.spyOn(CommerceConversationModel, 'findByIdAndUpdate').mockResolvedValue({} as any);

    await commerceService.updateConversationSummary("conv_1");

    expect(updateSpy).toHaveBeenCalledWith("conv_1", {
      $set: { aiSummary: "Lieu: Cocody" }
    });
  });
});
