
// Mock of the patterns and function for verification
const PROMPT_LEAK_PATTERNS: RegExp[] = [
  /règles?\s*d['’]action/i,
  /gardes-fous\s*(&|et)?\s*sécurité/i,
  /interdictions?\s*strictes?\s*de\s*vocabulaire/i
];

function sanitizeAIText(rawText: string): string {
  if (!rawText || typeof rawText !== "string") return "";

  let cleaned = rawText.trim();

  // 1. Remove XML/HTML style thought blocks
  cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thought[\s\S]*?<\/thought>/gi, "");

  // 9. Strip leaked internal section headers (simulated)
  cleaned = cleaned.replace(/^(?:RÈGLES D'ACTION ET ENGAGEMENT|TON ET PERSONA)\s*:[\s\S]*?(?=(?:\r?\n){2,}|$)/gi, "");

  const finalResult = cleaned.trim();

  // SAFETY: If sanitization stripped everything, return a minimally cleaned version
  if (!finalResult && rawText.trim()) {
    return rawText
      .replace(/<think[\s\S]*?<\/think>/gi, "")
      .replace(/<thought[\s\S]*?<\/thought>/gi, "")
      .trim() || rawText.trim();
  }

  return finalResult;
}

// Test Cases
const test1 = "<think>Reasoning here</think>Actual message";
const test2 = "<think>Internal prompt leak only: RÈGLES D'ACTION ET ENGAGEMENT: do not talk</think>";
const test3 = "TON ET PERSONA: expert seller. \n\n (Only leaked prompt)";
const test4 = "<think>Thinking...</think> TON ET PERSONA: expert seller.";

console.log("Test 1 (Normal):", sanitizeAIText(test1) === "Actual message" ? "✅" : "❌ (" + sanitizeAIText(test1) + ")");
console.log("Test 2 (Think only):", sanitizeAIText(test2) === "" ? "✅" : "❌ (Should be empty)");
console.log("Test 3 (Leaked prompt only):", sanitizeAIText(test3) !== "" ? "✅ (Recovered)" : "❌ (Empty!)");
console.log("Test 4 (Think + Leaked prompt):", sanitizeAIText(test4) !== "" ? "✅ (Recovered)" : "❌ (Empty!)");
