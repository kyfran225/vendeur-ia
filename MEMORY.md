# Project Memory: Vendeur IA

## Core Value Proposition (CVP)
**Simplicité & Efficacité Locale.** 
Le produit doit être utilisable par un commerçant sans formation technique en moins d'une minute.

## Tech Stack & Priorities
- **Backend**: Node.js/Express, MongoDB (Focus: Performance & Simplicity)
- **AI**: Gemini 1.5 Pro/Flash (Focus: Localized tone, Vision for products, Automatic Follow-ups)
- **WhatsApp**: Baileys/Meta API (Focus: Reliability & "One-click" connection)
- **Automation**: Scripts d'automatisation Git pilotés par l'IA (Groq/OpenRouter).

## UX Commandments
1. **The 30-Second Rule**: From sign-up to first product scan must take < 30s.
2. **Local Context First**: Every prompt must enforce local city/country context and tone.
3. **Automated Everything**: Receipts, follow-ups, stock alerts must be automated, not manual "workflows".

## Pitch & Key Differentiators (Pitch Points)
- **Fidélisation & Gamification IA :** L'agent IA suit automatiquement les achats de vos clients sur WhatsApp, leur attribue des points et déclenche des récompenses/remises personnalisées dès qu'ils deviennent VIP pour débloquer de nouveaux achats.
- **IA Vision Multi-Articles :** Ajout de catalogue entier par simple photo de rayon ou d'étalage.
- **Validation Automatique des Paiements :** Lecture IA des captures Mobile Money / virements pour valider les commandes instantanément.

## Documents Opérationnels
- **[ROADMAP.md](file:///C:/Users/Franck/web-apps/vendeur-ia/ROADMAP.md)** : Plan de finalisation détaillé étape par étape pour passer en production (110% fonctionnel).
- **[PROTOCOL.md](file:///C:/Users/Franck/web-apps/vendeur-ia/PROTOCOL.md)** : Règles de qualité et standards IA.

## Dernières Interventions
- **Assistant Copilot IA "Main Gauche" & Automation Git (2026-08-16)** :
  1. *Scripts Git IA (`gitai.ps1`, `gitai.py`)* : Création d'un système de commit intelligent qui analyse les diffs de code et génère des messages de commit professionnels via l'API Groq (Llama 3.3).
  2. *Raccourcis Productivité (`ga`, `gw`)* : Intégration de fonctions PowerShell personnalisées pour un workflow ultra-rapide (Commit + Push + Merge en une commande de 2 lettres).
  3. *Correction Encodage & Nettoyage* : Mise en conformité UTF-8 pour le traitement des accents français et mise à jour du `.gitignore` pour un staging propre sans fichiers résiduels (screenshots, logs).
- **Intégration Complète du Copilote & Support Fondateur (2026-08-16)** :
  1. *Spotlight Tour & Store Audit* : Implémentation de `SpotlightTourOverlay.tsx` et `StoreAuditModal.tsx` pour guider les nouveaux marchands.
  2. *Founder Tickets Inbox* : Nouveau module d'administration (`FounderTicketsInbox.tsx`) permettant de gérer les demandes directes des marchands.
  3. *Intelligence Contextuelle* : Refonte de `CopilotService` pour une analyse granulaire de l'état de la boutique.
- **Moteur Anti-Fraude Shield OCR & Audit Médico-Légal (2026-08-16)** :
  1. *Audit Multimodal de Falsification* : `PaymentShieldService` inspecte les captures d'écran à la recherche d'artefacts de retouche.
  2. *Défense Anti-Rejeu & Empreinte SHA-256* : Interdiction de réutilisation d'anciens reçus.
  3. *Interface d'Inspection (`PaymentProofAuditorModal.tsx`)* : Scanner en direct et registre d'audit pour les marchands.
- **Studio Apparence & Vitrine Marchand (Storefront Branding) (2026-08-16)** :
  1. *Studio d'Apparence Dédié (`StorefrontBrandingTab.tsx`)* : Gestion des palettes de marque, logos et images de couverture.
  2. *Hero Product Showcase Interactif* : Carrousel 3D dynamique pour mettre en avant les produits "Vedette".
  3. *Clean Slugs* : Normalisation des URLs de boutique (ex: `/shop/ma-boutique-225`).
- **Fonctionnalités Ventes & Inbox Avancées (2026-08-16)** :
  1. *Notes Vocales Marchand* : Enregistrement et envoi de notes vocales WhatsApp directement depuis l'interface web.
  2. *Fast Pay Mobile Money* : Génération instantanée de demandes de paiement Wave/OM/MTN.
  3. *Instant Studio V2* : Générateur d'affiches promo haute définition pour le statut WhatsApp.

- **Intégration WhatsApp Avancée & Surveillance du Statut (2026-08-16)** :
  1. *Service de Statut Dédié (`whatsapp-status.service.ts`)* : Système de monitoring temps réel de l'état de la session WhatsApp (Connecté, En attente de scan, Déconnecté, Erreur).
  2. *Gestion des Sessions & Auto-Reconnexion* : Amélioration de la résilience de `whatsapp.service.ts` pour gérer les déconnexions inattendues et fournir des retours précis au frontend.
  3. *Interface de Statut en Direct (`SettingsPage.tsx`)* : Nouveau widget visuel dans les paramètres pour scanner le QR Code et visualiser la santé de la connexion avec indicateurs colorés (🟢/🟡/🔴).
- **IA Growth Service & Analytics de Performance (2026-08-16)** :
  1. *Moteur d'Analyse de Croissance (`ai-growth.service.ts`)* : Calcul automatique des gains de productivité générés par l'IA (messages traités, temps gagné, ventes boostées).
  2. *Money Board Dynamique (`SalesDashboard.tsx`)* : Intégration des métriques de croissance IA directement dans le tableau de bord principal pour démontrer la valeur ajoutée immédiate.
- **Expérience d'Embarquement "Magic Onboarding" (2026-08-16)** :
  1. *Spotlight Tour Interactif (`SpotlightTourOverlay.tsx`)* : Guidage pas-à-pas des nouveaux marchands pour découvrir les fonctionnalités clés (Inbox, Catalogue, Settings).
  2. *Vendeur IA Loader & Branding Visuel (`VendeurIALoader.tsx`)* : Nouvel écran de chargement premium avec logo animé pour renforcer l'identité de marque lors des transitions lourdes.
- **Optimisation du Sales Inbox & Web Chat Widget (2026-08-16)** :
  1. *Web Chat Widget Harmonisé (`WebChatWidget.tsx`)* : Amélioration de l'intégration du chat sur la boutique publique, supportant mieux les interactions avec l'agent de vente IA.
  2. *Refonte du Sidebar & Navigation (`Sidebar.tsx`)* : Organisation plus intuitive des modules pour un accès rapide aux commandes, au catalogue et à l'IA.

## Bugs Bloquants Identifiés
- **Groq API Rate Limits** : Les gros commits peuvent déclencher des limites de jetons sur le tier gratuit de Groq.
- **Indefinite Spinner (Configuration IA)** : Le composant frontend `AiSettings` boucle indéfiniment si `aiSettings` n'est pas initialisé.

## Architectural Decisions
- **Stable Git Workflow**: Adoption d'un flux "Preview-to-Main" automatisé pour garantir que la branche stable reflète toujours un état testé et documenté.
- **WhatsApp Multi-Tenancy**: Routage intelligent des messages via Webhook partagé basé sur l'activité récente.
