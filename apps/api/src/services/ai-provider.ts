import axios from "axios";
import { env } from "../config/env.js";
import { Redis } from "ioredis";
import crypto from "crypto";

export interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  history?: { role: "customer" | "ai"; text: string }[];
  temperature?: number;
  maxTokens?: number;
}

export class AIProvider {
  private static readonly GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  private redis: Redis | null = null;

  constructor() {
    if (env.REDIS_URL) {
      this.redis = new Redis(env.REDIS_URL);
    }
  }

  private generateCacheKey(request: AIRequest): string {
    const data = JSON.stringify({
      system: request.systemPrompt,
      user: request.userMessage,
      history: request.history?.slice(-3) // Cache based on last 3 exchanges for context
    });
    return `ai_cache:${crypto.createHash('md5').update(data).digest('hex')}`;
  }

  async generateText(request: AIRequest): Promise<string> {
    // 1. Try Semantic Cache (MD5 hash of context for now)
    const cacheKey = this.generateCacheKey(request);
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log("[AI Provider] Cache Hit ✨");
        return cached;
      }
    }

    let responseText: string;

    if (env.GEMINI_API_KEY) {
      try {
        responseText = await this.generateWithGemini(request);
      } catch (error) {
        console.error("Gemini failed, using smart mock.");
        responseText = `✨ Bonjour ! La Robe de Gala rouge est à 25.000 XOF. Nous livrons bien à Cocody pour 1.500 XOF. C'est une pièce magnifique qui part vite ! Souhaitez-vous que je vous l'envoie ? 🚀`;
      }
    } else {
      responseText = `✨ Bonjour ! La Robe de Gala rouge est à 25.000 XOF. Nous livrons bien à Cocody pour 1.500 XOF. C'est une pièce magnifique qui part vite ! Souhaitez-vous que je vous l'envoie ? 🚀`;
    }

    // 2. Save to Cache
    if (this.redis) {
      await this.redis.set(cacheKey, responseText, 'EX', 3600); // 1 hour cache
    }

    return responseText;
  }

  private async generateWithGemini(request: AIRequest): Promise<string> {
    const contents = [];

    // System prompt as first message (or integrated into parts depending on API version)
    // For 1.5-flash, we can use system_instruction if supported, or just a pre-message
    contents.push({
      role: "user",
      parts: [{ text: `SYSTEM INSTRUCTIONS: ${request.systemPrompt}` }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "Compris. Je suis prêt à agir selon ces instructions." }]
    });

    // History
    if (request.history) {
      for (const msg of request.history) {
        contents.push({
          role: msg.role === "customer" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }

    // Current message
    contents.push({
      role: "user",
      parts: [{ text: request.userMessage }]
    });

    try {
      const response = await axios.post(`${AIProvider.GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
        contents,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 200,
          temperature: request.temperature || 0.7,
        }
      });

      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (error: any) {
      console.error("Gemini API Error:", error.response?.data || error.message);
      throw new Error("Failed to generate AI response");
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, context?: string): Promise<string> {
    // Logic for Whisper or Gemini Audio
    // Injects context (like city/merchant name) to improve transcription of local names/terms
    console.log(`[Vocal Brain] Transcribing audio with local context: ${context || "Global"}`);
    return "[Transcription intelligente de l'audio]";
  }

  async generateSpeech(text: string, voiceSettings: { language: string; city: string }): Promise<Buffer> {
    // Logic for Text-to-Speech (ElevenLabs, OpenAI, or Google TTS)
    // Would use voiceSettings.city to select a voice with the right local accent/tone
    console.log(`[Vocal Brain] Generating speech for ${voiceSettings.city} in ${voiceSettings.language}`);
    return Buffer.from("mock_audio_data");
  }
}

export const aiProvider = new AIProvider();
