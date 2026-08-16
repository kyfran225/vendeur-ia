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

## Pitch & Key Differentiators (Pitch Points)
- **Fidélisation & Gamification IA :** L'agent IA suit automatiquement les achats de vos clients sur WhatsApp, leur attribue des points et déclenche des récompenses/remises personnalisées dès qu'ils deviennent VIP pour débloquer de nouveaux achats.
- **IA Vision Multi-Articles :** Ajout de catalogue entier par simple photo de rayon ou d'étalage.
- **Validation Automatique des Paiements :** Lecture IA des captures Mobile Money / virements pour valider les commandes instantanément.

## Documents Opérationnels
- **[ROADMAP.md](file:///C:/Users/Franck/web-apps/vendeur-ia/ROADMAP.md)** : Plan de finalisation détaillé étape par étape pour passer en production (110% fonctionnel).
- **[PROTOCOL.md](file:///C:/Users/Franck/web-apps/vendeur-ia/PROTOCOL.md)** : Règles de qualité et standards IA.

## Dernières Interventions
- **Personnalisation & Normalisation des Liens de Boutique (Clean Slugs) (2026-08-16)** :
  1. *Normalisation Automatique des Noms* : Moteur `slugify` (gestion des accents, suppression des caractères interdits, conversion des espaces en tirets). Exemple : `"Boutique L'Élégance & Co 225"` &rarr; `http://localhost:5173/shop/boutique-lelegance-co-225`.
  2. *Résolveur Backend Hybride (`findMerchantByIdOrSlug`)* : Les routes `/api/commerce/public/shop/:idOrSlug` et `/order` résolvent en toute transparence les identifiants MongoDB et les slugs personnalisés.
  3. *Diffusion Partout* : QR Codes de l'Instant Studio, boutons de partage WhatsApp, Tableau de bord et Paramètres utilisent désormais automatiquement l'URL personnalisée mémorable de chaque marchand.
- **Envoi de Notes Vocales Marchand / Voice Memo dans l'Inbox (2026-08-16)** :
  1. *Enregistreur Audio Natif Web (`VoiceRecorder.tsx`)* : Capture audio directe via l'API `MediaRecorder` avec timer en direct, visualiseur d'ondes, bouton d'annulation et d'envoi.
  2. *Transcription IA Automatique & Stockage* : Route backend `POST /api/commerce/conversations/:id/voice` avec transcription immédiate par `aiProvider` (Gemini Flash / Whisper) et enregistrement en base.
  3. *Dispatch WhatsApp Natif PTT* : Expédition du message audio sous forme de véritable Push-To-Talk WhatsApp (note vocale officielle) via Baileys & Meta API.
- **Fast Pay Mobile Money dans la Boîte de Réception (2026-08-16)** :
  1. *Génération Instantanée 1-Clic* : Route backend dédiée `POST /api/commerce/conversations/:id/fast-pay` pour construire et expédier instantanément des demandes de règlement stylisées (Wave avec lien direct `wave.com/send?phone=...`, Orange Money avec code USSD `#144#`, MTN MoMo `*133#`).
  2. *Modal d'Encaissement Dédié (`FastPayModal.tsx`)* : Saisie du montant avec pilules d'ajout rapide (+5 000, +10 000, +25 000, +50 000 FCFA), sélection du moyen ou multi-moyens, et envoi direct dans la discussion.
  3. *Accès Rapide Inbox* : Boutons d'accès rapide "Encaisser" dans le header de conversation et dans la barre de saisie de `SalesInbox.tsx`.
- **Instant Studio V2 — Générateur d'Affiches Promo Statut WhatsApp (2026-08-16)** :
  1. *Multi-Formats Réseaux Sociaux* : Génération instantanée au format Story 9:16 (1080x1920), Post Carré 1:1 (1080x1080) et Flyer 4:5 (1080x1350).
  2. *Stickers Promo & Prix Barrés* : Badges configurables (*Promo Flash, -20%, -30%, -50%, Nouveauté, Livraison Offerte*), calcul de prix barré et générateur d'accroches IA en 1 clic.
  3. *QR Code Boutique & Partage Direct* : Intégration automatique d'un QR code de commande direct et partage direct vers le Statut WhatsApp (`navigator.share` avec image HD et légende commerciale).
  4. *Accès Direct Catalogue* : Bouton Studio Affiche disponible directement sur chaque fiche article dans `ProductManager.tsx` et `ProductScanner.tsx`.
- **Boutique Publique & Social Commerce "Effet Waouh" (2026-08-16)** :
  1. *Panier Intelligent Multi-Articles & Fast-Checkout* : Panier interactif fluide avec calcul en temps réel des frais par zone de livraison (Cocody, Yopougon, Plateau, Intérieur...), choix du mode de paiement (Espèces vs Mobile Money Wave/OM/MoMo) et enregistrement direct en base via `POST /api/commerce/public/shop/:merchantId/order` avec notification temps réel socket au commerçant.
  2. *Recherche Vocale IA (Voice-to-Search)* : Reconnaissance vocale Web Speech intégrée avec visualiseur audio pour chercher et filtrer les produits en dictant sa recherche au micro.
  3. *Stories & Reels Plein Écran* : Showcase interactif façon TikTok / Instagram Stories avec barre de progression, micro-animations, et actions rapides d'ajout au panier et commande WhatsApp.
  4. *Social Proof & Trust Engine* : Alertes dynamiques de commandes en direct, badges de confiance certifiés Vendeur IA et statistiques de réactivité en temps réel.
  5. *Partage & QR Code Instantanés* : Générateur de QR Code haute définition pour magasin physique et partage 1-clic du catalogue vers le statut WhatsApp.
- **Module Commandes Complet (2026-08-16)** :
  1. *Création Autonome IA* : L'agent IA détecte les intentions d'achat fermes dans le chat (`[[ACTION_CREATE_ORDER]]`), nettoie le texte pour le client et crée automatiquement la commande en base en statut `"pending"`.
  2. *Bons de Commande & Bordereaux* : Génération et impression immédiate (`OrderReceiptModal.tsx`), avec export textuel formaté en 1 clic vers WhatsApp.
  3. *Dispatch Livreur* : Assignation d'un coursier (`DeliveryDispatchModal.tsx`) et envoi automatique par WhatsApp de la fiche de livraison (adresse client, liste des articles, montant à encaisser).
  4. *Filtres Temporels & Export Comptable* : Filtrage instantané (Aujourd'hui, 7 jours, 30 jours, Tout) et export CSV/Excel propre pour la comptabilité du commerçant.
- **Batch Photo-to-Product / Vision Multi-Articles (2026-08-08)** : Implémentation complète de la détection et création de catalogues multi-produits par photo. Mise à jour de `commerce.service.ts` (analyse multi-articles Gemini/OpenAI), création du composant de révision/édition rapide `BatchReviewModal.tsx` et intégration dans `ProductScanner.tsx` et `ProductManager.tsx`.
- **Validation Paystack Côte d'Ivoire & Architecture Multi-Pays (2026-08-08)** : Confirmation du compte Live Maât Feed (`pk_live_882659738a53aa8f8cc4c88afeabf58e89edf496`). Validation de la stratégie de paiement (Cartes = Subscriptions récurrentes Paystack / Mobile Money = Recharge + Relances d'échéance automatisées via `billing-queue.service.ts`). Webhook route vérifié sur `/api/payments/webhook/paystack`.
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
