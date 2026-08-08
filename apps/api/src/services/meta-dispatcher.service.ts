import { facebookService } from "../modules/facebook/facebook.service.js";
import { instagramService } from "../modules/instagram/instagram.service.js";
import { whatsappService } from "../modules/whatsapp/whatsapp.service.js";

/**
 * The MetaDispatcherService acts as a central hub for all incoming webhooks from Meta (Facebook, Instagram, WhatsApp Cloud API).
 * It ensures messages are routed to the correct module based on the 'object' type in the webhook payload.
 */
class MetaDispatcherService {
  async dispatch(payload: any) {
    const { object, entry } = payload;

    if (!entry || !Array.isArray(entry)) return;

    for (const item of entry) {
      if (object === "page") {
        // Facebook Messenger routing
        await this.handleFacebookEntry(item);
      } else if (object === "instagram") {
        // Instagram Direct routing
        await this.handleInstagramEntry(item);
      } else if (object === "whatsapp_business_account") {
        // WhatsApp Cloud API routing
        await this.handleWhatsAppCloudEntry(item);
      }
    }
  }

  private async handleFacebookEntry(entry: any) {
    const pageId = entry.id;
    if (!entry.messaging) return;

    for (const messaging of entry.messaging) {
      if (messaging.message && !messaging.message.is_echo) {
        const senderId = messaging.sender.id;
        const text = messaging.message.text;
        const attachments = messaging.message.attachments;

        if (text || attachments) {
          await facebookService.handleIncomingMessage(pageId, senderId, text, attachments);
        }
      }
    }
  }

  private async handleInstagramEntry(entry: any) {
    const pageId = entry.id; // Page linked to Instagram account
    if (!entry.messaging) return;

    for (const messaging of entry.messaging) {
      if (messaging.message && !messaging.message.is_echo) {
        const senderId = messaging.sender.id;
        const text = messaging.message.text;
        const attachments = messaging.message.attachments;

        if (text || attachments) {
          await instagramService.handleIncomingMessage(pageId, senderId, text, attachments);
        }
      }
    }
  }

  private async handleWhatsAppCloudEntry(entry: any) {
    if (!entry.changes) return;

    for (const change of entry.changes) {
      if (change.field === "messages") {
        const value = change.value;
        const phoneId = value.metadata.phone_number_id;

        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from;
            const text = message.text?.body;
            let media = null;

            if (message.type === 'image') {
              media = { mediaId: message.image.id, mediaType: 'image' };
            } else if (message.type === 'audio') {
              media = { mediaId: message.audio.id, mediaType: 'audio' };
            }

            await (whatsappService as any).handleMetaIncomingMessage(from, text, phoneId, media);
          }
        }
      }
    }
  }
}

export const metaDispatcher = new MetaDispatcherService();
