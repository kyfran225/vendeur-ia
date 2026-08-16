export function parseJsonFromAI<T = unknown>(text: string): T {
  if (!text || typeof text !== "string") {
    throw new Error("AI response is empty or not a string");
  }

  const trimmed = text.trim();

  // Helper to clean JSON string before parsing
  const sanitizeJson = (str: string): string => {
    return str
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, "$1")
      // Replace non-standard whitespace
      .replace(/[\u200B-\u200D\uFEFF]/g, "");
  };

  // 1. Try to find content within Markdown code blocks first (most reliable)
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(sanitizeJson(fenced[1].trim()));
    } catch (e) {
      // Fall through if parsing fenced block fails
    }
  }

  // 2. Try to find the first '{' and last '}' to extract a JSON object
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    const potentialJson = trimmed.substring(start, end + 1);
    try {
      return JSON.parse(sanitizeJson(potentialJson));
    } catch (e) {
      // Fall through
    }
  }

  // 3. Try to find the first '[' and last ']' if it is an array
  const startArr = trimmed.indexOf('[');
  const endArr = trimmed.lastIndexOf(']');
  if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
    const potentialArr = trimmed.substring(startArr, endArr + 1);
    try {
      return JSON.parse(sanitizeJson(potentialArr));
    } catch (e) {
      // Fall through
    }
  }

  // 4. Last resort: standard match
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    if (trimmed.includes('{') && !trimmed.includes('}')) {
       throw new Error(`AI response truncated (missing closing brace). Length: ${trimmed.length}. Content: ${trimmed.substring(0, 100)}...`);
    }
    throw new Error(`No JSON object found in AI response. Length: ${trimmed.length}. Content: ${trimmed.substring(0, 100)}...`);
  }

  return JSON.parse(sanitizeJson(jsonMatch[0]));
}
