# 🗺️ ROADMAP DE FINALISATION : VENDEUR IA OS (110% Fonctionnel & Prêt pour la Production)

Ce document sert de plan directeur technique et de guide d'exécution pour tous les agents IA intervenant sur le projet **VENDEUR IA OS**. L'objectif est d'atteindre une fiabilité absolue ("Logic-Perfect") et une expérience utilisateur irréprochable sur mobile.

---

## 📊 TABLEAU DE BORD DU PROJET (MULTI-AGENT TRACKER)

| Phase / Tâche | Statut | Responsable / Agent | Dernière Mise à jour |
| :--- | :---: | :---: | :---: |
| **Bugs Prioritaires (Endless Spinner)** | ✅ Résolu | Antigravity | 2026-08-02 |
| **Phase 1 : PWA, Sécurité & Offline** | ✅ Résolu | Antigravity | 2026-08-14 |
| **Phase 2 : IA Vision (Photo-to-Product)** | ✅ Résolu | Antigravity | 2026-08-14 |
| **Phase 3 : Inbox Sync & Push** | ✅ Résolu | Antigravity | 2026-08-14 |
| **Phase 4 : Paiements & Reçus** | ✅ Résolu | Antigravity | 2026-08-14 |
| **Phase 5 : Captions & Nouchi/Wolof** | ✅ Résolu | Antigravity | 2026-08-14 |

> [!NOTE]
> **Instructions pour les agents IA** : Mettez à jour le tableau ci-dessus et cochez les tâches au fur et à mesure de vos implémentations. Lancez toujours `pnpm build` pour valider votre code.

---

## 🛑 BUGS PRIORITAIRES ET CORRECTIONS IMMÉDIATES

### 1. Spinner de chargement infini sur l'onglet Configuration IA (`/settings` ou `/knowledge`)
*   **Problème** : Dans [AiSettings.tsx](file:///apps/web/src/features/settings/AiSettings.tsx), la condition `if (isLoading || !settings)` bloque l'affichage si le marchand n'a pas encore configuré ou si `dashboard?.merchant?.aiSettings` est absent/undefined.
*   **Solution** : 
    1. Initialiser l'état local `settings` avec des valeurs par défaut si `dashboard.merchant.aiSettings` est absent.
    2. Ajouter un traitement d'erreur robuste sur les requêtes `useQuery` pour empêcher le blocage visuel de l'application.
    3. Assurer la création automatique d'un profil marchand par défaut lors de l'onboarding pour éviter les appels API dans le vide.

### 2. Liens morts et crashs de navigation dans le menu
*   **Problème** : Certains éléments du menu renvoient vers des routes non implémentées ou causent des erreurs `Cannot read properties of undefined`.
*   **Solution** :
    1. Inspecter tous les composants de mise en page ([AppLayout.tsx](file:///apps/web/src/components/layout/AppLayout.tsx)) et s'assurer que chaque lien pointe vers une route existante définie dans [App.tsx](file:///apps/web/src/App.tsx).
    2. Utiliser des placeholders élégants avec des illustrations ou états vides (*Empty States*) à la place des pages blanches ou des crashs.

---

## 🏗️ PHASE 1 : AUTHENTIFICATION, SÉCURITÉ & HORS-LIGNE (100% Core)

### 1.1 Intégration complète de Google Auth
*   **Fichiers à modifier/créer** :
    *   Backend : `apps/api/src/modules/auth/auth.service.ts`
    *   Frontend : `apps/web/src/features/auth/AuthSheet.tsx` et `App.tsx`
*   **Spécifications** :
    *   Configurer le wrapper `@react-oauth/google` dans l'application avec la variable d'environnement `VITE_GOOGLE_CLIENT_ID`.
    *   Remplacer le bouton de connexion mocké par le vrai bouton Google et envoyer le token d'accès au backend.
    *   Côté API, valider l'ID token de Google et créer/connecter l'utilisateur en renvoyant un JWT propre.

### 1.2 Support PWA & Mode Hors-ligne
*   **Fichiers à modifier/créer** :
    *   Frontend : `apps/web/vite.config.ts`, `apps/web/src/components/ui/WifiOff.tsx`
*   **Spécifications** :
    *   Activer le plugin `vite-plugin-pwa` avec `registerType: 'autoUpdate'`.
    *   Créer le manifeste complet avec icônes de marque et screenshots mobiles pour une installation directe sur Android/iOS.
    *   Créer un composant global `WifiOff` qui détecte la perte de réseau et désactive temporairement les actions nécessitant une connexion API.

---

## 🧠 PHASE 2 : INTELLIGENCE ARTIFICIELLE MULTIMODALE (100% AI)

### 2.1 IA Vision : Création de produit par photo (Photo-to-Product)
*   **Fichiers à modifier/créer** :
    *   Backend : route `POST /api/products/vision` dans [commerce.routes.ts](file:///apps/api/src/modules/commerce/commerce.routes.ts)
    *   Frontend : `apps/web/src/features/products/ProductManager.tsx` et composants d'importation d'image
*   **Spécifications** :
    *   Permettre au commerçant de prendre une photo de son produit (vêtement, cosmétique, etc.).
    *   Utiliser Gemini 1.5 Flash sur l'API pour analyser l'image et en extraire au format JSON : le nom du produit, une description attractive en français avec jargon de vente local, une estimation de prix et des tags.
    *   Afficher une animation d'analyse IA en cours (scanner de pixels) et préremplir instantanément le formulaire de création de produit.

### 2.2 IA Audio : Voice Commerce (Interprétation Vocale)
*   **Fichiers à modifier/créer** :
    *   Backend : intégration de transcription dans `apps/api/src/services/ai-provider.ts`
*   **Spécifications** :
    *   Permettre le traitement automatique des notes vocales des clients sur WhatsApp.
    *   Transcrire le son via Gemini Audio ou Whisper et analyser l'intention d'achat (ex: "Je veux le parfum bleu à Cocody").

---

## 💬 PHASE 3 : INBOX EN TEMPS RÉEL & NOTIFICATIONS (100% Sales)

### 3.1 Synchronisation en direct de la boîte de réception
*   **Fichiers à modifier/créer** :
    *   Frontend : `apps/web/src/features/inbox/SalesInbox.tsx`
    *   Backend/Realtime : `apps/api/src/realtime/socketServer.ts`
*   **Spécifications** :
    *   Connecter l'Inbox via Socket.io pour recevoir les nouveaux messages instantanément.
    *   Afficher un indicateur visuel de frappe ("*L'IA est en train de rédiger...*") lorsque l'agent répond automatiquement sur WhatsApp.

### 3.2 Notifications Push pour le Marchand
*   **Fichiers à modifier/créer** :
    *   Frontend : Service Worker et bouton d'abonnement dans les réglages.
    *   Backend : Intégration de la bibliothèque `web-push`.
*   **Spécifications** :
    *   Dès qu'une vente est convertie ou qu'un client requiert une intervention humaine ("Needs Human"), envoyer une notification push avec sonnerie au téléphone du commerçant.

---

## 💰 PHASE 4 : CONVERSION COMMERCIALE & PAIEMENTS (100% Revenue)

### 4.1 Détection automatique des captures d'écran de paiement
*   **Fichiers à modifier/créer** :
    *   Backend : fonction `validatePaymentProof` dans [commerce.service.ts](file:///apps/api/src/modules/commerce/commerce.service.ts)
*   **Spécifications** :
    *   Lorsqu'un client envoie une image dans le chat, utiliser Gemini pour déterminer s'il s'agit d'une preuve de transfert Mobile Money (Wave, Orange, MTN).
    *   Extraire l'ID de transaction, le montant et le statut pour marquer automatiquement la commande correspondante comme "Payée".

### 4.2 Génération et envoi de reçu numérique automatisé
*   **Fichiers à modifier/créer** :
    *   Backend : fonction `generateDigitalReceipt` dans [commerce.service.ts](file:///apps/api/src/modules/commerce/commerce.service.ts)
*   **Spécifications** :
    *   Générer un reçu textuel stylisé (avec emojis et détails clairs) et l'envoyer instantanément par WhatsApp dès confirmation du paiement.

---

## 🌟 PHASE 5 : MODULES EXCELLENCE (110%)

### 5.1 Générateur de légendes et d'accroches virales TikTok/Instagram
*   **Fichiers à modifier/créer** :
    *   Frontend/Backend : Route de génération de légendes pour produits.
*   **Spécifications** :
    *   Ajouter un bouton "Générer Accroche Sociale" sur la fiche produit pour créer instantanément des captions optimisées pour la vente locale.

### 5.2 Prise en charge des langues et accents locaux (Nouchi / Wolof)
*   **Spécifications** :
    *   Enrichir le système de prompt de l'IA pour s'adapter parfaitement aux tournures familières locales de Côte d'Ivoire (Nouchi) et du Sénégal (Wolof) selon les préférences du marchand.

---

## 📜 DIRECTIVES DE TRAVAIL POUR TOUS LES MODÈLES IA

1.  **Zéro Simulation** : N'écrivez aucun code de façade. Si un bouton existe, il doit être connecté à une action réelle ou afficher explicitement son statut de chargement.
2.  **Mobile-First Strict** : Testez le rendu visuel systématiquement. L'application est faite pour être contrôlée d'une seule main sur mobile.
3.  **Faire tourner les builds** : À la fin de chaque étape implémentée, exécutez la commande de build complète :
    ```bash
    pnpm build
    ```
4.  **Mettre à jour `MEMORY.md` et `ROADMAP.md`** : Cochez les cases accomplies et détaillez l'avancement technique à chaque itération.
