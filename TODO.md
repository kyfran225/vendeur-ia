# 🚀 VENDEUR IA OS - Ultra-Detailed Implementation Roadmap (110%)

Ce document trace la route vers une version production "Over-Delivered".

## 🏗️ PHASE 1 : Fondations & Sécurité (100% Core)
- [x] **Google Auth Full Integration**
    - [x] Backend: Valider `GOOGLE_CLIENT_ID` dans `env.ts`.
    - [x] Backend: Finaliser `auth.service.ts` pour mapper correctement les profils Google.
    - [x] Frontend: Installer `@react-oauth/google`.
    - [x] Frontend: Configurer `GoogleOAuthProvider` dans `App.tsx`.
    - [x] Frontend: Remplacer le mock dans `AuthSheet.tsx` par le vrai bouton Google Login.
- [x] **PWA & Offline-First**
    - [x] Frontend: Configurer `vite-plugin-pwa` avec `registerType: 'autoUpdate'`.
    - [x] Frontend: Créer un `manifest.webmanifest` complet (icons, screenshots, theme color).
    - [x] Frontend: Gérer l'état "Offline" avec un composant `WifiOff` global.
    - [x] Frontend: Caching stratégique des assets et du catalogue produit via Service Worker.

## 🧠 PHASE 2 : Intelligence Artificielle Avancée (100% AI)
- [x] **IA Vision : Photo-to-Product**
    - [x] Backend: Route `POST /api/products/vision`.
    - [x] Backend: Prompt multimodal pour Gemini 1.5 Flash (extraction nom, prix, description, tags).
    - [x] Frontend: Dropzone d'image dans le dashboard.
    - [x] Frontend: Animation de "Scannage IA" haute fidélité.
    - [x] Frontend: Auto-remplissage intelligent du formulaire de création.
- [x] **IA Audio : Voice Commerce**
    - [x] Backend: Intégration Speech-to-Text (Whisper ou Gemini Audio) via `VoiceRecorder`.
    - [x] Backend: Analyse de l'intention dans les messages vocaux.
    - [x] Frontend: Envoi de notes vocales PTT nativement dans l'Inbox.

## 💬 PHASE 3 : Communication & Temps Réel (100% Sales)
- [x] **Inbox Live Sync**
    - [x] Backend: Route `GET /api/commerce/conversations`.
    - [x] Backend: Route `GET /api/commerce/messages/:conversationId`.
    - [x] Realtime: Émettre `new_message` via Socket.io.
    - [x] Frontend: Connecter `SalesInbox.tsx` aux données réelles (TanStack Query + Sockets).
    - [x] Frontend: Indicateur visuel "IA en train d'écrire...".
- [x] **Notifications Push Marchand**
    - [x] Backend: Setup `web-push` library (`push.service.ts`).
    - [x] Backend: Route d'abonnement push (`POST /api/commerce/push/subscribe`).
    - [x] Frontend: Demande de permission push dans les réglages (`SettingsPage.tsx`).
    - [x] Realtime: Notification "Nouvelle Vente ! 💰" ou "WhatsApp Déconnecté ⚠️".

## 💰 PHASE 4 : Moteur Commercial & Paiements (100% Revenue)
- [x] **Pipeline Money Board**
    - [x] Backend: Calculateur de métriques réelles (Revenu du jour, Taux de conversion).
    - [x] Frontend: Graphiques de performance (Revenus hebdomadaires).
    - [x] Frontend: Visualisation du tunnel de vente (Conversations -> Paiements -> Livraisons).
- [x] **Détection de Preuve de Paiement**
    - [x] Backend: IA prompt pour détecter les captures d'écran de transferts (Wave/Orange/MTN).
    - [x] Realtime: Alerte "Paiement à confirmer" et auto-validation dans l'Inbox.

## 🌟 PHASE 5 : Le "110%" (Bonus Excellence)
- [x] **Smart Caption TikTok/Insta**
    - [x] Frontend: Bouton "Générer Caption Sociale" pour chaque produit.
    - [x] AI: Génération de hashtags et accroches virales basées sur le produit.
- [x] **Mode "Human Takeover" Automatique**
    - [x] Logic: Si l'IA détecte une frustration ou une question complexe, elle envoie une notification urgente au marchand : "Reprenez la main !".
- [x] **Multi-Langues Locales (Nouchi / Wolof Subtil)**
    - [x] Prompt: Dosage élégant, naturel et subtil du style local sans caricature.
- [x] **Reporting Hebdomadaire IA**
    - [x] Backend: Tâche planifiée pour envoyer un résumé des ventes par email au marchand.

---

## ✅ Checklist Production (Finalisation)
- [ ] Build global `pnpm build` sans erreur.
- [ ] Validation des variables d'environnement de production.
- [ ] Test de montée en charge sur le WebSocket.
- [ ] Audit de sécurité des routes API (Middlewares).
