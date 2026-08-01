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
  private static readonly GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
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
      history: request.history?.slice(-3)
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

    // 1. Try Gemini (Primary)
    if (env.GEMINI_API_KEY) {
      try {
        responseText = await this.generateWithGemini(request);
      } catch (error) {
        console.warn("[AI Provider] Gemini failed, falling back to Groq:", (error as any).message);

        // 2. Try Groq (Backup using Free Quota)
        if (env.GROQ_API_KEY) {
          try {
            responseText = await this.generateWithGroq(request);
          } catch (groqError) {
            console.error("[AI Provider] Groq failed too:", (groqError as any).message);
            responseText = this.getSmartMockResponse(request);
          }
        } else {
          responseText = this.getSmartMockResponse(request);
        }
      }
    } else if (env.GROQ_API_KEY) {
      // Direct to Groq if Gemini is not configured
      try {
        responseText = await this.generateWithGroq(request);
      } catch (error) {
        responseText = this.getSmartMockResponse(request);
      }
    } else {
      responseText = this.getSmartMockResponse(request);
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

  private async generateWithGroq(request: AIRequest): Promise<string> {
    const messages = [];

    messages.push({ role: "system", content: request.systemPrompt });

    if (request.history) {
      for (const msg of request.history) {
        messages.push({
          role: msg.role === "customer" ? "user" : "assistant",
          content: msg.text
        });
      }
    }

    messages.push({ role: "user", content: request.userMessage });

    try {
      const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: request.maxTokens || 250,
        temperature: request.temperature || 0.7,
      }, {
        headers: {
          "Authorization": `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      });

      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error("Groq API Error:", error.response?.data || error.message);
      throw new Error("Failed to generate Groq response");
    }
  }

  private getSmartMockResponse(request: AIRequest): string {
    return `✨ Bonjour ! Nous sommes ravis de vous servir. Nos articles sont de haute qualité et très demandés. Pourriez-vous nous dire ce qui vous intéresse particulièrement ? 🚀`;
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, context?: string): Promise<string> {
    // 1. Try Gemini (Local-aware transcription)
    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `Tu es une IA de transcription pour un commerce local.
Context du marchand : ${context || "Inconnu"}
Écoute attentivement cet audio et transcris-le fidèlement en texte.
Si l'utilisateur parle une langue locale ou utilise de l'argot (comme le Nouchi), transcris-le tel quel mais assure-toi que le sens est clair.
Réponds UNIQUEMENT avec le texte transcrit.`;

        const response = await axios.post(`${AIProvider.GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: audioBuffer.toString("base64")
                }
              }
            ]
          }]
        });

        const transcription = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (transcription) {
          console.log(`[Vocal Brain] Gemini transcription success: "${transcription}"`);
          return transcription;
        }
      } catch (error: any) {
        console.warn("[Vocal Brain] Gemini transcription failed, falling back to OpenAI Whisper:", error.message);
      }
    }

    // 2. Fallback to OpenAI Whisper
    if (env.OPENAI_API_KEY) {
      try {
        const formData = new FormData();
        formData.append("file", new Blob([audioBuffer]), "audio.ogg");
        formData.append("model", "whisper-1");
        formData.append("prompt", context || "");

        const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          }
        });

        const transcription = response.data.text;
        console.log(`[Vocal Brain] Whisper transcription success: "${transcription}"`);
        return transcription;
      } catch (error: any) {
        console.error("[Vocal Brain] Whisper fallback failed too:", error.message);
      }
    }

    throw new Error("Échec de la transcription audio par tous les fournisseurs.");
  }

  async generateSpeech(text: string): Promise<Buffer> {
    // 1. Try ElevenLabs (Premium Quality)
    if (env.ELEVENLABS_API_KEY) {
      try {
        console.log("[AI Provider] Attempting ElevenLabs TTS...");
        return await this.generateWithElevenLabs(text);
      } catch (error) {
        console.error("[AI Provider] ElevenLabs failed, falling back to OpenAI:", error);
      }
    }

    // 2. Try OpenAI (Reliable Backup)
    if (env.OPENAI_API_KEY) {
      try {
        console.log("[AI Provider] Attempting OpenAI TTS...");
        return await this.generateWithOpenAI(text);
      } catch (error) {
        console.error("[AI Provider] OpenAI failed too:", error);
      }
    }

    throw new Error("Toutes les méthodes de synthèse vocale ont échoué.");
  }

  private async generateWithElevenLabs(text: string): Promise<Buffer> {
    const voiceId = env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default Rachel
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            "xi-api-key": env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        }
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      throw error;
    }
  }

  private async generateWithOpenAI(text: string): Promise<Buffer> {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/audio/speech",
        {
          model: "tts-1",
          input: text,
          voice: "shimmer",
          response_format: "opus"
        },
        {
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        }
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      throw error;
    }
  }
}

export const aiProvider = new AIProvider();
