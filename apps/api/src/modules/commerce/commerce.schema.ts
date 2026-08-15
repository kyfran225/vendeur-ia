import { z } from 'zod';

export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
    price: z.number().min(0, "Le prix ne peut pas être négatif"),
    description: z.string().optional(),
    category: z.string().optional(),
    stock: z.number().int().min(0).default(0),
    imageUrl: z.string().optional().or(z.string().length(0)),
    images: z.array(z.string()).optional(),
    isService: z.boolean().optional(),
    digitalUrl: z.string().optional(),
    digitalFormat: z.string().optional(),
    serviceDuration: z.string().optional(),
    serviceDeliveryType: z.string().optional(),
    preparationTime: z.string().optional(),
    foodOptions: z.string().optional(),
  })
});

export const UpdateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    price: z.number().min(0).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string()).optional(),
    availability: z.enum(["available", "limited", "sold_out", "hidden"]).optional(),
    isService: z.boolean().optional(),
    digitalUrl: z.string().optional(),
    digitalFormat: z.string().optional(),
    serviceDuration: z.string().optional(),
    serviceDeliveryType: z.string().optional(),
    preparationTime: z.string().optional(),
    foodOptions: z.string().optional(),
  })
});

export const CreateOrderSchema = z.object({
  body: z.object({
    customerId: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number().int().positive()
    })),
    totalAmount: z.number(),
    currency: z.string().default("XOF"),
    shippingAddress: z.string().optional(),
    paymentMethod: z.string().optional(),
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
    country: z.string().optional(),
    currency: z.string().optional(),
    paymentChannels: z.array(z.object({
      provider: z.string(),
      label: z.string().optional(),
      number: z.string(),
      customLabel: z.string().optional()
    })).optional(),
    aiSettings: z.object({
      personality: z.enum(['friendly', 'professional', 'premium']).optional(),
      autoReply: z.boolean().optional(),
      voiceMode: z.boolean().optional(),
      localSlang: z.boolean().optional(),
    }).optional(),
    loyaltySettings: z.object({
      enabled: z.boolean().optional(),
      pointsPerOrder: z.number().optional(),
      threshold: z.number().optional(),
      rewardDescription: z.string().optional(),
    }).optional()
  })
});
