import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { aiAgentService, SalesContext } from './ai-agent.service.js';
import { CommerceMessageModel, CommerceConversationModel } from '../modules/commerce/commerce.model.js';
import { emitToUser } from '../realtime/socketServer.js';
import { whatsappService } from '../modules/whatsapp/whatsapp.service.js';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';

export const aiQueue = new Queue('ai-processing', {
  connection: {
    url: REDIS_URL,
  },
});

export async function addAIJob(context: SalesContext & { userId: string; conversationId: string; remoteJid: string }) {
  await aiQueue.add('process-message', context, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

// Worker implementation
export const aiWorker = new Worker(
  'ai-processing',
  async (job: Job) => {
    const { userId, conversationId, remoteJid, ...context } = job.data;

    try {
      console.log(`[AI Queue] Processing job ${job.id} for user ${userId}`);

      // Generate AI response
      const reply = await aiAgentService.generateResponse(context);

      // Save AI message
      const aiMsg = await CommerceMessageModel.create({
        conversationId,
        sender: 'ai',
        content: reply,
      });

      // Update conversation last message timestamp
      await CommerceConversationModel.findByIdAndUpdate(conversationId, {
        updatedAt: new Date(),
      });

      // Emit to frontend via Socket.io
      emitToUser(userId, 'conversation:update', {
        conversationId,
        message: aiMsg,
      });

      // SEND MESSAGE (Try Meta Cloud API first, then Baileys if active)
      if (env.WHATSAPP_PHONE_ID && env.WHATSAPP_ACCESS_TOKEN) {
        await whatsappService.sendMetaMessage(context.merchant, remoteJid, reply);
      } else {
        const sock = (whatsappService as any).activeSessions?.get(userId);
        if (sock) {
          await sock.sendMessage(remoteJid, { text: reply });
        }
      }

      return reply;
    } catch (error) {
      console.error(`[AI Queue] Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: {
      url: REDIS_URL,
    },
    concurrency: 5,
  }
);

aiWorker.on('completed', (job) => {
  console.log(`[AI Queue] Job ${job.id} completed successfully`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`[AI Queue] Job ${job?.id} failed:`, err);
});
