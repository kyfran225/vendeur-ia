export const GEMINI_DEFAULT_TEXT_MODEL = "gemini-1.5-flash";
export const GEMINI_DEFAULT_VISION_MODEL = "gemini-1.5-flash";

const DEPRECATED_GEMINI_MODELS: Record<string, string> = {
  "gemini-pro": "gemini-1.5-pro",
  "gemini-1.0-pro": "gemini-1.5-pro",
  "gemini-1.5-flash-latest": "gemini-1.5-flash",
  "gemini-1.5-pro-latest": "gemini-1.5-pro",
};

export function resolveGeminiModel(model?: string, fallback = GEMINI_DEFAULT_TEXT_MODEL): string {
  const normalized = (model || fallback).replace(/^models\//, "");
  return DEPRECATED_GEMINI_MODELS[normalized] || normalized || fallback;
}

