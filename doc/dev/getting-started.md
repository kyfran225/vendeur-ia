# 🛠️ Getting Started (Developer Guide)

Welcome to the Vendeur IA codebase. We use a modern, high-performance stack centered around TypeScript and Turborepo.

## 📋 Prerequisites
- **Node.js**: v18+ 
- **PNPM**: v8+ (Required for workspace management)
- **MongoDB**: A running instance (local or Atlas)
- **Redis**: Required for the AI and Billing queues

## 🚀 Local Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/kyfran225/vendeur-ia.git
   cd vendeur-ia
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root and in `apps/api/` & `apps/web/`.
   Check `apps/api/src/config/env.ts` for required keys:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `PAYSTACK_SECRET_KEY`
   - `FRONTEND_URL` / `CLIENT_URL`

3. **Run in Development**
   ```bash
   pnpm dev
   ```
   - API will run on `http://localhost:5000`
   - Web will run on `http://localhost:5173`

---

## 🏗️ Project Structure

- `apps/api`: Express server, AI services, Database models.
- `apps/web`: React (Vite) application, Tailwind, Framer Motion.
- `packages/core`: Shared Zod schemas and constants.

---

## 🧪 Testing

We use **Vitest** for unit and integration tests.
```bash
# Run API tests
cd apps/api
pnpm test

# Run Web tests
cd apps/web
pnpm test
```

## 📜 Coding Standards

1. **Strict Types**: No `any`. Use `@vendeur-ia/core` for shared types.
2. **Mobile-First**: Always use Tailwind `sm:`, `md:` prefixes. Default styles must be for mobile.
3. **AI First**: Logic should be built to be observable and adjustable by the AI orchestrator.
