import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import { storageService } from '../services/storage.service.js';
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

describe('Product Photo Optimization & Visual Intelligence', () => {
  it('should optimize and compress an image buffer using sharp', async () => {
    // Create a 2000x2000 test PNG image
    const rawBuffer = await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 3,
        background: { r: 255, g: 100, b: 50 }
      }
    })
    .png()
    .toBuffer();

    expect(rawBuffer.length).toBeGreaterThan(0);

    const optimized = await storageService.optimizeImage(rawBuffer);
    expect(optimized).not.toBeNull();
    expect(optimized!.mimeType).toBe('image/jpeg');
    expect(optimized!.extension).toBe('jpg');

    // Inspect metadata of optimized image
    const meta = await sharp(optimized!.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(1200);
    expect(meta.height).toBeLessThanOrEqual(1200);
    expect(meta.format).toBe('jpeg');
  });

  it('should include photo availability tags and prompt instructions in aiAgentService', () => {
    const mockMerchant = {
      _id: 'merchant_123',
      businessName: 'Boutique Chic',
      category: 'fashion',
      city: 'Abidjan',
      country: 'CI',
      currency: 'XOF',
      slug: 'boutique-chic'
    };

    const mockProducts = [
      {
        _id: 'prod_1',
        name: 'Robe Rouge Elegance',
        price: 15000,
        currency: 'XOF',
        stock: 5,
        availability: 'available',
        images: ['https://cdn.example.com/robe-rouge.jpg'],
        imageUrl: 'https://cdn.example.com/robe-rouge.jpg'
      },
      {
        _id: 'prod_2',
        name: 'Sac Noir Cuir',
        price: 25000,
        currency: 'XOF',
        stock: 2,
        availability: 'available',
        images: [],
        imageUrl: ''
      }
    ];

    const prompt = (aiAgentService as any).buildSystemPrompt({
      merchant: mockMerchant,
      products: mockProducts,
      knowledge: {},
      history: [],
      message: 'Montrez-moi la robe rouge svp',
      customerPhone: '+2250700000000',
      platform: 'whatsapp'
    });

    // Check that photo availability is marked
    expect(prompt).toContain('Robe Rouge Elegance');
    expect(prompt).toContain('[Photo disponible]');
    expect(prompt).toContain('ACTION_SEND_PRODUCT_IMAGE');
    expect(prompt).toContain('boutique-chic');
  });

  it('should parse ACTION_SEND_PRODUCT_IMAGE tag cleanly', () => {
    const rawReply = 'Voici notre magnifique Robe Rouge Elegance en taille M ! 🛍️ [[ACTION_SEND_PRODUCT_IMAGE:{"productId":"prod_1","productName":"Robe Rouge Elegance"}]]';
    const sendImageMatch = rawReply.match(/\[\[ACTION_SEND_PRODUCT_IMAGE:([\s\S]*?)\]\]/);

    expect(sendImageMatch).not.toBeNull();
    const payload = JSON.parse(sendImageMatch![1]);
    expect(payload.productId).toBe('prod_1');
    expect(payload.productName).toBe('Robe Rouge Elegance');

    const cleanReply = rawReply.replace(/\[\[ACTION_SEND_PRODUCT_IMAGE:[\s\S]*?\]\]/, '').trim();
    expect(cleanReply).toBe('Voici notre magnifique Robe Rouge Elegance en taille M ! 🛍️');
    expect(cleanReply).not.toContain('ACTION_SEND_PRODUCT_IMAGE');
  });
});
