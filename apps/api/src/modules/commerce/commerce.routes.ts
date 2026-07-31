import { Router } from "express";
import { commerceService } from "./commerce.service.js";
import { paystackService } from "../../services/paystack.service.js";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/authenticate.js";
import { CommerceMerchantModel, CommerceProductModel, CommerceConversationModel, CommerceMessageModel } from "./commerce.model.js";
import axios from "axios";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/dashboard", authenticate, async (req, res) => {
  const ownerId = (req as any).user?.id;
  const data = await commerceService.getDashboard(ownerId);
  res.json(data);
});

router.get("/conversations", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const conversations = await CommerceConversationModel.find({ merchantId: merchant._id })
      .populate("customerId")
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/conversations/:id/messages", authenticate, async (req, res) => {
  try {
    const messages = await CommerceMessageModel.find({ conversationId: req.params.id })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/activate-premium", authenticate, async (req, res) => {
  const { email } = req.body;
  try {
    const data = await paystackService.initializeSubscription(email, 5000);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/merchant", authenticate, async (req, res) => {
  const ownerId = (req as any).user.id;
  try {
    const merchant = await commerceService.createMerchant(ownerId, req.body);
    res.status(201).json(merchant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/products", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    const product = await CommerceProductModel.create({
      ...req.body,
      merchantId: merchant._id
    });
    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/products/vision", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const analysis = await commerceService.analyzeProductImage(
      req.file.buffer,
      req.file.mimetype
    );

    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/products/:id", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    await CommerceProductModel.findOneAndDelete({
      _id: req.params.id,
      merchantId: merchant._id
    });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/ai-settings", authenticate, async (req, res) => {
  try {
    const ownerId = (req as any).user.id;
    const merchant = await CommerceMerchantModel.findOneAndUpdate(
      { ownerId },
      { $set: { aiSettings: req.body } },
      { new: true }
    );
    res.json(merchant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Demo AI Processing Route (Replicated from hold)
router.post("/demo/process", async (req, res) => {
  try {
    const { businessName, city, category, description, message, history, phone } = req.body;

    const isLocal = phone?.startsWith('225') || !phone;
    const isInitial = message === "SYSTEM_INITIAL_GREETING";

    const [merchantInstructions, merchantPayments] = (description || "").split("---");

    const prompt = `Tu es l'Expert Principal de Vente de la boutique "${businessName}" située à ${city}.
Ton domaine : ${category}.

OBJECTIF : Agir comme un vendeur d'élite, professionnel, exhaustif et persuasif.

RÈGLES D'OR DE COMPORTEMENT :
1. PROFESSIONNALISME : Ton poli, expert et pro-actif. Évite les interjections familières.
2. EXHAUSTIVITÉ : Réponds à CHAQUE point mentionné dans le message du client.
3. PAIEMENTS : Utilise exactement ces infos si demandées : ${merchantPayments || "Consulter le vendeur"}.
4. LIVRAISON/CONSIGNES : Applique ces instructions : ${merchantInstructions || "À confirmer"}.
5. STRUCTURE : Salutation + Validation des demandes + Solution + Action concrète.

ANALYSE STRATÉGIQUE :
- Localisation du client : ${isLocal ? 'Client Local' : 'Client International'}.
- Tactique :
   * Si Local : Encourage la visite au showroom ou la livraison rapide.
   * Si International : Rassure sur les délais d'expédition.

${isInitial ? "ACTION : C'est le premier contact. Fais un accueil mémorable, pro et structuré." : `HISTORIQUE : ${JSON.stringify(history)}`}

${isInitial ? '' : `MESSAGE CLIENT ACTUEL : "${message}"`}

INSTRUCTIONS DE SORTIE : Max 65 mots.
RECOMMANDATION : Ne demande JAMAIS l'adresse ou la localisation du client dans un premier message de salutation. Attends que la commande ou la livraison soit abordée.`;

    let reply = "";
    if (env.GEMINI_API_KEY) {
       try {
         const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
           contents: [{ parts: [{ text: prompt }] }],
           generationConfig: { maxOutputTokens: 160, temperature: 0.7 }
         });
         reply = response.data.candidates[0].content.parts[0].text;
       } catch (err) {
         reply = `Bonjour ! ✨ Bienvenue chez ${businessName}. Comment puis-je vous aider aujourd'hui ?`;
       }
    } else {
       reply = `Bonjour ! ✨ Bienvenue chez ${businessName}. Nous sommes spécialisés en ${category} à ${city}. Que recherchez-vous ?`;
    }

    res.json({ reply: reply.trim() });
  } catch (error) {
    res.status(500).json({ error: "ai_demo_error" });
  }
});

export default router;
