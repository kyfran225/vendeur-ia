# 🚀 VENDEUR IA OS — Ultra-Detailed Implementation Roadmap (110%)

Ce document trace la route vers une version production "Over-Delivered".

## 🏗️ PHASE 1 : Fondations & Sécurité (100% Core)
- [ ] **Google Auth Full Integration**
    - [ ] Backend: Valider `GOOGLE_CLIENT_ID` dans `env.ts`.
    - [ ] Backend: Finaliser `auth.service.ts` pour mapper correctement les profils Google.
    - [ ] Frontend: Installer `@react-oauth/google`.
    - [ ] Frontend: Configurer `GoogleOAuthProvider` dans `App.tsx`.
    - [ ] Frontend: Remplacer le mock dans `AuthSheet.tsx` par le vrai bouton Google Login.
- [ ] **PWA & Offline-First**
    - [ ] Frontend: Configurer `vite-plugin-pwa` avec `registerType: 'autoUpdate'`.
    - [ ] Frontend: Créer un `manifest.webmanifest` complet (icons, screenshots, theme color).
    - [ ] Frontend: Gérer l'état "Offline" avec un composant `WifiOff` global.
    - [ ] Frontend: Caching stratégique des assets et du catalogue produit via Service Worker.

## 🧠 PHASE 2 : Intelligence Artificielle Avancée (100% AI)
- [ ] **IA Vision : Photo-to-Product**
    - [ ] Backend: Route `POST /api/products/vision`.
    - [ ] Backend: Prompt multimodal pour Gemini 1.5 Flash (extraction nom, prix, description, tags).
    - [ ] Frontend: Dropzone d'image dans le dashboard.
    - [ ] Frontend: Animation de "Scannage IA" haute fidélité.
    - [ ] Frontend: Auto-remplissage intelligent du formulaire de création.
- [ ] **IA Audio : Voice Commerce**
    - [ ] Backend: Intégration Speech-to-Text (Whisper ou Gemini Audio).
    - [ ] Backend: Analyse de l'intention dans les messages vocaux.
    - [ ] Backend: Synthèse vocale (TTS) pour les réponses IA (optionnel V1.1).

## 💬 PHASE 3 : Communication & Temps Réel (100% Sales)
- [ ] **Inbox Live Sync**
    - [ ] Backend: Route `GET /api/commerce/conversations`.
    - [ ] Backend: Route `GET /api/commerce/messages/:conversationId`.
    - [ ] Realtime: Émettre `new_message` via Socket.io.
    - [ ] Frontend: Connecter `SalesInbox.tsx` aux données réelles (TanStack Query + Sockets).
    - [ ] Frontend: Indicateur visuel "IA en train d'écrire...".
- [ ] **Notifications Push Marchand**
    - [ ] Backend: Setup `web-push` library.
    - [ ] Backend: Route d'abonnement push.
    - [ ] Frontend: Demande de permission push dans les réglages.
    - [ ] Realtime: Notification "Nouvelle Vente ! 💰" ou "Client Urgent 🔥".

## 💰 PHASE 4 : Moteur Commercial & Paiements (100% Revenue)
- [ ] **Pipeline Money Board**
    - [ ] Backend: Calculateur de métriques réelles (Revenu du jour, Taux de conversion).
    - [ ] Frontend: Graphiques de performance (Revenus hebdomadaires).
    - [ ] Frontend: Visualisation du tunnel de vente (Conversations -> Paiements -> Livraisons).
- [ ] **Détection de Preuve de Paiement**
    - [ ] Backend: IA prompt pour détecter les captures d'écran de transferts (Wave/Orange).
    - [ ] Realtime: Alerte "Paiement à confirmer" pour le marchand.

## 🌟 PHASE 5 : Le "110%" (Bonus Excellence)
- [ ] **Smart Caption TikTok/Insta**
    - [ ] Frontend: Bouton "Générer Caption Sociale" pour chaque produit.
    - [ ] AI: Génération de hashtags et accroches virales basées sur le produit.
- [ ] **Mode "Human Takeover" Automatique**
    - [ ] Logic: Si l'IA détecte une frustration ou une question complexe, elle envoie une notification urgente au marchand : "Reprenez la main !".
- [ ] **Multi-Langues Locales**
    - [ ] Prompt: Support explicite du Nouchi (argot ivoirien) et du Wolof.
- [ ] **Reporting Hebdomadaire IA**
    - [ ] Backend: Tâche planifiée pour envoyer un résumé des ventes par email au marchand.

---

## ✅ Checklist Production (Finalisation)
- [ ] Build global `pnpm build` sans erreur.
- [ ] Validation des variables d'environnement de production.
- [ ] Test de montée en charge sur le WebSocket.
- [ ] Audit de sécurité des routes API (Middlewares).
