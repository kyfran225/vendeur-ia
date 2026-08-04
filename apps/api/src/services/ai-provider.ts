import axios from "axios";
import { env } from "../config/env.js";
import { Redis } from "ioredis";
import { getRedisClient } from "../config/redis.js";
import crypto from "crypto";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";

export interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  history?: { role: "customer" | "ai"; text: string }[];
  temperature?: number;
  maxTokens?: number;
}

export class AIProvider {
  private static readonly GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  private redis: Redis | null;

  constructor() {
    this.redis = getRedisClient();
  }

  private async getDynamicConfig() {
    try {
      const settings = await SystemSettingsModel.findOne();
      return settings?.aiConfig;
    } catch (error) {
      console.error("[AI Provider] Failed to fetch dynamic config:", error);
      return null;
    }
  }

  private getProviderKey(config: any, providerName: string): string | undefined {
    const provider = config?.providers?.find((p: any) => p.name === providerName && p.isActive);
    if (provider?.apiKey) return provider.apiKey;

    // Fallback to env
    switch (providerName) {
      case 'gemini': return env.GEMINI_API_KEY;
      case 'openai': return env.OPENAI_API_KEY;
      case 'groq': return env.GROQ_API_KEY;
      case 'openrouter': return env.OPENROUTER_API_KEY;
      case 'elevenlabs': return env.ELEVENLABS_API_KEY;
      default: return undefined;
    }
  }

  private getModel(config: any, providerName: string, type: 'text' | 'vision' | 'audio'): string {
    const provider = config?.providers?.find((p: any) => p.name === providerName);
    if (provider?.models?.[type]) return provider.models[type];

    // Defaults
    switch (providerName) {
      case 'gemini': return type === 'vision' ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
      case 'groq': return 'llama-3.3-70b-versatile';
      case 'openai': return type === 'audio' ? 'whisper-1' : 'gpt-4o-mini';
      case 'openrouter': return 'meta-llama/llama-3.3-70b-instruct';
      case 'elevenlabs': return 'eleven_multilingual_v2';
      default: return "";
    }
  }

  private generateCacheKey(request: AIRequest): string {
    // We include up to 6 messages for better context integrity in the cache
    const data = JSON.stringify({
      system: request.systemPrompt,
      user: request.userMessage,
      history: request.history?.slice(-6)
    });
    return `ai_cache:${crypto.createHash('md5').update(data).digest('hex')}`;
  }

  async generateText(request: AIRequest): Promise<string> {
    const config = await this.getDynamicConfig();
    const primaryProvider = config?.defaultTextProvider || 'gemini';

    // 1. Try Semantic Cache
    const cacheKey = this.generateCacheKey(request);
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log("[AI Provider] Cache Hit ✨");
        return cached;
      }
    }

    let responseText: string;

    // Try Primary
    try {
      responseText = await this.generateWithProvider(primaryProvider, request, config);
    } catch (error) {
      console.warn(`[AI Provider] ${primaryProvider} failed, trying fallback:`, (error as any).message);

      const fallbackProvider = primaryProvider === 'gemini' ? 'groq' : 'gemini';
      try {
        responseText = await this.generateWithProvider(fallbackProvider, request, config);
      } catch (fallbackError) {
        console.warn("[AI Provider] Secondary fallback failed, trying OpenRouter:", (fallbackError as any).message);
        try {
          responseText = await this.generateWithProvider('openrouter', request, config);
        } catch (openRouterError) {
          console.error("[AI Provider] All fallbacks failed:", (openRouterError as any).message);
          throw new Error("Tous les fournisseurs d'IA ont échoué.");
        }
      }
    }

    // 2. Save to Cache
    if (this.redis) {
      await this.redis.set(cacheKey, responseText, 'EX', 3600);
    }

    return responseText;
  }

  private async generateWithProvider(providerName: string, request: AIRequest, config: any): Promise<string> {
    const apiKey = this.getProviderKey(config, providerName);
    if (!apiKey) throw new Error(`API Key for ${providerName} not configured`);

    if (providerName === 'gemini') {
      return this.generateWithGemini(request, apiKey, this.getModel(config, 'gemini', 'text'));
    } else if (providerName === 'groq') {
      return this.generateWithGroq(request, apiKey, this.getModel(config, 'groq', 'text'));
    } else if (providerName === 'openai') {
      return this.generateWithOpenAI(request, apiKey, this.getModel(config, 'openai', 'text'));
    } else if (providerName === 'openrouter') {
      return this.generateWithOpenRouter(request, apiKey, this.getModel(config, 'openrouter', 'text'));
    }

    throw new Error(`Provider ${providerName} not supported for text generation`);
  }

  private async generateWithGemini(request: AIRequest, apiKey: string, model: string): Promise<string> {
    const contents = [];
    contents.push({ role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${request.systemPrompt}` }] });
    contents.push({ role: "model", parts: [{ text: "Compris. Je suis prêt à agir selon ces instructions." }] });

    if (request.history) {
      for (const msg of request.history) {
        contents.push({
          role: msg.role === "customer" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: request.userMessage }] });

    try {
      const response = await axios.post(`${AIProvider.GEMINI_URL}/${model}:generateContent?key=${apiKey}`, {
        contents,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 200,
          temperature: request.temperature || 0.7,
        }
      });
      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (error: any) {
      console.error("Gemini API Error:", error.response?.data || error.message);
      throw new Error("Gemini failed");
    }
  }

  private async generateWithGroq(request: AIRequest, apiKey: string, model: string): Promise<string> {
    const messages = [{ role: "system", content: request.systemPrompt }];
    if (request.history) {
      for (const msg of request.history) {
        messages.push({ role: msg.role === "customer" ? "user" : "assistant", content: msg.text });
      }
    }
    messages.push({ role: "user", content: request.userMessage });

    try {
      const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model,
        messages,
        max_tokens: request.maxTokens || 250,
        temperature: request.temperature || 0.7,
      }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });
      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error("Groq API Error:", error.response?.data || error.message);
      throw new Error("Groq failed");
    }
  }

  private async generateWithOpenAI(request: AIRequest, apiKey: string, model: string): Promise<string> {
    const messages = [{ role: "system", content: request.systemPrompt }];
    if (request.history) {
      for (const msg of request.history) {
        messages.push({ role: msg.role === "customer" ? "user" : "assistant", content: msg.text });
      }
    }
    messages.push({ role: "user", content: request.userMessage });

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model,
        messages,
        max_tokens: request.maxTokens || 250,
        temperature: request.temperature || 0.7,
      }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });
      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error("OpenAI API Error:", error.response?.data || error.message);
      throw new Error("OpenAI failed");
    }
  }

  private async generateWithOpenRouter(request: AIRequest, apiKey: string, model: string): Promise<string> {
    const messages = [{ role: "system", content: request.systemPrompt }];
    if (request.history) {
      for (const msg of request.history) {
        messages.push({ role: msg.role === "customer" ? "user" : "assistant", content: msg.text });
      }
    }
    messages.push({ role: "user", content: request.userMessage });

    try {
      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model,
        messages,
        max_tokens: request.maxTokens || 250,
        temperature: request.temperature || 0.7,
      }, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://vendeuria.com",
          "X-Title": "Vendeur IA"
        }
      });
      return response.data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error("OpenRouter API Error:", error.response?.data || error.message);
      throw new Error("OpenRouter failed");
    }
  }

  async testConnectivity(providerName: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getDynamicConfig();
    const apiKey = this.getProviderKey(config, providerName);
    if (!apiKey) return { success: false, message: "Clé API non configurée" };

    try {
      if (providerName === 'gemini') {
        await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      } else if (providerName === 'groq') {
        await axios.get("https://api.groq.com/openai/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
      } else if (providerName === 'openai') {
        await axios.get("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
      } else if (providerName === 'openrouter') {
        await axios.get("https://openrouter.ai/api/v1/models", {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
      } else if (providerName === 'elevenlabs') {
        await axios.get("https://api.elevenlabs.io/v1/voices", {
          headers: { "xi-api-key": apiKey }
        });
      }
      return { success: true, message: "Connexion réussie" };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.error?.message || error.message };
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, context?: string): Promise<string> {
    const config = await this.getDynamicConfig();
    const geminiKey = this.getProviderKey(config, 'gemini');

    if (geminiKey) {
      try {
        const model = this.getModel(config, 'gemini', 'text');
        const prompt = `Tu es une IA de transcription. Context: ${context || "Inconnu"}. Transcris fidèlement.`;
        const response = await axios.post(`${AIProvider.GEMINI_URL}/${model}:generateContent?key=${geminiKey}`, {
          contents: [{
            parts: [{ text: prompt }, { inlineData: { mimeType, data: audioBuffer.toString("base64") } }]
          }]
        });
        return response.data.candidates[0].content.parts[0].text.trim();
      } catch (error: any) {
        console.warn("[AI Provider] Gemini transcription failed, trying Whisper");
      }
    }

    const openAIKey = this.getProviderKey(config, 'openai');
    if (openAIKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });
        formData.append("file", blob, "audio.ogg");
        formData.append("model", "whisper-1");
        const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
          headers: { "Authorization": `Bearer ${openAIKey}` }
        });
        return response.data.text;
      } catch (error: any) {
        console.error("[AI Provider] Whisper failed");
      }
    }

    throw new Error("Échec de la transcription.");
  }

  async generateSpeech(text: string): Promise<Buffer> {
    const config = await this.getDynamicConfig();
    const provider = config?.defaultAudioProvider || 'elevenlabs';
    const apiKey = this.getProviderKey(config, provider);

    if (provider === 'elevenlabs' && apiKey) {
      try {
        const voiceId = env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
        const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          text, model_id: "eleven_multilingual_v2"
        }, {
          headers: { "xi-api-key": apiKey }, responseType: "arraybuffer"
        });
        return Buffer.from(response.data);
      } catch (error) {
        console.warn("[AI Provider] ElevenLabs failed, trying OpenAI");
      }
    }

    const openAIKey = this.getProviderKey(config, 'openai');
    if (openAIKey) {
      try {
        const response = await axios.post("https://api.openai.com/v1/audio/speech", {
          model: "tts-1", input: text, voice: "shimmer"
        }, {
          headers: { "Authorization": `Bearer ${openAIKey}` }, responseType: "arraybuffer"
        });
        return Buffer.from(response.data);
      } catch (error) {
        console.error("[AI Provider] OpenAI TTS failed");
      }
    }

    throw new Error("Échec TTS.");
  }
}

export const aiProvider = new AIProvider();
