import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { aiAgentService, SalesContext } from './ai-agent.service.js';
import {
  CommerceMessageModel,
  CommerceConversationModel,
  CommerceMerchantModel,
  MarketingCampaignModel
} from '../modules/commerce/commerce.model.js';
import { emitToUser } from '../realtime/socketServer.js';
import { whatsappService } from '../modules/whatsapp/whatsapp.service.js';
import { pushService } from './push.service.js';
import { aiProvider } from './ai-provider.js';
import fs from 'fs';
import path from 'path';

import { messagingService } from './messaging.service.js';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';
const API_URL = env.API_URL || 'http://localhost:3001';

export const aiQueue = new Queue('ai-processing', {
  connection: {
    url: REDIS_URL,
  },
});

export async function addAIJob(context: SalesContext & { userId: string; conversationId: string; remoteJid: string; platform?: string }) {
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
    const { userId, conversationId, remoteJid, platform = 'whatsapp', ...context } = job.data;

    try {
      if (job.name === 'broadcast-message') {
        const { content, merchantId, imageUrl, campaignId } = job.data;
        const merchant = await CommerceMerchantModel.findById(merchantId);
        let voiceMode = merchant?.aiSettings?.voiceMode && platform === 'whatsapp';

        console.log(`[AI Queue] Sending broadcast to ${remoteJid} on ${platform} (Voice: ${voiceMode}, Image: ${!!imageUrl}, Campaign: ${campaignId})`);

        let audioUrl = "";
        let audioBuffer: Buffer | null = null;
        let ttsError = false;

        if (voiceMode) {
          try {
            audioBuffer = await aiProvider.generateSpeech(content);
            const fileName = `broadcast-${Date.now()}.ogg`;
            const filePath = path.join(process.cwd(), 'uploads', 'audio', fileName);
            if (!fs.existsSync(path.join(process.cwd(), 'uploads', 'audio'))) {
              fs.mkdirSync(path.join(process.cwd(), 'uploads', 'audio'), { recursive: true });
            }
            fs.writeFileSync(filePath, audioBuffer);
            audioUrl = `${API_URL}/uploads/audio/${fileName}`;
          } catch (err) {
            console.warn("[AI Queue] Broadcast TTS failed, falling back to text:", err);
            voiceMode = false;
            ttsError = true;
          }
        }

        // Save AI message to history
        const aiMsg = await CommerceMessageModel.create({
          conversationId,
          sender: 'ai',
          type: voiceMode ? 'audio' : (imageUrl ? 'image' : 'text'),
          content: content,
          mediaUrl: voiceMode ? audioUrl : (imageUrl || "")
        });

        // Update conversation
        await CommerceConversationModel.findByIdAndUpdate(conversationId, {
          updatedAt: new Date(),
        });

        // Track Campaign Progress
        if (campaignId) {
          try {
            const campaign = await MarketingCampaignModel.findByIdAndUpdate(
              campaignId,
              { $inc: { sentCount: 1 } },
              { new: true }
            );

            if (campaign && campaign.sentCount >= campaign.targetCount) {
              await MarketingCampaignModel.findByIdAndUpdate(campaignId, { status: "completed" });
            }

            // Emit Progress to Merchant
            emitToUser(userId, 'marketing:progress', {
              campaignId,
              sentCount: campaign?.sentCount,
              targetCount: campaign?.targetCount,
              status: campaign?.status
            });
          } catch (err) {
            console.error("[AI Queue] Failed to update campaign progress:", err);
          }
        }

        // Emit to frontend
        emitToUser(userId, 'conversation:update', {
          conversationId,
          message: aiMsg,
        });

        // SEND MESSAGE
        await messagingService.sendMessage(merchant, platform, remoteJid, content, {
          audioBuffer: audioBuffer || undefined,
          mediaUrl: imageUrl || undefined,
          type: imageUrl ? 'image' : 'text'
        });

        return { status: 'broadcast_sent', ttsFallback: ttsError };
      }

      console.log(`[AI Queue] Processing job ${job.id} for user ${userId} on ${platform}`);

      // CHECK HUMAN TAKEOVER STATUS AGAIN (In case it changed while in queue)
      const currentConv = await CommerceConversationModel.findById(conversationId);
      if (currentConv?.status === 'needs_human') {
        console.log(`[AI Queue] Human takeover active for ${conversationId}. Skipping AI response.`);
        return { status: 'skipped_human_takeover' };
      }

      // Emit typing start
      emitToUser(userId, 'ai:typing', { conversationId, isTyping: true });

      // Native Typing Indicator (Only WhatsApp for now in this impl)
      if (platform === 'whatsapp') {
        await whatsappService.sendPresence(userId, remoteJid, 'composing');
      }

      // Generate AI response
      const aiResponse = await aiAgentService.generateResponse({ ...context, platform } as any);
      const reply = aiResponse.text;

      const merchant = await CommerceMerchantModel.findById(context.merchant._id);
      let voiceMode = merchant?.aiSettings?.voiceMode && platform === 'whatsapp';

      let audioUrl = "";
      let audioBuffer: Buffer | null = null;

      if (voiceMode) {
        try {
          console.log(`[AI Queue] Voice mode active. Generating audio for user ${userId}`);
          audioBuffer = await aiProvider.generateSpeech(reply);

          // Save to local storage
          const fileName = `voice-${Date.now()}.ogg`;
          const filePath = path.join(process.cwd(), 'uploads', 'audio', fileName);

          if (!fs.existsSync(path.join(process.cwd(), 'uploads', 'audio'))) {
            fs.mkdirSync(path.join(process.cwd(), 'uploads', 'audio'), { recursive: true });
          }

          fs.writeFileSync(filePath, audioBuffer);
          audioUrl = `${API_URL}/uploads/audio/${fileName}`;
        } catch (err) {
          console.warn("[AI Queue] TTS Generation failed, falling back to text mode:", err);
          voiceMode = false;
        }
      }

      // Save AI message
      const aiMsg = await CommerceMessageModel.create({
        conversationId,
        sender: 'ai',
        type: voiceMode ? 'audio' : 'text',
        content: reply,
        mediaUrl: audioUrl,
        aiMetadata: {
          provider: aiResponse.provider,
          tokensUsed: aiResponse.usage.totalTokens,
          cost: aiResponse.usage.totalTokens * 0.000002 // Estimated cost
        }
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

      // Emit typing stop
      emitToUser(userId, 'ai:typing', { conversationId, isTyping: false });

      // Native Typing Indicator (Stop)
      if (platform === 'whatsapp') {
        await whatsappService.sendPresence(userId, remoteJid, 'paused');
      }

      // Notify Merchant via Push
      pushService.sendNotification(userId, {
        title: `Nouvelle réponse (${platform}) de ${context.merchant.businessName}`,
        body: reply.length > 100 ? reply.substring(0, 97) + '...' : reply,
        data: { conversationId }
      }).catch(err => console.error("[AI Queue] Push notification error:", err));

      // SEND MESSAGE via Unified Messaging Service
      await messagingService.sendMessage(merchant, platform, remoteJid, reply, {
        audioBuffer: audioBuffer || undefined
      });

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
