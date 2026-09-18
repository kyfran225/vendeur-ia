
function sanitizeAIText(rawText) {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<thought[\s\S]*?<\/thought>/gi, "");
  cleaned = cleaned.replace(/^(?:RÈGLES D'ACTION ET ENGAGEMENT|TON ET PERSONA)\s*:[\s\S]*?(?=(?:\r?\n){2,}|$)/gi, "");
  const finalResult = cleaned.trim();
  if (!finalResult && rawText.trim()) {
    return rawText
      .replace(/<think[\s\S]*?<\/think>/gi, "")
      .replace(/<thought[\s\S]*?<\/thought>/gi, "")
      .trim() || rawText.trim();
  }
  return finalResult;
}

console.log('T3 (Leaked prompt only):', "'" + sanitizeAIText("TON ET PERSONA: expert seller.") + "'");
console.log('T4 (Think + Leaked prompt):', "'" + sanitizeAIText("<think>Thinking...</think> TON ET PERSONA: expert seller.") + "'");
console.log('T5 (Normal):', "'" + sanitizeAIText("<think>Thinking...</think> Hello world") + "'");
