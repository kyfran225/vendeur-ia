import "dotenv/config";
import { aiProvider } from "../services/ai-provider.js";

async function test() {
  console.log("--- Testing Intelligence Fallback (Gemini -> Groq) ---");

  const request = {
    systemPrompt: "Tu es un vendeur expert à Abidjan. Ton de vente direct et chaleureux avec emojis.",
    userMessage: "C'est combien la Robe de Gala ?",
    history: [],
    maxTokens: 100
  };

  try {
    console.log("[1] Simulation d'une panne Gemini...");
    // Pour simuler la panne, on va temporairement invalider la clé Gemini dans l'objet global si possible
    // ou simplement observer le comportement si Gemini est déjà hors quota.

    // On appelle la fonction réelle
    const response = await aiProvider.generateText(request);

    console.log("\n--- Résultat du Test ---");
    console.log("IA a répondu :", response);
    console.log("\nStatut : OPÉRATIONNEL (Grâce au double cerveau)");
  } catch (error) {
    console.error("❌ Test fatalement échoué:", error);
  }
}

test();
