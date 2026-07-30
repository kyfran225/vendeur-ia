# 🤖 AI AGENT MANIFESTO — Vendeur IA OS

**CRITICAL: ANY AI AGENT INTERACTING WITH THIS CODEBASE MUST READ AND FOLLOW THIS MANIFESTO.**

## 🎯 The Mission
Transform WhatsApp Business into an autonomous sales machine for the African market. 
**Vendeur IA is NOT a general chatbot.** It is a specialized digital employee that:
1. Identifies products from social media content (AI Vision).
2. Closes sales via WhatsApp using local payment numbers (Wave, Orange, etc.).
3. Notifies the merchant for payment verification.

---

## 🚫 Strict Technical Rules (No Regressions)

### 1. Pure Commerce Focus
- **DO NOT** add social features, feeds, or debate modules.
- **DO NOT** import anything from the legacy MaatFeed codebase.
- Every new line of code must directly help a merchant **SELL MORE**.

### 2. Standalone Architecture
- Maintain the **Monorepo** structure (`vendeur-core`, `api`, `web`).
- Use `@vendeur-ia/core` as the single source of truth for schemas and contracts.
- **Zod** is mandatory for all data validation between API and Web.

### 3. Payment Flow (The "Local" Way)
- **Paystack** is strictly for **Merchant Subscriptions**.
- **Customer Sales** must use the merchant's configured local numbers.
- AI Agents must never hallucinate external payment links.

### 4. Mobile-First UI
- All UI components must be optimized for one-thumb usage on smartphones.
- Fast loading and offline-ready behaviors are priority #1.

---

## 🛰️ Permanent Operational Memory
Consult **[MEMORY.md](file:///C:/Users/Franck/web-apps/vendeur-ia/MEMORY.md)** before starting any task to see the current state of progress and avoid repeating work or breaking completed modules.
