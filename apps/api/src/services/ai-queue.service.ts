import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { aiAgentService, SalesContext } from './ai-agent.service.js';
import {
  CommerceMessageModel,
  CommerceConversationModel,
  CommerceMerchantModel,
  CommerceCustomerModel,
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
        const { content, merchantId, customerId, remoteJid, personalization, campaignId, imageUrl, productDetails } = job.data;
        const merchant = await CommerceMerchantModel.findById(merchantId);
        if (!merchant) return;

        console.log(`[AI Queue] Processing visual broadcast for ${remoteJid} (Mode: ${personalization}, Media: ${!!imageUrl})`);

        let finalContent = content;

        // --- STEP 1: AI PERSONALIZATION (Visual Context Aware) ---
        if (personalization === 'ai_creative') {
           try {
              const customer = await CommerceCustomerModel.findById(customerId);

              // Fetch context
              const lastConvs = await CommerceConversationModel.find({ customerId }).sort({ updatedAt: -1 }).limit(1);
              let contextSnippet = "";
              if (lastConvs.length > 0) {
                 const msgs = await CommerceMessageModel.find({ conversationId: lastConvs[0]._id }).sort({ timestamp: -1 }).limit(5);
                 contextSnippet = msgs.reverse().map(m => `${m.sender === 'customer' ? 'Client' : 'IA'}: ${m.content}`).join('\n');
              }

              const prompt = `Tu es l'Expert Marketing de "${merchant.businessName}".
Ton but : Transformer cette annonce en un message WhatsApp irrésistible qui FAIT RÉFÉRENCE À L'IMAGE ENVOYÉE.

L'ANNONCE DU PATRON : "${content}"
LE PRODUIT DANS L'IMAGE : "${productDetails || 'Produit de la boutique'}"

INFOS CLIENT :
- Nom : ${customer?.name || 'cher client'}
- Ville : ${customer?.location || merchant.city}
- Points fidélité : ${customer?.loyaltyPoints || 0}
- Historique récent : ${contextSnippet || 'Nouveau client'}

DIRECTIVES CRITIQUES :
1. Tu DOIS mentionner l'image que le client vient de recevoir (ex: "Regarde cette pépite en photo", "Je t'ai joint l'image du nouveau modèle").
2. Sois extrêmement personnel et chaleureux.
3. Utilise des emojis ✨.
4. Max 60 mots.

Réponds UNIQUEMENT avec le texte final du message.`;

              const aiRes = await aiProvider.generateText({
                systemPrompt: "Tu es un génie du visual social commerce.",
                userMessage: prompt,
                temperature: 0.8
              });
              finalContent = aiRes.text;
           } catch (aiErr) {
              console.warn("[AI Queue] Personalization failed, using raw content:", aiErr);
           }
        } else {
           const customer = await CommerceCustomerModel.findById(customerId);
           finalContent = content.replace(/{{name}}/g, customer?.name || "cher client");
        }

        // --- STEP 2: LOGGING & TRACKING ---
        let conversation = await CommerceConversationModel.findOne({ merchantId, customerId });
        if (!conversation) {
           conversation = await CommerceConversationModel.create({ merchantId, customerId, platform: 'whatsapp' });
        }

        const aiMsg = await CommerceMessageModel.create({
          conversationId: conversation._id,
          sender: 'ai',
          type: imageUrl ? 'image' : 'text',
          content: finalContent,
          mediaUrl: imageUrl || ""
        });

        await CommerceConversationModel.findByIdAndUpdate(conversation._id, { updatedAt: new Date() });

        if (campaignId) {
          const campaign = await MarketingCampaignModel.findByIdAndUpdate(
            campaignId,
            { $inc: { sentCount: 1 } },
            { new: true }
          );

          if (campaign && campaign.sentCount >= campaign.targetCount) {
             await MarketingCampaignModel.findByIdAndUpdate(campaignId, { status: "completed" });
          }

          emitToUser(userId, 'marketing:progress', {
            campaignId,
            sentCount: campaign?.sentCount,
            targetCount: campaign?.targetCount,
            status: campaign?.status
          });
        }

        // Emit message to merchant dashboard
        emitToUser(userId, 'conversation:update', {
          conversationId: conversation._id,
          message: aiMsg,
        });

        // --- STEP 3: SENDING (Media + Text) ---
        await messagingService.sendMessage(merchant, 'whatsapp', remoteJid, finalContent, {
           mediaUrl: imageUrl || undefined,
           type: imageUrl ? 'image' : 'text'
        });

        return { status: 'visual_broadcast_sent', personalization };
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

      try {
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
            tokensUsed: aiResponse.usage?.totalTokens || 0,
            cost: (aiResponse.usage?.totalTokens || 0) * 0.000002 // Estimated cost
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

        // Notify Merchant via Push
        const replyText = reply || "";
        pushService.sendNotification(userId, {
          title: `Nouvelle réponse (${platform}) de ${context.merchant.businessName}`,
          body: replyText.length > 100 ? replyText.substring(0, 97) + '...' : replyText,
          data: { conversationId }
        }).catch(err => console.error("[AI Queue] Push notification error:", err));

        // SEND MESSAGE via Unified Messaging Service
        await messagingService.sendMessage(merchant, platform, remoteJid, reply, {
          audioBuffer: audioBuffer || undefined
        });

        return reply;
      } finally {
        // Emit typing stop in ALL cases (success, error, failure)
        emitToUser(userId, 'ai:typing', { conversationId, isTyping: false });
        if (platform === 'whatsapp') {
          await whatsappService.sendPresence(userId, remoteJid, 'paused').catch(() => {});
        }
      }
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
