import axios from "axios";
import mongoose from "mongoose";
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

/**
 * Patterns that indicate the text contains system prompt rules, analytical meta-commentary,
 * or instructions intended for the model rather than customer-facing dialog.
 */
export const PROMPT_LEAK_PATTERNS: RegExp[] = [
  /règles?\s*d['’]action/i,
  /gardes-fous\s*(&|et)?\s*sécurité/i,
  /interdictions?\s*strictes?\s*de\s*vocabulaire/i,
  /stratégie\s*de\s*vente\s*(&|et)?\s*psychologie/i,
  /tunnel\s*d['’]encaissement/i,
  /détection\s*de\s*commande\s*ferme/i,
  /détection\s*de\s*paiement/i,
  /intentions?\s*multimodales?/i,
  /règles?\s*d['’]or/i,
  /confidentialité\s*absolue/i,
  /zéro\s*leak/i,
  /zéro\s*pavé/i,
  /zéro\s*formule\s*robotique/i,
  /analyze\s*user\s*input/i,
  /check\s*constraints/i,
  /identify\s*key\s*constraints/i,
  /draft\s*construction\s*\(mental\)/i,
  /here'?s\s*a\s*thinking\s*process/i,
  /system\s*instructions/i,
  /system\s*prompt/i,
  /consignes?\s*système/i,
  /instructions?\s*système/i,
  /directives?\s*système/i,
  /tu\s*es\s*l['’]expert\s*principal\s*de\s*vente/i,
  /voici\s*mes\s*règles\s*(système|de\s*vente|de\s*fonctionnement)?/i,
  /mes\s*règles\s*(sont|de\s*fonctionnement|commerciales\s*sont)/i,
  /en\s*tant\s*qu['’]ia,?\s*(voici|mes\s*consignes|je\s*dois\s*suivre)/i,
  /règles\s*que\s*je\s*dois\s*suivre/i
];

export function isPromptLeak(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return PROMPT_LEAK_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Strips internal thinking processes, chain-of-thought tags, analytical steps, and leaked system instructions
 * so that end customers never see internal reasoning or prompt rules.
 */
export function sanitizeAIText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") return "";

  let cleaned = rawText.trim();

  // 1. Remove XML/HTML style thought and reasoning blocks (both closed)
  cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thought[\s\S]*?<\/thought>/gi, "");
  cleaned = cleaned.replace(/<reasoning[\s\S]*?<\/reasoning>/gi, "");
  cleaned = cleaned.replace(/<internal[\s\S]*?<\/internal>/gi, "");
  cleaned = cleaned.replace(/<reflection[\s\S]*?<\/reflection>/gi, "");
  cleaned = cleaned.replace(/<cot[\s\S]*?<\/cot>/gi, "");
  cleaned = cleaned.replace(/\[THINKING\][\s\S]*?\[\/THINKING\]/gi, "");
  cleaned = cleaned.replace(/\[REASONING\][\s\S]*?\[\/REASONING\]/gi, "");
  cleaned = cleaned.replace(/\[THOUGHT\][\s\S]*?\[\/THOUGHT\]/gi, "");

  // 2. If an unclosed <think> or <thought> tag exists, extract the final response or strip it entirely
  if (/<(?:think|thought|reasoning|internal|reflection|cot)|\[(?:THINKING|REASONING|THOUGHT)\]/i.test(cleaned)) {
    const draftMatch = cleaned.match(/(?:Draft Construction(?:\s*\(Mental\))?|Final (?:Response|Answer|Draft)|Réponse(?:\s*finale)?|Message(?:\s*final)?|Output)\s*:\s*\*?\s*([\s\S]+)$/i);
    if (draftMatch && draftMatch[1]) {
      cleaned = draftMatch[1];
    } else {
      // Strip unclosed thought blocks completely
      cleaned = cleaned.replace(/<(?:think|thought|reasoning|internal|reflection|cot)[\s\S]*$/gi, "");
      cleaned = cleaned.replace(/\[(?:THINKING|REASONING|THOUGHT)\][\s\S]*$/gi, "");
    }
  }

  // 3. Extract final draft if present in structured reasoning (even without XML tags)
  const draftMatch = cleaned.match(/(?:(?:^|\n)(?:\d+\.\s*)?\*?(?:Draft Construction(?:\s*\(Mental\))?|Final (?:Response|Answer|Draft)|Réponse(?:\s*finale)?|Message(?:\s*final)?|Réponse au client|Draft)\*?\s*:\s*\*?\s*)([\s\S]+)$/i);
  if (draftMatch && draftMatch[1]) {
    const preText = cleaned.substring(0, draftMatch.index || 0);
    if (/think>|thought>|thinking process|analyze user input|check constraints|identify key constraints|reasoning/i.test(preText)) {
      cleaned = draftMatch[1];
    }
  }

  // 4. Strip prefix thinking process indicators, analysis blocks, and chain-of-thought blocks
  cleaned = cleaned.replace(/^(?:think>|thought>|thinking\s*:|reasoning\s*:|here'?s a thinking process\s*:|chain of thought\s*:|thought process\s*:|internal reasoning\s*:)[\s\S]*?(?=(?:\r?\n){2,}[A-ZÀ-ÖØ-ß0-9"«'#*]|$)/i, "");

  // 5. Strip structured analytical numbered steps (e.g. 1. *Analyze User Input:*, 2. *Check Constraints:*)
  if (/^(?:\s*\d+\.\s*\*?(?:Analyze User Input|Identify Key Constraints|Check Constraints|Plan|Règles à suivre|Analyse de la demande)\*?:?[\s\S]*?){1,3}/i.test(cleaned)) {
    const subDraft = cleaned.match(/(?:(?:\d+\.\s*)?\*?(?:Draft Construction(?:\s*\(Mental\))?|Final Response|Message final|Réponse finale|Réponse)\*?\s*:\s*\*?\s*)([\s\S]+)$/i);
    if (subDraft && subDraft[1]) {
      cleaned = subDraft[1];
    } else {
      cleaned = cleaned.replace(/^(?:\s*\d+\.\s*\*?(?:Analyze User Input|Identify Key Constraints|Check Constraints|Plan|Règles à suivre|Analyse de la demande)\*?:?[\s\S]*?(?=(?:\r?\n){2,}[A-ZÀ-ÖØ-ß0-9"«'#*]|$))/i, "");
    }
  }

  // 6. Strip stray prefixes & tags
  cleaned = cleaned.replace(/^(?:think>|thought>|<\/?think>|<\/?thought>)\s*/gi, "");
  cleaned = cleaned.replace(/<\/?think>|<\/?thought>/gi, "");

  // 7. Strip markdown thinking headers (e.g. ### Thinking Process)
  cleaned = cleaned.replace(/###\s*(?:Thinking Process|Thought Process|Reasoning|Analysis|Plan)[\s\S]*?(?=(?:\r?\n){2,}[A-ZÀ-ÖØ-ß0-9"«'#*]|$)/gi, "");

  // 8. Strip any accidental leakage of system instructions headers
  cleaned = cleaned.replace(/^(?:SYSTEM INSTRUCTIONS|SYSTEM PROMPT|Consignes système|Instructions système|Directives système)\s*:[\s\S]*?(?=(?:\r?\n){2,}|$)/gi, "");

  // 9. Strip leaked internal section headers if regurgitated at beginning of response
  cleaned = cleaned.replace(/^(?:RÈGLES D'ACTION ET ENGAGEMENT|GARDES-FOUS & SÉCURITÉ|RÈGLES D'OR|STRATÉGIE DE VENTE|FORMAT DE CONVERSATION|TON ET PERSONA|INTERDICTIONS STRICTES DE VOCABULAIRE)\s*:[\s\S]*?(?=(?:\r?\n){2,}[A-ZÀ-ÖØ-ß0-9"«'#*]|$)/gi, "");

  return cleaned.trim();
}

export function normalizeHistoryForGemini(
  history: { role: "customer" | "ai"; text: string }[] | undefined,
  userMessage: string
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  const rawTurns: Array<{ role: "user" | "model"; text: string }> = [];

  if (history && history.length > 0) {
    for (const msg of history) {
      if (!msg.text || !msg.text.trim()) continue;
      rawTurns.push({
        role: msg.role === "customer" ? "user" : "model",
        text: msg.text.trim()
      });
    }
  }

  // Gemini strictly requires turn sequence to start with user
  if (rawTurns.length > 0 && rawTurns[0].role === "model") {
    rawTurns.unshift({
      role: "user",
      text: "Bonjour"
    });
  }

  // Append user message
  if (userMessage && userMessage.trim()) {
    rawTurns.push({
      role: "user",
      text: userMessage.trim()
    });
  }

  // Merge consecutive turns with the same role
  for (const turn of rawTurns) {
    if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
      contents[contents.length - 1].parts[0].text += `\n${turn.text}`;
    } else {
      contents.push({
        role: turn.role,
        parts: [{ text: turn.text }]
      });
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: userMessage?.trim() || "Bonjour" }]
    });
  }

  return contents;
}

export function normalizeMessagesForOpenAI(
  systemPrompt: string,
  history: { role: "customer" | "ai"; text: string }[] | undefined,
  userMessage: string
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  if (history && history.length > 0) {
    for (const msg of history) {
      if (!msg.text || !msg.text.trim()) continue;
      messages.push({
        role: msg.role === "customer" ? "user" : "assistant",
        content: msg.text.trim()
      });
    }
  }

  if (userMessage && userMessage.trim()) {
    messages.push({
      role: "user",
      content: userMessage.trim()
    });
  }

  return messages;
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
      if (mongoose.connection?.readyState !== 1) return null;
      const settings = await SystemSettingsModel.findOne();
      return settings?.aiConfig;
    } catch (error) {
      console.error("[AI Provider] Failed to fetch dynamic config:", error);
      return null;
    }
  }

  private getProviderKey(config: any, providerName: string): string | undefined {
    if (providerName === 'gemini' && env.DISABLE_GEMINI) {
      return undefined;
    }

    const provider = config?.providers?.find((p: any) => p.name === providerName && p.isActive);
    let key: string | undefined = provider?.apiKey;

    if (!key) {
      switch (providerName) {
        case 'gemini': key = env.GEMINI_API_KEY; break;
        case 'openai': key = env.OPENAI_API_KEY; break;
        case 'groq': key = env.GROQ_API_KEY; break;
        case 'openrouter': key = env.OPENROUTER_API_KEY; break;
        case 'elevenlabs': key = env.ELEVENLABS_API_KEY; break;
      }
    }

    return key && typeof key === 'string' ? key.trim() : undefined;
  }

  private getModel(config: any, providerName: string, type: 'text' | 'vision' | 'audio'): string {
    const provider = config?.providers?.find((p: any) => p.name === providerName);
    if (provider?.models?.[type]) return provider.models[type];

    // Ultra-reliable Defaults
    switch (providerName) {
      case 'gemini': return GEMINI_DEFAULT_TEXT_MODEL;
      case 'groq': return 'openai/gpt-oss-120b';
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
      if (mongoose.connection?.readyState !== 1) return;
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
      // Ignore database logging errors in offline/test mode
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

    // Check if primary is degraded OR explicitly disabled
    if (this.isDegraded(primaryProvider) || (primaryProvider === 'gemini' && env.DISABLE_GEMINI)) {
      console.log(`[AI Provider] ${primaryProvider} is ${env.DISABLE_GEMINI && primaryProvider === 'gemini' ? 'DISABLED' : 'degraded'}, skipping to fallback...`);
      primaryProvider = primaryProvider === 'gemini' ? 'groq' : 'gemini';
    }

    // Check if primary provider has a key - if not, skip directly to fallbacks
    const primaryKey = this.getProviderKey(config, primaryProvider);

    // --- Developer Mock Mode (FORCED) ---
    // If AI_MOCK_MODE is true, we use mock immediately to avoid using credits or getting errors
    if (env.AI_MOCK_MODE) {
      const source = request.jsonMode ? "GROWTH/AUDIT (JSON)" : (request.systemPrompt.includes("relance") ? "MARKETING/FOLLOWUP" : "CHAT/DEMO");
      console.log(`[AI Mock] 🛠️  Simulating response for: ${source}`);
      return this.generateMockResponse(request);
    }

    if (!primaryKey) {
      console.warn(`[AI Provider] ${primaryProvider} has no API key configured, skipping to fallback...`);
    }

    let response: AIResponse = {
      text: "",
      provider: "internal",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };

    // Try Current Provider (only if it has a key)
    let primarySucceeded = false;
    if (primaryKey) {
      try {
        response = await this.generateWithProvider(primaryProvider, request, config);
        primarySucceeded = true;
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
      }
    }

    if (!primarySucceeded) {
      const candidateFallbacks = ['gemini', 'groq', 'openrouter', 'openai'].filter(p => p !== primaryProvider);
      let success = false;

      for (const fallbackProvider of candidateFallbacks) {
        const key = this.getProviderKey(config, fallbackProvider);
        if (!key || this.isDegraded(fallbackProvider)) continue;

        try {
          console.log(`[AI Provider] Trying fallback provider ${fallbackProvider}...`);
          response = await this.generateWithProvider(fallbackProvider, request, config);
          success = true;
          break;
        } catch (fallbackError: any) {
          const fallbackMsg = (fallbackError.message || "") + (fallbackError.response?.data?.error?.message || "");
          const fallbackMsgLower = fallbackMsg.toLowerCase();
          if (fallbackMsgLower.includes("quota") || fallbackMsg.includes("429") || fallbackMsgLower.includes("credits") || fallbackMsgLower.includes("rate limit") || fallbackMsgLower.includes("rate_limit")) {
            this.markDegraded(fallbackProvider);
          }
          console.warn(`[AI Provider] Fallback ${fallbackProvider} failed:`, fallbackMsg.substring(0, 150));
        }
      }

      if (!success) {
        console.error("[AI Provider] All providers failed");
        return {
          text: "Désolé, nos services d'IA sont saturés. Veuillez réessayer plus tard.",
          provider: 'error',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
      }
    }

    // 2. Sanitize and Save to Cache
    response.text = sanitizeAIText(response.text);

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

    if (answerParts.length) {
      const sanitized = sanitizeAIText(answerParts.join(""));
      if (sanitized) return sanitized;
    }

    const fallbackParts = parts
      .filter((p: { text?: string }) => p.text)
      .map((p: { text: string }) => p.text);

    if (fallbackParts.length) {
      const sanitized = sanitizeAIText(fallbackParts.join(""));
      if (sanitized) return sanitized;
    }

    throw new Error("Réponse Gemini vide ou non exploitable après filtrage des réflexions internes");
  }

  private async generateWithGemini(request: AIRequest, apiKey: string, model: string): Promise<AIResponse> {
    const modelId = this.getGeminiModelId(model);
    const isNewModel = !modelId.includes("1.0") && !modelId.includes("gemini-pro");

    const contents = normalizeHistoryForGemini(request.history, request.userMessage);

    if (!isNewModel && request.systemPrompt) {
      contents.unshift(
        { role: "user", parts: [{ text: `SYSTEM INSTRUCTIONS: ${request.systemPrompt}` }] },
        { role: "model", parts: [{ text: "Compris. Je suis prêt à agir selon ces instructions." }] }
      );
    }

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

    if (isNewModel && request.systemPrompt) {
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
    let systemPrompt = request.systemPrompt;
    if (request.jsonMode && !systemPrompt.toLowerCase().includes("json")) {
      systemPrompt += "\nYou must respond with a valid JSON object only.";
    }

    const messages = normalizeMessagesForOpenAI(systemPrompt, request.history, request.userMessage);

    const defaultGroqModel = model && model.trim() ? model : "openai/gpt-oss-120b";
    const modelsToTry = [defaultGroqModel, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "allam-2-7b", "qwen/qwen3.6-27b"].filter((m, i, arr) => arr.indexOf(m) === i && !!m);

    let lastError: any;
    for (const currentModel of modelsToTry) {
      try {
        const payload: any = {
          model: currentModel,
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
        const rawContent = response.data.choices?.[0]?.message?.content || "";
        const sanitized = sanitizeAIText(rawContent);

        if (!sanitized) {
          throw new Error(`Empty response after sanitization from Groq model ${currentModel}`);
        }

        return {
          text: sanitized,
          provider: 'groq',
          usage: {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0
          }
        };
      } catch (error: any) {
        lastError = error;
        const msg = error.response?.data?.error?.message || error.message;
        const isRateLimit = msg?.toLowerCase().includes("rate limit") || msg?.includes("429");

        if (isRateLimit) {
          console.warn(`[Groq] Model ${currentModel} rate limited. Switching immediately to next available model...`);
        } else {
          console.warn(`[Groq] Model ${currentModel} failed: ${msg?.substring(0, 100)}`);
        }
      }
    }

    const finalMsg = lastError?.response?.data?.error?.message || lastError?.message || "Groq request failed";
    console.error("Groq API Error:", finalMsg?.substring(0, 150));
    this.logProviderError('groq', finalMsg);
    throw new Error("Groq failed");
  }

  private async generateWithOpenAI(request: AIRequest, apiKey: string, model: string): Promise<AIResponse> {
    const messages = normalizeMessagesForOpenAI(request.systemPrompt, request.history, request.userMessage);

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
      const rawContent = response.data.choices?.[0]?.message?.content || "";
      return {
        text: sanitizeAIText(rawContent),
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
    const messages = normalizeMessagesForOpenAI(request.systemPrompt, request.history, request.userMessage);

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

      const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", payload, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://vendeuria.com",
          "X-Title": "Vendeur IA"
        }
      });

      const message = response.data?.choices?.[0]?.message;
      const text = sanitizeAIText(message?.content || "");

      if (!text) {
        throw new Error("Empty response received from OpenRouter");
      }

      const usage = response.data.usage || {};
      return {
        text,
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

    if (!apiKey) {
      if (env.AI_MOCK_MODE) {
        return { success: true, message: `Connectivité simulée (Mode Développeur) pour ${providerName}` };
      }
      return { success: false, message: "Clé API non configurée" };
    }

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

    if (env.AI_MOCK_MODE) {
      console.log("[AI Provider] Mocking Transcription 🎙️");
      return "Ceci est une transcription fictive (Mode Développeur). L'utilisateur demande des informations sur les prix et la disponibilité.";
    }

    const geminiKey = this.getProviderKey(config, 'gemini');

    if (geminiKey && !env.DISABLE_GEMINI) {
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

    if (env.AI_MOCK_MODE) {
       console.log("[AI Provider] Mocking Speech Generation 🔊");
       return Buffer.from("MOCK_AUDIO_DATA");
    }

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
    if (env.AI_MOCK_MODE) {
      console.log("[AI Provider] Mocking Embeddings 🧬");
      return Array(1536).fill(0).map(() => Math.random());
    }

    const config = await this.getDynamicConfig();
    const apiKey = this.getProviderKey(config, 'openai');

    if (!apiKey) {
      throw new Error("OpenAI API Key missing for embeddings");
    }

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

  private generateMockResponse(request: AIRequest): AIResponse {
    if (request.jsonMode) {
      // Check if the prompt suggests it's for the growth service
      const isGrowth = request.systemPrompt.toLowerCase().includes("coach") || request.userMessage.toLowerCase().includes("tips");

      if (isGrowth) {
        return {
          text: JSON.stringify({
            tips: [
              { text: "Optimisez vos photos de produits (Mode Mock)", action: "/products" },
              { text: "Connectez WhatsApp pour automatiser vos ventes", action: "/settings?tab=connexions" },
              { text: "Configurez vos zones de livraison", action: "/settings?tab=boutique" }
            ]
          }),
          provider: "mock",
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
        };
      }

      // Generic JSON mock
      return {
        text: JSON.stringify({
          success: true,
          message: "Réponse simulée en format JSON",
          data: {}
        }),
        provider: "mock",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
      };
    }

    const userMsg = request.userMessage.toLowerCase();
    let text = "Bonjour ! Je suis l'assistant IA de votre boutique en mode développement. Je peux simuler des réponses pour vous aider à tester l'interface sans utiliser de crédits API.";

    if (userMsg.includes("prix") || userMsg.includes("combien")) {
      text = "Ce produit est actuellement disponible en stock ! Son prix est de 15 000 XOF. C'est une excellente affaire, souhaitez-vous que je l'ajoute à votre panier ou que nous parlions de la livraison ?";
    } else if (userMsg.includes("commande") || userMsg.includes("acheter") || userMsg.includes("prends")) {
      text = "C'est une excellente décision ! Je prépare tout pour votre commande. Quel est votre quartier pour la livraison ? ✨\n\n[[ACTION_CREATE_ORDER:{\"items\":[{\"name\":\"Article Test\",\"quantity\":1}],\"deliveryAddress\":\"À préciser\"}]]";
    } else if (userMsg.includes("merci") || userMsg.includes("super")) {
      text = "Avec grand plaisir ! Je reste à votre entière disposition si vous avez d'autres questions sur nos articles. À très bientôt ! 👋";
    } else if (userMsg.includes("bonjour") || userMsg.includes("salut")) {
      text = "Bonjour ! Bienvenue chez nous. Je suis votre conseiller de vente IA. Comment puis-je vous aider aujourd'hui ? Je peux vous présenter nos nouveautés ou répondre à vos questions sur nos produits.";
    }

    return {
      text,
      provider: "mock",
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    };
  }
}

export const aiProvider = new AIProvider();
