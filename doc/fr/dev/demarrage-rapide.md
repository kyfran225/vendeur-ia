# 🛠️ Guide de Démarrage (Développeur)

Bienvenue dans le codebase de Vendeur IA. Nous utilisons une stack moderne et performante centrée sur TypeScript et Turborepo.

## 📋 Prérequis
- **Node.js** : v18+ 
- **PNPM** : v8+ (Requis pour la gestion du workspace)
- **MongoDB** : Une instance en cours d'exécution (locale ou Atlas)
- **Redis** : Requis pour les files d'attente IA et Facturation

## 🚀 Setup Local

1. **Cloner et Installer**
   ```bash
   git clone https://github.com/kyfran225/vendeur-ia.git
   cd vendeur-ia
   pnpm install
   ```

2. **Variables d'Environnement**
   Créez un fichier `.env` à la racine et dans `apps/api/` & `apps/web/`.
   Vérifiez `apps/api/src/config/env.ts` pour les clés requises :
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `FRONTEND_URL` / `CLIENT_URL`

3. **Lancer en Développement**
   ```bash
   pnpm dev
   ```
   - L'API tournera sur `http://localhost:5000`
   - Le Web tournera sur `http://localhost:5173`

---

## 🏗️ Structure du Projet

- `apps/api` : Serveur Express, services IA, modèles de base de données.
- `apps/web` : Application React (Vite), Tailwind, Framer Motion.
- `packages/core` : Schémas Zod et constantes partagés.

---

## 🧪 Tests

Nous utilisons **Vitest** pour les tests unitaires et d'intégration.
```bash
# Lancer les tests API
cd apps/api
pnpm test

# Lancer les tests Web
cd apps/web
pnpm test
```

## 📜 Standards de Code

1. **Types Stricts** : Pas de `any`. Utilisez `@vendeur-ia/core` pour les types partagés.
2. **Mobile-First** : Utilisez toujours les préfixes Tailwind `sm:`, `md:`. Les styles par défaut doivent être pour mobile.
3. **IA First** : La logique doit être construite pour être observable et ajustable par l'orchestrateur IA.
