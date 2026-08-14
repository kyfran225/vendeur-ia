import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { CommerceMerchantModel, CommerceConversationModel, CommerceMessageModel, CommerceCustomerModel } from '../modules/commerce/commerce.model.js';
import { aiProvider } from './ai-provider.js';
import { messagingService } from './messaging.service.js';
import { logger } from './logger.service.js';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

export const marketingQueue = new Queue('marketing-tasks', {
  connection: { url: REDIS_URL },
});

export const marketingWorker = new Worker(
  'marketing-tasks',
  async (job: Job) => {
    const { conversationId, merchantId, customerId } = job.data;

    try {
      const conversation = await CommerceConversationModel.findById(conversationId);
      if (!conversation || conversation.status !== 'active') return;

      // 1. Double check if a manual response was sent or order was created since job scheduling
      const lastMessage = await CommerceMessageModel.findOne({ conversationId }).sort({ timestamp: -1 });
      if (lastMessage?.sender !== 'customer') {
          logger.info(`[MarketingQueue] Skipping recovery for ${conversationId}: last message was not from customer.`);
          return;
      }

      // Check if any order was created in the last 2 hours
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      // Since we don't want to search the entire Order collection, we just rely on conversation status
      // or specific flag 'followUpSent'.
      if (conversation.followUpSent) return;

      const merchant = await CommerceMerchantModel.findById(merchantId);
      const customer = await CommerceCustomerModel.findById(customerId);
      if (!merchant || !customer) return;

      logger.info(`[MarketingQueue] Triggering abandoned cart recovery for ${customer.phone} (${merchant.businessName})`);

      // 2. Generate personalized recovery message
      const historyMessages = await CommerceMessageModel.find({ conversationId }).sort({ timestamp: -1 }).limit(5);
      const history = historyMessages.reverse().map(m => `${m.sender === 'customer' ? 'Client' : 'IA'}: ${m.content}`).join('\n');

      const prompt = `Génère un message de relance TRÈS court, discret et chaleureux pour ce client qui a arrêté de répondre.
Boutique : ${merchant.businessName}
Historique :
${history}

Règles :
- Pas de pression.
- Montre ton aide (ex: "Je suis là si vous avez une question sur la taille").
- Utilise un emoji gentil ✨.
- Max 25 mots.

Réponds UNIQUEMENT avec le texte du message.`;

      const response = await aiProvider.generateText({
        systemPrompt: "Tu es un assistant de vente attentionné.",
        userMessage: prompt,
        temperature: 0.7
      });

      // 3. Send via WhatsApp
      await messagingService.sendMessage(merchant, 'whatsapp', customer.phone, response.text);

      // 4. Mark as sent to avoid duplicates
      conversation.followUpSent = true;
      await conversation.save();

      // 5. Save to message history
      await CommerceMessageModel.create({
        conversationId,
        sender: 'ai',
        content: response.text
      });

    } catch (err) {
      logger.error(`[MarketingQueue] Error in recovery job ${job.id}:`, err);
      throw err;
    }
  },
  {
    connection: { url: REDIS_URL },
    concurrency: 2,
  }
);

/**
 * Schedules a recovery job for a conversation.
 * Replaces any existing job for the same conversation to avoid multiple relances.
 */
export async function scheduleRecovery(conversationId: string, merchantId: string, customerId: string) {
  const jobId = `recovery-${conversationId}`;

  // Remove existing pending job if any (debounce)
  await marketingQueue.remove(jobId);

  // Add new job with 2 hours delay (7200000 ms)
  // For testing, we might use a shorter delay
  const delay = process.env.NODE_ENV === 'development' ? 60000 : 7200000; // 1 min in dev, 2h in prod

  await marketingQueue.add('abandoned-cart-recovery',
    { conversationId, merchantId, customerId },
    { delay, jobId, removeOnComplete: true }
  );

  logger.info(`[MarketingQueue] Scheduled recovery for ${conversationId} in ${delay/60000} minutes.`);
}

marketingQueue.on('error', (err) => {
  logger.error('[Marketing Queue Error]', { message: err.message });
});

marketingWorker.on('error', (err) => {
  logger.error('[Marketing Worker Error]', { message: err.message });
});

