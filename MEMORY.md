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
- **Moteur Anti-Fraude Shield OCR & Audit Médico-Légal de Paiements Mobile Money (2026-08-16)** :
  1. *Audit Multimodal de Falsification (Photoshop & Génération IA)* : `PaymentShieldService` inspecte les captures d'écran (Wave, Orange Money, MTN MoMo, Moov, Djamo) à la recherche d'artefacts de retouche Photoshop, de polices de caractères non conformes, de falsification de pixels et de faux reçus synthétisés par IA (Midjourney, DALL-E, générateurs de faux reçus).
  2. *Défense Anti-Rejeu & Empreinte SHA-256 (`PaymentProofLogModel`)* : Calcul d'empreinte SHA-256 sur l'image et indexation unique des identifiants de transaction (`transactionId`) pour interdire formellement toute réutilisation d'un ancien reçu.
  3. *Verrouillage Destinataire (Recipient Locking)* : Vérification stricte que le numéro ou nom du compte crédité sur la capture correspond exactement aux canaux de paiement configurés par le marchand.
  4. *Contrôle de Fraîcheur Temporelle (< 2h)* : Rejet ou alerte sur les captures datant de plus de 2 heures ou de dates antérieures.
  5. *Moteur de Décision à 3 Niveaux & Score de Confiance (0-100%)* :
     - 🟢 `AUTO_APPROVED` (Score >= 85%) : Validation automatique de la commande + envoi du reçu numérique stylisé par WhatsApp.
     - 🟡 `FLAGGED_FOR_REVIEW` (Score 50-84%) : Notification Push au commerçant pour validation/rejet manuel en 1-clic.
     - 🔴 `REJECTED_FRAUD` (Score < 50%) : Rejet immédiat avec alerte de tentative de fraude.
  6. *Interface d'Inspection & Scanner en Direct (`PaymentProofAuditorModal.tsx`)* : Modal dédié accessible depuis le gestionnaire de commandes (`OrderManager.tsx`) avec visualiseur de registre d'audit et testeur de capture d'écran en direct.
- **Assistant Virtuel & Copilote Vendeur IA Intelligent (2026-08-16)** :
  1. *Intelligence Contextuelle Temps Réel & Guidage Zéro-Formation* : Le Copilote (`/api/copilot/chat`) analyse l'état instantané de la boutique (catalogue, commandes en attente, chiffre du jour, connexion WhatsApp, configuration Mobile Money) et oriente le commerçant pas-à-pas avec des instructions limpides.
  2. *Actions Interactives & 1-Clic (`SuggestedAction`)* : Génération automatique de boutons interactifs dans les réponses IA (`[[ACTION_NAVIGATE:...]]`, `[[ACTION_OPEN_MODAL:...]]`) permettant d'aller directement scanner un produit, traiter une commande, ouvrir l'encaissement Wave/OM ou configurer ses tarifs.
  3. *Ligne Directe Fondateur & Escalade Automatique (`FounderContactModal` & `CopilotTicketModel`)* : Le marchand peut envoyer des messages, suggestions ou signalements de bugs directement au bureau du Lead & Fondateurs avec notification Push Web immédiate aux comptes administrateurs.
  4. *Widget Flottant & Drawer Ultra-Premium (`CopilotWidget.tsx`)* : Interface glassmorphic Mobile-First avec suggestions prédictives 1-tap, indicateur de santé en direct, dictée vocale Web Speech et synthèse audio vocale (lecture à voix haute des réponses).
  5. *Accès Universel* : Intégration globale dans `AppLayout.tsx` et bouton dédié dans `ShellHeader.tsx`.
- **Standard d'Excellence Mobile-First & Desktop Impeccable (2026-08-16)** :
  1. *Règle d'or de conception* : Tout nouvel écran, onglet ou composant doit être impérativement pensé et testé en **Mobile-First** (dimensions tactiles h-11/h-12, `shrink-0` systématique sur toutes les icônes, retour à la ligne naturel sans troncature sauvage, boutons pleines largeurs ou centrés, zéro `overflow-x-hidden` cassant les `position: sticky`) tout en restant majestueux et spacieux sur Desktop/PC.
  2. *Refonte Mobile-First de l'onglet Profil (`ProfileTab.tsx`)* :
     - Avatar responsive (`h-28 w-28` sur mobile, `h-36 w-36` sur desktop) avec bouton caméra tactile `h-9 w-9` / `h-11 w-11`.
     - Badges de statut et ID marchand adaptatifs avec micro-copie 1-tap.
     - Formulaires d'informations personnelles et de mot de passe avec inputs confortables `h-12 sm:h-14`, labels uppercase nets et boutons de validation pleine largeur sur smartphone.
- **Refonte Mobile-First du Studio Apparence & Vitrine (2026-08-16)** :
  1. *Protection Anti-Écrasement des Icônes* : Ajout de `shrink-0` systématique sur toutes les icônes vectorielles et conteneurs d'icônes pour éliminer tout rétrécissement sur petit écran.
  2. *Titres & Cartes Responsive* : Alignement ergonomique des en-têtes de section avec wrap naturel, paddings adaptatifs (`p-4 sm:p-6`) et grilles fluides pour les palettes de couleurs et l'upload de photos.
  3. *Barre d'Action Flottante Compacte & Centrée* : Affichage de la pilule sticky uniquement en cas de modifications avec boutons tactiles `h-11 sm:h-12` et libellé clair "Enregistrer".
- **Studio Apparence & Vitrine Marchand (Storefront Branding) (2026-08-16)** :
  1. *Studio d'Apparence Dédié (`StorefrontBrandingTab.tsx`)* : Nouvel onglet dans les Paramètres permettant au marchand de choisir sa palette de marque (Émeraude, Or & Luxe, Ambre, Cyber Indigo, Rose Glamour, Bleu Océan), téléverser son logo & image de couverture, configurer un bandeau d'annonce flash défilant, ses liens Instagram/TikTok/Facebook et ses horaires.
  2. *Épinglage "En Vedette" 1-Clic (`ProductManager.tsx`)* : Bouton étoile `⭐ En Vedette` sur chaque produit pour sélectionner manuellement les articles mis en avant dans le Hero Showcase et les Stories.
  3. *Diffusion Live sur la Boutique (`PublicShop.tsx`)* : Rendu du bandeau d'annonce flash animé au sommet, logo officiel dans le header, liens réseaux sociaux et horaires en direct.
- **Hero Product Showcase Interactif & Tactile (2026-08-16)** :
  1. *Carrousel Dynamique 3D & Auto-Play (`HeroProductShowcase.tsx`)* : Défilement automatique toutes les 4.5s des articles phares du marchand, avec pause au survol, support complet du Touch / Drag Swipe sur mobile.
  2. *Card Flottante Glassmorphism* : Affichage du titre, prix, catégorie, badge "Sélection Vedette" et bouton d'ajout direct au panier en 1 clic + loupe d'inspection.
  3. *Navigation Fluide* : Flèches interactives et barre d'indicateurs de progression dynamique en bas de carte.
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
- **Indefinite Spinner (Configuration IA)** : Le composant frontend `AiSettings` boucle indéfiniment si `aiSettings` n'est pas initialisé ou est manquant.
- **Erreurs de Navigation** : Menu cassé sur certaines pages n'ayant pas de repli propre lorsque le profil marchand n'existe pas.

## Architectural Decisions
- **WhatsApp Multi-Tenancy**: Implemented a fallback system for Meta Cloud API. 
    1. Merchant-specific keys override everything.
    2. Fallback to `SystemSettings.metaConfig.whatsappDefaults`.
    3. Final fallback to environment variables.
    4. **Shared Webhook Routing**: Messages received on the system number are routed to the merchant with the most recent active conversation with that customer.
