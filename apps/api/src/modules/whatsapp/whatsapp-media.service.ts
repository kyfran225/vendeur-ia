import axios from "axios";
import { env } from "../../config/env.js";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export class WhatsAppMediaService {
  /**
   * Downloads media from Meta Cloud API
   * @param mediaId The ID of the media provided by Meta
   * @returns Buffer of the downloaded media
   */
  async downloadMetaMedia(mediaId: string, customToken?: string): Promise<Buffer> {
    if (!mediaId || mediaId === "null" || mediaId === "undefined") {
      throw new Error("Invalid mediaId provided for Meta media download");
    }

    const token = customToken || env.WHATSAPP_ACCESS_TOKEN;
    if (!token) {
      throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
    }

    try {
      // 1. Get the media URL from Meta
      const mediaResponse = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const mediaUrl = mediaResponse.data?.url;
      if (!mediaUrl) {
        throw new Error(`No media URL returned for mediaId ${mediaId}`);
      }

      // 2. Download the media content
      const contentResponse = await axios.get(mediaUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "arraybuffer",
      });

      return Buffer.from(contentResponse.data);
    } catch (error: any) {
      console.error("[Meta Media Download] Error:", error.response?.data || error.message);
      throw new Error("Failed to download media from Meta");
    }
  }

  /**
   * Downloads media from Baileys
   * @param msg The message object containing the media
   * @param type The type of media ('image' | 'audio' | 'video' | 'document' | 'sticker')
   * @returns Buffer of the downloaded media
   */
  async downloadBaileysMedia(msg: any, type: 'image' | 'audio' | 'video' | 'document' | 'sticker'): Promise<Buffer> {
    try {
      const rawMsg = msg.message?.ephemeralMessage?.message ||
                     msg.message?.viewOnceMessage?.message ||
                     msg.message?.viewOnceMessageV2?.message ||
                     msg.message?.documentWithCaptionMessage?.message ||
                     msg.message ||
                     msg;

      const messageContent = rawMsg?.[`${type}Message`] ||
                             (type === 'document' ? (rawMsg?.documentMessage || rawMsg?.documentWithCaptionMessage?.message?.documentMessage) : null) ||
                             (type === 'image' ? rawMsg?.imageMessage : null) ||
                             (type === 'audio' ? rawMsg?.audioMessage : null) ||
                             (type === 'video' ? rawMsg?.videoMessage : null) ||
                             (type === 'sticker' ? rawMsg?.stickerMessage : null);

      if (!messageContent) {
        throw new Error(`Message does not contain ${type} media`);
      }

      const streamType = type === 'sticker' ? 'image' : type;
      const stream = await downloadContentFromMessage(messageContent, streamType as any);
      let buffer = Buffer.from([]);

      const MAX_SIZE = 25 * 1024 * 1024; // 25MB Limit

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
        if (buffer.length > MAX_SIZE) {
          throw new Error("File too large. Max size is 25MB.");
        }
      }

      return buffer;
    } catch (error: any) {
      console.error("[Baileys Media Download] Error:", error.message);
      throw new Error("Failed to download media from Baileys");
    }
  }
}

export const whatsappMediaService = new WhatsAppMediaService();
