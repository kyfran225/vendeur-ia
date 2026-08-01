import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsappService } from './whatsapp.service.js';
import { CommerceMerchantModel, CommerceConversationModel } from '../commerce/commerce.model.js';
import { SystemSettingsModel } from '../commerce/admin.model.js';
import { env } from '../../config/env.js';

// Mock Models
vi.mock('../commerce/commerce.model.js', () => ({
  CommerceMerchantModel: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
  CommerceConversationModel: {
    findOne: vi.fn(() => ({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
    })),
  },
  CommerceCustomerModel: {},
  CommerceMessageModel: {},
  CommerceProductModel: {},
  CommerceKnowledgeModel: {},
}));

vi.mock('../commerce/admin.model.js', () => ({
  SystemSettingsModel: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../config/env.js', () => ({
  env: {
    WHATSAPP_PHONE_ID: 'env-phone-id',
    WHATSAPP_ACCESS_TOKEN: 'env-access-token',
  },
}));

// Mock other services
vi.mock('./whatsapp-media.service.js', () => ({
  whatsappMediaService: {},
}));
vi.mock('../../services/ai-provider.js', () => ({
  aiProvider: {},
}));
vi.mock('../../realtime/socketServer.js', () => ({
  emitToUser: vi.fn(),
}));

describe('WhatsAppService Multi-Tenant Config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetaConfig (Fallback Logic)', () => {
    it('should use merchant specific keys if present', async () => {
      const merchant = {
        whatsappConfig: {
          meta: {
            phoneNumberId: 'merchant-phone-id',
            accessToken: 'merchant-token'
          }
        }
      };

      const config = await (whatsappService as any).getMetaConfig(merchant);
      expect(config.phoneNumberId).toBe('merchant-phone-id');
      expect(config.accessToken).toBe('merchant-token');
    });

    it('should fallback to system settings if merchant keys are missing', async () => {
      const merchant = { whatsappConfig: { meta: {} } };

      vi.mocked(SystemSettingsModel.findOne).mockResolvedValue({
        metaConfig: {
          whatsappDefaults: {
            phoneNumberId: 'system-phone-id',
            accessToken: 'system-token'
          }
        }
      } as any);

      const config = await (whatsappService as any).getMetaConfig(merchant);
      expect(config.phoneNumberId).toBe('system-phone-id');
      expect(config.accessToken).toBe('system-token');
    });

    it('should fallback to env variables if both merchant and system keys are missing', async () => {
      const merchant = { whatsappConfig: { meta: {} } };
      vi.mocked(SystemSettingsModel.findOne).mockResolvedValue(null);

      const config = await (whatsappService as any).getMetaConfig(merchant);
      expect(config.phoneNumberId).toBe('env-phone-id');
      expect(config.accessToken).toBe('env-access-token');
    });
  });

  describe('handleMetaIncomingMessage (Routing)', () => {
    it('should route to dedicated merchant by phoneId', async () => {
      const from = '22507070707';
      const phoneId = 'dedicated-phone-id';

      const mockMerchant = { ownerId: 'user-123', businessName: 'Dedicated Shop' };
      vi.mocked(CommerceMerchantModel.findOne).mockResolvedValue(mockMerchant as any);

      // Spy on handleIncomingMessage (private-ish or internal call)
      const spy = vi.spyOn(whatsappService, 'handleIncomingMessage').mockResolvedValue(undefined as any);

      await whatsappService.handleMetaIncomingMessage(from, 'Hello', phoneId);

      expect(CommerceMerchantModel.findOne).toHaveBeenCalledWith({ "whatsappConfig.meta.phoneNumberId": phoneId });
      expect(spy).toHaveBeenCalledWith('user-123', expect.anything());
    });

    it('should route to correct merchant via conversation history for shared numbers', async () => {
      const from = '22507070707';
      const sharedPhoneId = 'system-phone-id';

      // 1. No dedicated merchant found
      vi.mocked(CommerceMerchantModel.findOne).mockResolvedValue(null);

      // 2. Mock conversation lookup
      const mockConversation = {
        merchantId: 'merchant-456',
        customerId: { phone: from }
      };

      // Setup the complex query chain
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(mockConversation)
      };
      vi.mocked(CommerceConversationModel.findOne).mockReturnValue(mockQuery as any);

      const mockMerchant = { ownerId: 'user-456', businessName: 'Shared Shop' };
      vi.mocked(CommerceMerchantModel.findById).mockResolvedValue(mockMerchant as any);

      const spy = vi.spyOn(whatsappService, 'handleIncomingMessage').mockResolvedValue(undefined as any);

      await whatsappService.handleMetaIncomingMessage(from, 'Hello', sharedPhoneId);

      expect(CommerceMerchantModel.findById).toHaveBeenCalledWith('merchant-456');
      expect(spy).toHaveBeenCalledWith('user-456', expect.anything());
    });
  });
});
