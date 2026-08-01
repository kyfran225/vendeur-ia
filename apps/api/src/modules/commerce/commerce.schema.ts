import { z } from 'zod';

export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
    price: z.number().min(0, "Le prix ne peut pas être négatif"),
    description: z.string().optional(),
    category: z.string().optional(),
    stock: z.number().int().min(0).default(0),
    imageUrl: z.string().url().optional().or(z.string().length(0)),
    isService: z.boolean().optional(),
  })
});

export const UpdateMerchantSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    aiSettings: z.object({
      personality: z.enum(['friendly', 'professional', 'premium']).optional(),
      autoReply: z.boolean().optional(),
      voiceMode: z.boolean().optional(),
    }).optional()
  })
});
