export function parseJsonFromAI<T = unknown>(text: string): T {
  const trimmed = text.trim();

  // Markdown code fence: ```json ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim());
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in AI response");
  }

  return JSON.parse(jsonMatch[0]);
}
