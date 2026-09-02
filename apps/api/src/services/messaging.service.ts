import { whatsappService } from '../modules/whatsapp/whatsapp.service.js';
import { CommerceMerchantModel } from '../modules/commerce/commerce.model.js';
import { emitToSession } from '../realtime/socketServer.js';
import { formatToWhatsAppRecipient } from '@vendeur-ia/core';
import axios from 'axios';

export class MessagingService {
  async sendMessage(merchant: any, platform: string, remoteId: string, content: string, options: { type?: string; mediaUrl?: string; audioBuffer?: Buffer } = {}) {
    console.log(`[MessagingService] Sending to ${platform}:${remoteId}`);

    switch (platform) {
      case 'whatsapp':
        return this.sendWhatsApp(merchant, remoteId, content, options);
      case 'instagram':
        return this.sendInstagram(merchant, remoteId, content);
      case 'facebook':
        return this.sendFacebook(merchant, remoteId, content);
      case 'tiktok':
        return this.sendTikTok(merchant, remoteId, content);
      case 'web':
        return this.sendWeb(remoteId, content);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private async sendWeb(sessionId: string, content: string) {
    emitToSession(sessionId, "message:new", {
      id: Date.now().toString(),
      role: "ai", // Merchant messages are treated as AI/Agent replies in the widget
      text: content,
      timestamp: new Date()
    });
    return { success: true };
  }

  private async sendWhatsApp(merchant: any, remoteId: string, content: string, options: any) {
    const config = merchant.whatsappConfig;
    const userId = merchant.ownerId?.toString() || merchant.ownerId;
    const { jid, cleanPhone } = formatToWhatsAppRecipient(remoteId);

    if (options.audioBuffer) {
      if (config?.provider === 'meta') {
        return (whatsappService as any).sendMetaAudio(merchant, cleanPhone, options.audioBuffer);
      } else {
        const sock = (whatsappService as any).activeSessions?.get(userId);
        if (sock) {
          return sock.sendMessage(jid, { audio: options.audioBuffer, mimetype: 'audio/mp4', ptt: true });
        }
      }
    } else if (options.mediaUrl && options.type === 'image') {
      if (config?.provider === 'meta') {
        // To implement for Meta: Upload by URL then send
        return whatsappService.sendMetaMessage(merchant, cleanPhone, content); // Fallback for now
      } else {
        const sock = (whatsappService as any).activeSessions?.get(userId);
        if (sock) {
          return sock.sendMessage(jid, { image: { url: options.mediaUrl }, caption: content });
        }
      }
    } else {
      return whatsappService.sendMessage(userId, jid, content);
    }
  }

  private async sendInstagram(merchant: any, remoteId: string, content: string) {
    const config = merchant.instagramConfig;
    if (!config?.accessToken || !config?.pageId) {
      throw new Error("Instagram not configured for this merchant");
    }

    try {
      const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${config.accessToken}`;
      await axios.post(url, {
        recipient: { id: remoteId },
        message: { text: content },
        messaging_type: "RESPONSE"
      });
    } catch (error: any) {
      console.error("[MessagingService] Instagram send error:", error.response?.data || error.message);
      throw error;
    }
  }

  private async sendFacebook(merchant: any, remoteId: string, content: string) {
    const config = merchant.facebookConfig;
    if (!config?.accessToken || !config?.pageId) {
      throw new Error("Facebook not configured for this merchant");
    }

    try {
      // Facebook uses the same Messenger API as Instagram
      const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${config.accessToken}`;
      await axios.post(url, {
        recipient: { id: remoteId },
        message: { text: content },
        messaging_type: "RESPONSE"
      });
    } catch (error: any) {
      console.error("[MessagingService] Facebook send error:", error.response?.data || error.message);
      throw error;
    }
  }

  private async sendTikTok(merchant: any, remoteId: string, content: string) {
    const config = merchant.tiktokConfig;
    if (!config?.accessToken) {
      throw new Error("TikTok not configured for this merchant");
    }

    // Note: TikTok Messaging API requires specific message format and recipient open_id
    try {
      const url = `https://open.tiktokapis.com/v2/business/message/send/`;
      await axios.post(url, {
        recipient_id: remoteId,
        message: { text: content }
      }, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error: any) {
      console.error("[MessagingService] TikTok send error:", error.response?.data || error.message);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
