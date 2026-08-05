export const GEMINI_DEFAULT_TEXT_MODEL = "gemini-3.6-flash";
export const GEMINI_DEFAULT_VISION_MODEL = "gemini-3.6-flash";

const DEPRECATED_GEMINI_MODELS: Record<string, string> = {
  // Gemini 1.x (retired 2025)
  "gemini-1.5-flash": GEMINI_DEFAULT_TEXT_MODEL,
  "gemini-1.5-flash-latest": GEMINI_DEFAULT_TEXT_MODEL,
  "gemini-1.5-flash-002": GEMINI_DEFAULT_TEXT_MODEL,
  "gemini-1.5-flash-001": GEMINI_DEFAULT_TEXT_MODEL,
  "gemini-1.5-pro": "gemini-3.5-pro",
  "gemini-1.5-pro-latest": "gemini-3.5-pro",
  "gemini-pro": GEMINI_DEFAULT_TEXT_MODEL,
  // Gemini 2.x (deprecated 2026)
  "gemini-2.0-flash": GEMINI_DEFAULT_TEXT_MODEL,
  "gemini-2.0-flash-lite": "gemini-3.5-flash-lite",
  "gemini-2.5-flash": GEMINI_DEFAULT_TEXT_MODEL,
  "gemini-2.5-flash-lite": "gemini-3.5-flash-lite",
  "gemini-2.5-pro": "gemini-3.5-pro",
  "gemini-2.5-flash-image": GEMINI_DEFAULT_VISION_MODEL,
};

export function resolveGeminiModel(model?: string, fallback = GEMINI_DEFAULT_TEXT_MODEL): string {
  const normalized = (model || fallback).replace(/^models\//, "");
  return DEPRECATED_GEMINI_MODELS[normalized] || normalized || fallback;
}
