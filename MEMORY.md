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

## Documents Opérationnels
- **[ROADMAP.md](file:///C:/Users/Franck/web-apps/vendeur-ia/ROADMAP.md)** : Plan de finalisation détaillé étape par étape pour passer en production (110% fonctionnel).
- **[PROTOCOL.md](file:///C:/Users/Franck/web-apps/vendeur-ia/PROTOCOL.md)** : Règles de qualité et standards IA.

## Dernières Interventions
- **Intégration Facebook (2026-08-05)** : Ajout du support complet Facebook Messenger (Pages) avec redirection Marketplace Pro vers Pack Pro (25.000 FCFA). Mise à jour des contrats Core, API et Web.
- **Rapports Hebdomadaires IA (2026-08-08)** : Automatisation des bilans de performance envoyés aux marchands chaque lundi (Clients servis, Ventes récupérées, Top Produit). Optimisation de la logique de relance pour un tracking précis.

## Bugs Bloquants Identifiés
- **Indefinite Spinner (Configuration IA)** : Le composant frontend `AiSettings` boucle indéfiniment si `aiSettings` n'est pas initialisé ou est manquant.
- **Erreurs de Navigation** : Menu cassé sur certaines pages n'ayant pas de repli propre lorsque le profil marchand n'existe pas.

## Architectural Decisions
- **WhatsApp Multi-Tenancy**: Implemented a fallback system for Meta Cloud API. 
    1. Merchant-specific keys override everything.
    2. Fallback to `SystemSettings.metaConfig.whatsappDefaults`.
    3. Final fallback to environment variables.
    4. **Shared Webhook Routing**: Messages received on the system number are routed to the merchant with the most recent active conversation with that customer.
