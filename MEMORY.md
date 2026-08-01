# Project Memory: Vendeur IA

## Core Value Proposition (CVP)
**Simplicité & Efficacité Locale.** 
Le produit doit être utilisable par un commerçant sans formation technique en moins d'une minute.

## Tech Stack & Priorities
- **Backend**: Node.js/Express, MongoDB (Focus: Performance & Simplicity)
- **AI**: Gemini 1.5 Pro/Flash (Focus: Localized tone, Vision for products, Automatic Follow-ups)
- **WhatsApp**: Baileys/Meta API (Focus: Reliability & "One-click" connection)

## UX Commandments
1. **The 30-Second Rule**: From sign-up to first product scan must take < 30s.
2. **Local Context First**: Every prompt must enforce local city/country context and tone.
3. **Automated Everything**: Receipts, follow-ups, stock alerts must be automated, not manual "workflows".

## Ongoing Phase: Phase 8 - Marketing Hub
- **Objective**: Let the merchant broadcast offers without complexity.
- **Rule**: No complex segmentation editor. Just "Send to VIPs" or "Send to all active customers".

## Architectural Decisions
- **WhatsApp Multi-Tenancy**: Implemented a fallback system for Meta Cloud API. 
    1. Merchant-specific keys override everything.
    2. Fallback to `SystemSettings.metaConfig.whatsappDefaults`.
    3. Final fallback to environment variables.
    4. **Shared Webhook Routing**: Messages received on the system number are routed to the merchant with the most recent active conversation with that customer.
