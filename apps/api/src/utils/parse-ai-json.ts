export function parseJsonFromAI<T = unknown>(text: string): T {
  const trimmed = text.trim();

  // 1. Try to find content within Markdown code blocks first (most reliable)
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (e) {
      // If parsing fenced block fails, fall back to other methods
    }
  }

  // 2. Try to find the first '{' and last '}' to extract a JSON object
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    const potentialJson = trimmed.substring(start, end + 1);
    try {
      return JSON.parse(potentialJson);
    } catch (e) {
      // If parsing failed, maybe it's not the right match, continue
    }
  }

  // 3. Last resort: standard match
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Check if it's truncated (has { but no })
    if (trimmed.includes('{') && !trimmed.includes('}')) {
       throw new Error(`AI response truncated (missing closing brace). Length: ${trimmed.length}. Content: ${trimmed.substring(0, 100)}...`);
    }
    throw new Error(`No JSON object found in AI response. Length: ${trimmed.length}. Content: ${trimmed.substring(0, 100)}...`);
  }

  return JSON.parse(jsonMatch[0]);
}
