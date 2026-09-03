import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env.js';
import { aiAgentService, SalesContext } from './ai-agent.service.js';
import {
  CommerceMessageModel,
  CommerceConversationModel,
  CommerceMerchantModel,
  CommerceCustomerModel,
  CommerceProductModel,
  CommerceOrderModel,
  MarketingCampaignModel
} from '../modules/commerce/commerce.model.js';
import mongoose from 'mongoose';
import { emitToUser } from '../realtime/socketServer.js';
import { whatsappService } from '../modules/whatsapp/whatsapp.service.js';
import { pushService } from './push.service.js';
import { aiProvider } from './ai-provider.js';
import fs from 'fs';
import path from 'path';

import { messagingService } from './messaging.service.js';
import { commerceService } from '../modules/commerce/commerce.service.js';
import { isFounderNumber } from '../modules/auth/auth.service.js';

const REDIS_URL = env.REDIS_URL || 'redis://localhost:6379';
const API_URL = env.API_URL || 'http://localhost:3001';

export const aiQueue = new Queue('ai-processing', {
  connection: {
    url: REDIS_URL,
  },
});

export async function processJobLogic(jobData: any, jobName: string = 'process-message', jobId: string = `direct-${Date.now()}`) {
  const { userId, conversationId, remoteJid, platform = 'whatsapp', ...context } = jobData;

  try {
    if (jobName === 'post-purchase-followup') {
      const { merchantId, customerId, orderId, items } = jobData;
      const merchant = await CommerceMerchantModel.findById(merchantId);
      const customer = await CommerceCustomerModel.findById(customerId);
      if (!merchant || !customer || !customer.phone) return { status: 'skipped_missing_info' };

      if (merchant.marketingAutomations?.postPurchaseFollowup === false) {
        console.log(`[AI Queue] Post-purchase follow-up disabled by merchant ${merchant._id}`);
        return { status: 'skipped_disabled_by_merchant' };
      }

      const itemNames = items?.map((i: any) => i.name).join(", ") || "votre commande";
      const prompt = `Tu es l'assistant de "${merchant.businessName}".
Rédige un message WhatsApp de suivi post-achat et fidélisation pour ${customer.name || "cher client"} qui a reçu son article (${itemNames}) il y a quelques jours.

Objectifs :
1. Demander chaleureusement si tout se passe bien avec son achat.
2. Rappeler ses points de fidélité accumulés (${customer.loyaltyPoints || 0} pts) pour sa prochaine commande.
3. L'inviter avec bienveillance à nous écrire s'il a la moindre question ou s'il souhaite découvrir les nouveautés ✨.
4. Ton très courtois, chaleureux et court (max 45 mots).

Réponds UNIQUEMENT avec le message.`;

      const aiRes = await aiProvider.generateText({
        systemPrompt: "Tu es un expert de la fidélisation client et du service après-vente sur WhatsApp.",
        userMessage: prompt,
        temperature: 0.7
      });

      let conversation = await CommerceConversationModel.findOne({ merchantId, customerId });
      if (!conversation) {
        conversation = await CommerceConversationModel.create({ merchantId, customerId, platform: 'whatsapp' });
      }

      const aiMsg = await CommerceMessageModel.create({
        conversationId: conversation._id,
        sender: 'ai',
        content: aiRes.text
      });

      await CommerceConversationModel.findByIdAndUpdate(conversation._id, { updatedAt: new Date() });

      if (merchant.ownerId) {
        emitToUser(merchant.ownerId.toString(), 'conversation:update', {
          conversationId: conversation._id,
          message: aiMsg,
        });
      }

      await messagingService.sendMessage(merchant, 'whatsapp', customer.phone, aiRes.text);
      console.log(`[AI Queue] Sent automated post-purchase followup (J+3) to ${customer.phone} for order ${orderId}`);
      return { status: 'post_purchase_followup_sent' };
    }

    if (jobName === 'broadcast-message') {
      const { content, merchantId, customerId, remoteJid, personalization, campaignId, imageUrl, productDetails } = jobData;
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

    console.log(`[AI Queue] Processing job ${jobId} for user ${userId} on ${platform}`);

    // CHECK HUMAN TAKEOVER STATUS AGAIN (In case it changed while in queue)
    const currentConv = await CommerceConversationModel.findById(conversationId);
    if (currentConv?.status === 'needs_human') {
      console.log(`[AI Queue] Human takeover active for ${conversationId}. Skipping AI response.`);
      return { status: 'skipped_human_takeover' };
    }

    // CHECK SUBSCRIPTION & PAUSE (MODE DÉCOUVERTE & MODE PAUSE)
    const merchantData = context.merchant;
    const isFounder = isFounderNumber(merchantData?.whatsappNumber || merchantData?.phone || "") || (userId && isFounderNumber(userId));
    const isSubscriptionActive = merchantData?.subscription?.status === "active" || isFounder;
    if (!isSubscriptionActive && !jobData.isSimulator) {
      console.log(`[AI Queue] Mode Découverte: AI locked for unpaid merchant ${merchantData?._id}. Skipping live AI response.`);
      return { status: 'skipped_unpaid_discovery_mode' };
    }

    if (merchantData?.aiSettings?.autoReply === false && !jobData.isSimulator) {
      console.log(`[AI Queue] Mode Pause: AI autoReply is disabled for merchant ${merchantData?._id}. Skipping live AI response.`);
      return { status: 'skipped_mode_pause' };
    }

    try {
      // Native Typing Indicator to recipient on WhatsApp & merchant inbox
      if (platform === 'whatsapp') {
        await whatsappService.sendPresence(userId, remoteJid, 'composing');
      }
      emitToUser(userId, 'conversation:typing', {
        conversationId,
        isTyping: true,
        participant: 'ai'
      });

      // Generate AI response
      const aiResponse = await aiAgentService.generateResponse({ ...context, platform } as any);
      let reply = aiResponse.text;

      // Check for automated Order Creation Intent tag: [[ACTION_CREATE_ORDER:{...}]]
      const orderActionMatch = reply.match(/\[\[ACTION_CREATE_ORDER:([\s\S]*?)\]\]/);
      if (orderActionMatch) {
        try {
          const orderJsonStr = orderActionMatch[1];
          const orderPayload = JSON.parse(orderJsonStr);
          // Remove the tag from the final visible message to the customer
          reply = reply.replace(/\[\[ACTION_CREATE_ORDER:[\s\S]*?\]\]/, '').trim();

          const merchantId = context.merchant._id?.toString();
          const conv = await CommerceConversationModel.findById(conversationId);
          const customerId = conv?.customerId?.toString();

          if (merchantId && customerId && orderPayload.items && Array.isArray(orderPayload.items)) {
            // Calculate total and match items
            let totalAmount = 0;
            const validItems: any[] = [];

            for (const itm of orderPayload.items) {
              const matchedProduct = await CommerceProductModel.findOne({
                merchantId,
                $or: [
                  { name: { $regex: new RegExp(itm.name || '', 'i') } },
                  { _id: mongoose.isValidObjectId(itm.productId) ? itm.productId : new mongoose.Types.ObjectId() }
                ]
              });

              const itemPrice = matchedProduct?.price || itm.price || 0;
              const itemQty = Math.max(1, parseInt(itm.quantity, 10) || 1);
              totalAmount += itemPrice * itemQty;

              validItems.push({
                productId: matchedProduct?._id || undefined,
                name: matchedProduct?.name || itm.name || "Produit",
                price: itemPrice,
                quantity: itemQty
              });
            }

            const newOrder = await CommerceOrderModel.create({
              merchantId,
              customerId,
              conversationId,
              items: validItems,
              totalAmount,
              currency: context.merchant.currency || 'XOF',
              status: 'pending',
              shippingAddress: orderPayload.shippingAddress || '',
              recoveredByAi: true
            });

            console.log(`[AI Auto-Order] Successfully generated Order #${newOrder._id} for customer ${customerId} (Total: ${totalAmount})`);
            
            // Notify merchant of auto-created order
            if (userId) {
              emitToUser(userId, 'order:created', {
                order: newOrder,
                conversationId
              });
            }
          }
        } catch (orderErr) {
          console.error("[AI Auto-Order] Failed to parse or create auto order:", orderErr);
        }
      }

      // Voice Note / Audio Mode
      let audioUrl: string | undefined = undefined;
      let audioBuffer: Buffer | null = null;
      const merchantObj = await CommerceMerchantModel.findById(context.merchant._id);
      const aiSettings = merchantObj?.aiSettings || context.merchant?.aiSettings;
      let voiceMode = aiSettings?.voiceMode && (platform === 'whatsapp' || !platform) && reply.length < 300;

      if (voiceMode) {
        try {
          console.log(`[AI Queue] Voice mode active. Generating audio for user ${userId}`);
          const generatedAudio = await aiProvider.generateSpeech(reply);
          audioBuffer = generatedAudio;

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
        status: 'sent',
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
      const sendRes: any = await messagingService.sendMessage(context.merchant, platform, remoteJid, reply, {
        audioBuffer: audioBuffer || undefined
      });

      if (sendRes?.key?.id) {
        aiMsg.whatsappMessageId = sendRes.key.id;
        await aiMsg.save();
      }

      return reply;
    } finally {
      emitToUser(userId, 'conversation:typing', {
        conversationId,
        isTyping: false,
        participant: 'ai'
      });
      if (platform === 'whatsapp') {
        await whatsappService.sendPresence(userId, remoteJid, 'paused').catch(() => {});
      }
    }
  } catch (error) {
    console.error(`[AI Queue] Error processing job ${jobId}:`, error);
    throw error;
  }
}

export async function addAIJob(context: SalesContext & { userId: string; conversationId: string; remoteJid: string; platform?: string }) {
  try {
    await aiQueue.add('process-message', context, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  } catch (queueError: any) {
    console.warn(`[AI Queue] Redis Queue unavailable (${queueError.message}). Fallback to direct async execution.`);
    // Fallback: execute directly in background without failing
    setImmediate(() => {
      processJobLogic(context, 'process-message').catch(err => {
        console.error('[AI Direct Execution Error]', err);
      });
    });
  }
}

// Worker implementation (optimized for serverless Redis like Upstash)
export const aiWorker = new Worker(
  'ai-processing',
  async (job: Job) => {
    return processJobLogic(job.data, job.name, String(job.id));
  },
  {
    connection: {
      url: REDIS_URL,
    },
    concurrency: 5,
    drainDelay: 10000, // 10s wait before checking empty queue to save Redis commands
    stalledInterval: 120000, // 2 minutes check for stalled jobs
    maxStalledCount: 1,
  }
);

// Throttled error logger to avoid log flooding when Redis limit is reached
let lastQueueErrorLog = 0;
let lastWorkerErrorLog = 0;
const ERROR_LOG_THROTTLE_MS = 30000; // Log at most once every 30 seconds

aiQueue.on('error', (err) => {
  const now = Date.now();
  if (now - lastQueueErrorLog > ERROR_LOG_THROTTLE_MS) {
    lastQueueErrorLog = now;
    console.error('[AI Queue Error]', err.message);
  }
});

aiWorker.on('completed', (job) => {
  console.log(`[AI Queue] Job ${job.id} completed successfully`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`[AI Queue] Job ${job?.id} failed:`, err);
});

aiWorker.on('error', (err) => {
  const now = Date.now();
  if (now - lastWorkerErrorLog > ERROR_LOG_THROTTLE_MS) {
    lastWorkerErrorLog = now;
    console.error('[AI Worker Error]', err.message);
  }
});
