import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { CommerceMerchantModel } from "../commerce/commerce.model.js";
import { copilotService } from "./copilot.service.js";
import { logger } from "../../services/logger.service.js";

const router = Router();

// Middleware to resolve the current merchant from JWT user
const resolveMerchant = async (req: any, res: any, next: any) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const merchant = await CommerceMerchantModel.findOne({ ownerId });
    if (!merchant) {
      return res.status(404).json({ error: "Boutique marchand introuvable" });
    }

    req.merchant = merchant;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware to check for Admin role
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.roles?.includes("admin") || req.user?.email === "franck@vendeur-ia.com") {
    next();
  } else {
    res.status(403).json({ error: "Accès refusé. Administrateur uniquement." });
  }
};

/**
 * POST /api/copilot/chat
 * Send a message to Copilot and receive contextual answers & actionable buttons
 */
router.post("/chat", authenticate, resolveMerchant, async (req: any, res) => {
  try {
    const { message, pageRoute } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Le message est requis" });
    }

    const response = await copilotService.chat({
      merchantId: req.merchant._id.toString(),
      userMessage: message.trim(),
      pageRoute: pageRoute || "/dashboard",
      userEmail: req.user?.email,
      userPhone: req.merchant.phone || req.merchant.whatsappNumber
    });

    res.json(response);
  } catch (error: any) {
    logger.error(`[Copilot Router] Erreur chat: ${error.message}`);
    res.status(500).json({ error: error.message || "Erreur lors de la génération de la réponse" });
  }
});

/**
 * GET /api/copilot/suggestions
 * Retrieve 1-tap quick suggestions based on current route and store state
 */
router.get("/suggestions", authenticate, resolveMerchant, async (req: any, res) => {
  try {
    const pageRoute = (req.query.pageRoute as string) || "/dashboard";
    const data = await copilotService.getSuggestions(req.merchant._id.toString(), pageRoute);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/copilot/history
 * Fetch conversation history
 */
router.get("/history", authenticate, resolveMerchant, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await copilotService.getHistory(req.merchant._id.toString(), limit);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/copilot/history
 * Clear conversation history
 */
router.delete("/history", authenticate, resolveMerchant, async (req: any, res) => {
  try {
    await copilotService.clearHistory(req.merchant._id.toString());
    res.json({ success: true, message: "Historique réinitialisé" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/copilot/dispatch-founder
 * Send direct message / ticket from merchant to the Founders
 */
router.post("/dispatch-founder", authenticate, resolveMerchant, async (req: any, res) => {
  try {
    const { subject, message, category, priority, pageRoute } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Le contenu du message est requis" });
    }

    const ticket = await copilotService.dispatchTicketToFounders({
      merchantId: req.merchant._id.toString(),
      merchantName: req.merchant.businessName || "Commerçant Vendeur IA",
      userEmail: req.user?.email || "",
      userPhone: req.merchant.phone || req.merchant.whatsappNumber || "",
      subject: subject || "Message Commerçant au Fondateur",
      message: message.trim(),
      category: category || "founder_message",
      priority: priority || "high",
      pageRoute: pageRoute || "/dashboard"
    });

    res.json({
      success: true,
      message: "Votre message a été transmis directement au bureau des fondateurs. Merci !",
      ticket
    });
  } catch (error: any) {
    logger.error(`[Copilot Dispatch Router] Erreur: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ADMIN ONLY: GET /api/copilot/admin/tickets
 */
router.get("/admin/tickets", authenticate, isAdmin, async (req: any, res) => {
  try {
    const status = req.query.status as string;
    const tickets = await copilotService.getAdminTickets(status);
    res.json({ tickets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ADMIN ONLY: PATCH /api/copilot/admin/tickets/:id
 */
router.patch("/admin/tickets/:id", authenticate, isAdmin, async (req: any, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updated = await copilotService.updateTicketStatus(req.params.id, status, adminNotes);
    res.json({ success: true, ticket: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
