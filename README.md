# 🚀 Vendeur IA - L'Employé Numérique du Social Commerce

**Vendeur IA** est un système d'exploitation commercial (OS) autonome conçu pour transformer les conversations WhatsApp en ventes réelles. Il permet aux entrepreneurs de gérer leur catalogue, leurs clients et leurs paiements via une intelligence artificielle spécialisée dans le marché africain.

---

## 🌟 Vision
Donner à chaque petit commerçant une équipe commerciale d'élite fonctionnant 24h/24. Vendeur IA ne se contente pas de répondre ; il conseille, convainc et accompagne le client jusqu'au paiement Mobile Money.

## 🛠️ Fonctionnalités Clés

### 1. Magic Onboarding & Simulateur
Un tunnel de conversion ultra-rapide où le marchand configure son business et teste immédiatement son IA sur une interface WhatsApp simulée avant même de finaliser son inscription. Inclut désormais un système de **Spotlight Tour** pour guider les nouveaux utilisateurs.

### 2. Money Board (Dashboard)
Le centre de commande du marchand. Suivi du pipeline de vente en temps réel :
- **TikTok/Insta Discovery** → **WhatsApp Chat** → **Payment Initiated** → **Order Confirmed**.
- Métriques de revenus journaliers et performance de l'IA via **AI Growth Service**.
- Interface optimisée avec le nouveau **Vendeur IA Loader**.

### 3. Sales Inbox Intelligent & Copilot
Une messagerie centralisée pour surveiller les conversations de l'IA Sales Agent :
- **Copilot Widget** : Assistant IA intégré pour aider le marchand à gérer ses ventes.
- **Détection de Preuve de Paiement** : Alertes automatiques dès qu'un client confirme un transfert.
- **Human Takeover** : Possibilité pour le marchand de reprendre la main instantanément.
- **Intégration WhatsApp Avancée** : Nouveau service de statut WhatsApp et gestion des sessions améliorée.
- **Canaux de Paiement Locaux** : Gestion native de Wave, Orange Money, MTN, Moov et Visa.

### 4. Catalogue & Order Management
Gestionnaire de produits et commandes boosté par l'IA :
- **AI Vision** : Prenez une photo, et l'IA génère la fiche produit.
- **Order Manager** : Suivi précis des commandes et des statuts de livraison.
- **Product Manager** : Interface d'édition fluide pour le catalogue.

### 5. Cerveau IA (Knowledge Base)
Enseignez les spécificités de votre boutique à votre agent :
- Zones et frais de livraison.
- FAQ personnalisée.
- Ton de voix (Amical, Professionnel, Premium, Dynamique).

---

## 🏗️ Architecture Technique

Projet construit **from scratch** en architecture Monorepo (Turborepo) pour une propreté et une performance maximales :

- **`@vendeur-ia/core`** : Contrats de données et validation (Zod).
- **`@vendeur-ia/api`** : Backend Node/Express (Brain, AI Orchestration, Paystack Subscriptions).
- **`@vendeur-ia/web`** : Interface React moderne et mobile-first (Vite, Tailwind, Framer Motion).

## 🚀 Installation & Build

Le projet utilise `pnpm` pour une gestion optimale des workspaces.

```bash
# Installer les dépendances
pnpm install

# Lancer le build global (Core, API, Web)
pnpm build

# Lancer en mode développement
pnpm dev
```

---

## 💳 Système de Paiement
- **Abonnement Marchand** : Intégration Paystack (5.000 FCFA/mois).
- **Ventes Clients** : Utilisation directe des numéros Mobile Money du marchand configurés dans l'OS.

---

## 📄 Licence & Propriété
**Vendeur IA** - Créé par **Franck Corp**. Tous droits réservés.
"Votre WhatsApp vend pendant que vous dormez."
