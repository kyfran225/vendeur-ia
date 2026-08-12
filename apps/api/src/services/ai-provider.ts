import axios from "axios";
import { env } from "../config/env.js";
import { GEMINI_DEFAULT_TEXT_MODEL, resolveGeminiModel } from "../config/gemini.js";
import { Redis } from "ioredis";
import { getRedisClient } from "../config/redis.js";
import crypto from "crypto";
import { SystemSettingsModel } from "../modules/commerce/admin.model.js";
import { pushService } from "./push.service.js";
import { UserModel } from "../modules/auth/user.model.js";

export interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  history?: { role: "customer" | "ai"; text: string }[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}

export interface AIResponse {
  text: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIProvider {
  private static readonly GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  private redis: Redis | null;
  private degradedProviders: Map<string, number> = new Map();
  private static readonly CIRCUIT_BREAKER_DURATION = 300 * 1000; // 300 seconds (5 minutes)

  constructor() {
    this.redis = getRedisClient();
  }

  private isDegraded(provider: string): boolean {
    const expiry = this.degradedProviders.get(provider);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.degradedProviders.delete(provider);
      return false;
    }
    return true;
  }

  private markDegraded(provider: string) {
    console.warn(`[AI Provider] Marking ${provider} as degraded for 300s`);
    this.degradedProviders.set(provider, Date.now() + AIProvider.CIRCUIT_BREAKER_DURATION);
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
      case 'gemini': return GEMINI_DEFAULT_TEXT_MODEL;
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

  private async logProviderError(provider: string, message: string) {
    try {
      const settings = await SystemSettingsModel.findOneAndUpdate(
        {},
        {
          $push: {
            "aiConfig.lastErrors": {
              $each: [{ provider, message, timestamp: new Date() }],
              $slice: -10, // Keep only last 10 errors
              $sort: { timestamp: -1 }
            }
          }
        },
        { upsert: true, new: true }
      );

      // Trigger Notifications to Admins
      if (settings?.aiConfig?.notificationSettings?.enablePush) {
        this.notifyAdminsOfError(provider, message);
      }
    } catch (err) {
      console.error("[AI Provider] Failed to log error:", err);
    }
  }

  private async notifyAdminsOfError(provider: string, message: string) {
    try {
      const admins = await UserModel.find({ roles: "admin" });
      for (const admin of admins) {
        await pushService.sendNotification(admin._id.toString(), {
          title: `⚠️ Erreur Critique IA : ${provider.toUpperCase()}`,
          body: message.length > 100 ? message.substring(0, 97) + '...' : message,
          icon: "/apple-touch-icon.png",
          data: { url: "/admin" }
        });
      }
    } catch (err) {
      console.warn("[AI Provider] Failed to send admin push notification:", err);
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    const config = await this.getDynamicConfig();
    let primaryProvider = config?.defaultTextProvider || 'gemini';

    // 1. Try Semantic Cache
    const cacheKey = this.generateCacheKey(request);
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          console.log("[AI Provider] Cache Hit ✨");
          return parsed;
        } catch (e) {
          // If cache was just string (old version), continue
        }
      }
    }

    // Check if primary is degraded, if so, switch to fallback immediately
    if (this.isDegraded(primaryProvider)) {
      console.log(`[AI Provider] ${primaryProvider} is degraded, skipping to fallback...`);
      primaryProvider = primaryProvider === 'gemini' ? 'groq' : 'gemini';
    }

    let response: AIResponse;

    // Try Current Provider
    try {
      response = await this.generateWithProvider(primaryProvider, request, config);
    } catch (error: any) {
      const errorMsg = error.message || "";
      const errorData = error.response?.data?.error?.message || error.response?.data?.message || "";
      const fullError = `${errorMsg} ${errorData}`.toLowerCase();

      const isQuotaError = fullError.includes("quota") ||
                          fullError.includes("429") ||
                          fullError.includes("limit") ||
                          fullError.includes("credits") ||
                          fullError.includes("billing");

      if (isQuotaError) {
        this.markDegraded(primaryProvider);
      }

      console.warn(`[AI Provider] ${primaryProvider} failed (Quota=${isQuotaError}), trying fallback...`);

      const fallbackProvider = primaryProvider === 'gemini' ? 'groq' : 'gemini';

      if (this.isDegraded(fallbackProvider)) {
        console.warn(`[AI Provider] Fallback ${fallbackProvider} also degraded, trying OpenRouter...`);
        try {
          response = await this.generateWithProvider('openrouter', request, config);
        } catch (openRouterError: any) {
          console.error("[AI Provider] All fallbacks failed:", openRouterError.message);
          return {
            text: "Désolé, nos services d'IA sont saturés. Veuillez réessayer plus tard.",
            provider: 'error',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
          };
        }
      } else {
        try {
          response = await this.generateWithProvider(fallbackProvider, request, config);
        } catch (fallbackError: any) {
          const fallbackMsg = (fallbackError.message || "") + (fallbackError.response?.data?.error?.message || "");
          if (fallbackMsg.toLowerCase().includes("quota") || fallbackMsg.includes("429")) {
            this.markDegraded(fallbackProvider);
          }
          console.warn("[AI Provider] Secondary fallback failed, trying OpenRouter...");
          try {
            response = await this.generateWithProvider('openrouter', request, config);
          } catch (openRouterError: any) {
            console.error("[AI Provider] All fallbacks failed:", openRouterError.message);
            return {
              text: "Désolé, nos services d'IA sont saturés. Veuillez réessayer plus tard.",
              provider: 'error',
              usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
            };
          }
        }
      }
    }

    // 2. Save to Cache
    if (this.redis) {
      await this.redis.set(cacheKey, JSON.stringify(response), 'EX', 3600);
    }

    return response;
  }

  private async generateWithProvider(providerName: string, request: AIRequest, config: any): Promise<AIResponse> {
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

  private getGeminiModelId(model: string): string {
    return resolveGeminiModel(model);
  }

  private extractGeminiText(data: any): string {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts?.length) throw new Error("Réponse vide de Gemini");

    const answerParts = parts
      .filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
      .map((p: { text: string }) => p.text);

    if (answerParts.length) return answerParts.join("").trim();

    const fallbackParts = parts
      .filter((p: { text?: string }) => p.text)
      .map((p: { text: string }) => p.text);

    if (fallbackParts.length) return fallbackParts.join("").trim();

    throw new Error("Réponse vide de Gemini");
  }

  private async generateWithGemini(request: AIRequest, apiKey: string, model: string): Promise<AIResponse> {
    const modelId = this.getGeminiModelId(model);
    const isNewModel = modelId.includes("1.5") || modelId.includes("2.0") || modelId.includes("exp");

    const contents = [];
    if (!isNewModel) {
      contents.push({ role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${request.systemPrompt}` }] });
      contents.push({ role: "model", parts: [{ text: "Compris. Je suis prêt à agir selon ces instructions." }] });
    }

    if (request.history) {
      for (const msg of request.history) {
        contents.push({
          role: msg.role === "customer" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: request.userMessage }] });

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: request.maxTokens || 2500,
      temperature: request.temperature ?? 0.7,
    };

    if (request.jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    if (request.thinkingLevel) {
      generationConfig.thinkingConfig = { thinkingLevel: request.thinkingLevel };
    }

    const payload: any = {
      contents,
      generationConfig,
    };

    if (isNewModel) {
      payload.systemInstruction = { parts: [{ text: request.systemPrompt }] };
    }

    try {
      const response = await axios.post(`${AIProvider.GEMINI_URL}/${modelId}:generateContent?key=${apiKey}`, payload);
      const text = this.extractGeminiText(response.data);
      const usageMetadata = response.data.usageMetadata || {};

      return {
        text,
        provider: 'gemini',
        usage: {
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || (usageMetadata.promptTokenCount + usageMetadata.candidatesTokenCount) || Math.ceil(text.length / 4)
        }
      };
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      console.error("Gemini API Error:", msg);
      this.logProviderError('gemini', msg);
      throw new Error("Gemini failed");
    }
  }

  private async generateWithGroq(request: AIRequest, apiKey: string, model: string): Promise<AIResponse> {
    const messages = [{ role: "system", content: request.systemPrompt }];
    if (request.history) {
      for (const msg of request.history) {
        messages.push({ role: msg.role === "customer" ? "user" : "assistant", content: msg.text });
      }
    }
    messages.push({ role: "user", content: request.userMessage });

    try {
      const payload: any = {
        model,
        messages,
        max_tokens: request.maxTokens || 2500,
        temperature: request.temperature || 0.7,
      };

      if (request.jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", payload, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });

      const usage = response.data.usage || {};
      return {
        text: response.data.choices[0].message.content.trim(),
        provider: 'groq',
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        }
      };
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      console.error("Groq API Error:", msg);
      this.logProviderError('groq', msg);
      throw new Error("Groq failed");
    }
  }

  private async generateWithOpenAI(request: AIRequest, apiKey: string, model: string): Promise<AIResponse> {
    const messages = [{ role: "system", content: request.systemPrompt }];
    if (request.history) {
      for (const msg of request.history) {
        messages.push({ role: msg.role === "customer" ? "user" : "assistant", content: msg.text });
      }
    }
    messages.push({ role: "user", content: request.userMessage });

    try {
      const payload: any = {
        model,
        messages,
        max_tokens: request.maxTokens || 2500,
        temperature: request.temperature || 0.7,
      };

      if (request.jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });

      const usage = response.data.usage || {};
      return {
        text: response.data.choices[0].message.content.trim(),
        provider: 'openai',
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        }
      };
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      console.error("OpenAI API Error:", msg);
      this.logProviderError('openai', msg);
      throw new Error("OpenAI failed");
    }
  }

  private async generateWithOpenRouter(request: AIRequest, apiKey: string, model: string): Promise<AIResponse> {
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
        max_tokens: request.maxTokens || 2500,
        temperature: request.temperature || 0.7,
      }, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://vendeuria.com",
          "X-Title": "Vendeur IA"
        }
      });

      const usage = response.data.usage || {};
      return {
        text: response.data.choices[0].message.content.trim(),
        provider: 'openrouter',
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        }
      };
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      console.error("OpenRouter API Error:", msg);
      this.logProviderError('openrouter', msg);
      throw new Error("OpenRouter failed");
    }
  }

  async testConnectivity(providerName: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getDynamicConfig();
    const apiKey = this.getProviderKey(config, providerName);
    if (!apiKey) return { success: false, message: "Clé API non configurée" };

    try {
      if (providerName === 'gemini') {
        // We use the models list endpoint which is model-agnostic to verify the API key
        await axios.get(`${AIProvider.GEMINI_URL}?key=${apiKey}`);
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
        await axios.get("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": apiKey }
        });
      }
      return { success: true, message: "Connexion réussie" };
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      this.logProviderError(providerName, msg);
      return { success: false, message: msg };
    }
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string, context?: string): Promise<string> {
    const config = await this.getDynamicConfig();
    const geminiKey = this.getProviderKey(config, 'gemini');

    if (geminiKey) {
      try {
        const model = this.getGeminiModelId(this.getModel(config, 'gemini', 'text'));
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
      } catch (error: any) {
        const msg = error.response?.data?.error?.message || error.message;
        console.warn("[AI Provider] ElevenLabs failed, trying OpenAI");
        this.logProviderError('elevenlabs', msg);
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

  async generateEmbeddings(text: string): Promise<number[]> {
    const config = await this.getDynamicConfig();
    const apiKey = this.getProviderKey(config, 'openai');

    if (!apiKey) throw new Error("OpenAI API Key missing for embeddings");

    try {
      const response = await axios.post("https://api.openai.com/v1/embeddings", {
        input: text,
        model: "text-embedding-3-small"
      }, {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
      });

      return response.data.data[0].embedding;
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message;
      console.error("[AI Provider] Embedding generation failed:", msg);
      throw new Error(`Embedding failed: ${msg}`);
    }
  }
}

export const aiProvider = new AIProvider();
