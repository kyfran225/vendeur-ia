# ☁️ Vendeur IA - Guide de Déploiement Cloud

Ce document détaille la procédure pour déployer **Vendeur IA OS** en production sur Render et Vercel.

---

## 🛠️ Configuration des Variables d'Environnement

Avant tout déploiement, configurez les variables suivantes sur vos plateformes cloud :

### API (Backend)
- `MONGODB_URI` : URL de votre instance MongoDB Atlas.
- `JWT_SECRET` : Une chaîne aléatoire forte.
- `PAYSTACK_SECRET_KEY` : Votre clé secrète de test ou prod Paystack.
- `GEMINI_API_KEY` or `OPENAI_API_KEY` : Pour le cerveau de l'agent.
- `CLIENT_URL` : L'URL finale de votre frontend (ex: `https://vendeur-ia.vercel.app`).

### Web (Frontend)
- `VITE_API_URL` : L'URL finale de votre API (ex: `https://vendeur-ia-api.onrender.com`).

---

## 🚀 Déploiement Backend (Render)

Render est idéal pour le backend Node.js et les Webockets.

1. **Connectez votre Repo** sur [Render.com](https://render.com).
2. **New Web Service** → Sélectionnez `vendeur-ia`.
3. **Build Command** : `pnpm install && pnpm build` (ou via le script root).
4. **Start Command** : `pnpm --filter @vendeur-ia/api start`.
5. **Root Directory** : Laissez vide (Render gère le monorepo via le packageManager).

---

## ⚡ Déploiement Frontend (Vercel)

Vercel est optimisé pour les applications React/Vite.

1. **New Project** sur [Vercel.com](https://vercel.app).
2. **Configuration de l'Environnement** :
   - Ajoutez `ENABLE_EXPERIMENTAL_COREPACK=1` dans les variables d'environnement pour supporter pnpm 10.
3. **Root Directory** : Sélectionnez `apps/web`.
4. **Build Command** : Laissé par défaut (écrasé par `vercel.json`).
5. **Output Directory** : `dist`.
6. **Framework Preset** : `Vite`.

---

## 🐳 Déploiement via Docker

Le projet inclut une configuration Docker complète pour le développement ou le déploiement on-premise.

### Lancement avec Docker Compose
```bash
docker compose up -d
```
Les services disposent de **Healthchecks** intégrés :
- L'API attend que MongoDB et Redis soient "Healthy" avant de démarrer.
- Vous pouvez vérifier l'état avec `docker compose ps`.

---

## 💾 Sauvegardes (Backups)

Le système inclut un script de backup automatique vers le cloud (Cloudinary par défaut).

### Configuration
Assurez-vous que les variables suivantes sont définies (API) :
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Exécution manuelle
```bash
pnpm db:backup
```

### Automatisation (Crontab)
Pour un backup quotidien à 3h du matin :
```bash
0 3 * * * cd /chemin/vers/projet && /usr/bin/pnpm db:backup >> /var/log/vendeur-ia-backup.log 2>&1
```

---

## 🧪 Tests E2E de Paiement (Playwright)

Pour valider que l'IA présente les bons numéros et que le tunnel d'onboarding fonctionne :

```bash
# Dans apps/web
pnpm dlx playwright install
npm run test:e2e
```

### Scénario de Test Principal :
1. Navigation sur `/`.
2. Saisie des infos business et des numéros Mobile Money.
3. Interaction avec le simulateur.
4. Détection du message AI contenant les numéros fournis.
5. Redirection vers Paystack Subscription.
