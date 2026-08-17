# 🌐 Référence de l'API REST

L'API de Vendeur IA est construite avec Node.js/Express et utilise Zod pour une validation stricte des requêtes.

## 🔑 Authentification
La plupart des routes nécessitent un Token JWT Bearer.
- **Header** : `Authorization: Bearer <jwt_token>`
- **Endpoint Auth** : `/api/auth/google` (Échange OAuth Google).

---

## 🛍️ Module Commerce (`/api/commerce`)

### Produits
- `GET /products` : Liste des produits du marchand.
- `POST /products/vision` : Analyse d'image multi-modale pour la création de produit.
- `PATCH /products/:id` : Mise à jour des détails/stock du produit.
- `POST /products/:id/caption` : Génération de texte marketing via IA.

### Commandes
- `GET /orders` : Liste des ventes avec filtres (7j, 30j, statut).
- `POST /orders` : Création d'une commande manuelle.
- `POST /orders/:id/verify-payment` : Déclenche l'analyse Payment Shield sur un reçu.
- `POST /orders/:id/dispatch` : Génère les instructions de livraison pour un coursier.

### Analyses
- `GET /metrics/growth` : Récupère les métriques de productivité et de revenus de l'IA.

---

## 💬 Module Communication (`/api/whatsapp`)

- `GET /status` : État actuel de la connexion (CONNECTED, INITIALIZING, DISCONNECTED).
- `GET /qr` : Récupère le dernier code QR pour l'appairage.
- `POST /logout` : Termine la session actuelle.
- `POST /conversations/:id/fast-pay` : Envoie une demande de paiement Mobile Money stylisée.
- `POST /conversations/:id/voice` : Gère l'enregistrement et la transcription de note vocale.

---

## 🤖 Module Copilot (`/api/copilot`)

- `POST /chat` : Interagir avec l'Assistant Marchand (Copilot).
- `POST /tickets` : Ouvrir un ticket de support aux fondateurs.

---

## 📡 Webhooks

- **Paystack** : `/api/payments/webhook/paystack` (Renouvellements d'abonnement).
- **WhatsApp (Meta)** : `/api/whatsapp/webhook` (Message entrant).
