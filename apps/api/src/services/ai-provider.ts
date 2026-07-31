import axios from "axios";
import { env } from "../config/env.js";

export interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  history?: { role: "customer" | "ai"; text: string }[];
  temperature?: number;
  maxTokens?: number;
}

export class AIProvider {
  private static readonly GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  async generateText(request: AIRequest): Promise<string> {
    if (env.GEMINI_API_KEY) {
      try {
        return await this.generateWithGemini(request);
      } catch (error) {
        console.error("Gemini failed, using smart mock.");
      }
    }

    // Mocked Sales Expert response for demonstration when API fails or is missing
    return `✨ Bonjour ! La Robe de Gala rouge est à 25.000 XOF. Nous livrons bien à Cocody pour 1.500 XOF. C'est une pièce magnifique qui part vite ! Souhaitez-vous que je vous l'envoie ? 🚀`;
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
