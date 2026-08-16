# 🚀 Vendeur IA - L'Employé Numérique du Social Commerce

**Vendeur IA** est un système d'exploitation commercial (OS) autonome conçu pour transformer les conversations WhatsApp en ventes réelles. Il permet aux entrepreneurs de gérer leur catalogue, leurs clients et leurs paiements via une intelligence artificielle spécialisée dans le marché africain.

---

## 🌟 Vision
Donner à chaque petit commerçant une équipe commerciale d'élite fonctionnant 24h/24. Vendeur IA ne se contente pas de répondre ; il conseille, convainc et accompagne le client jusqu'au paiement Mobile Money.

## 🛠️ Fonctionnalités Clés

### 1. Magic Onboarding & Expérience Guidée
Un tunnel de conversion ultra-rapide où le marchand configure son business et teste immédiatement son IA sur une interface WhatsApp simulée.
- **Spotlight Tour** : Visite guidée interactive lors de la première connexion.
- **Setup Completion Modal** : Parcours d'activation structuré pour un démarrage sans friction.

### 2. Money Board (Dashboard) & Copilot
Le centre de commande du marchand. Suivi du pipeline de vente en temps réel :
- **Copilote IA Intelligent** : Widget flottant contextuel qui guide le marchand, suggère des actions (encaisser, livrer, auditer) et répond vocalement.
- **Audit de Boutique** : Analyse automatique de la configuration pour maximiser les ventes.
- **Métriques & AI Growth** : Suivi des revenus journaliers et performance de conversion.

### 3. Sales Inbox & Payment Shield
Une messagerie centralisée synchronisée avec WhatsApp :
- **Payment Shield (OCR Antifraude)** : Analyse médico-légale des captures Mobile Money (Wave, Orange, MTN) pour valider automatiquement les commandes et prévenir les falsifications.
- **Fast Pay** : Génération de demandes de paiement Mobile Money stylisées en 1 clic.
- **Voice Memo** : Enregistrement et envoi de notes vocales directement depuis l'interface web.

### 4. Catalogue & Storefront Branding
- **AI Vision** : Création automatique de fiches produits par simple photo de rayon.
- **Studio de Marque** : Personnalisation complète des couleurs (Émeraude, Or, Cyber Indigo), du logo et des bannières d'annonce.
- **Instant Studio V2** : Générateur d'affiches promo haute définition optimisées pour le statut WhatsApp.
- **Boutique Publique** : Vitrine web élégante avec panier intelligent, recherche vocale et stories interactives.

---

## 🏗️ Architecture Technique

Projet construit en architecture Monorepo (Turborepo) pour une modularité totale :

- **`@vendeur-ia/core`** : Contrats de données, schémas de validation et constantes partagées.
- **`@vendeur-ia/api`** : Cerveau du système (Node/Express), orchestration IA multimodale, intégration Paystack.
- **`@vendeur-ia/web`** : Interface React ultra-rapide (Vite, Tailwind, Framer Motion), mobile-first et installable (PWA).
- **Automation Git IA** : Outils de productivité intégrés pour des déploiements sûrs et documentés par IA.

## 🚀 Installation & Build

```bash
# Installer les dépendances
pnpm install

# Lancer le build global (Core, API, Web)
pnpm build

# Lancer en mode développement
pnpm dev
```

---

## 📄 Licence & Propriété
**Vendeur IA** - Créé par **Franck Corp**. Tous droits réservés.
"Votre WhatsApp vend pendant que vous dormez."
