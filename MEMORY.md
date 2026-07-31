# Vendeur IA OS — Project Memory

## 🎯 Core Mission
Vendeur IA OS is a production-ready "Sales Machine" that transforms TikTok, Instagram, and WhatsApp catalogues into automated selling systems. It handles customer inquiries, product advice, delivery logistics, and payment verification 24/7 using advanced AI.

## 🏗️ Technical Architecture
- **Monorepo Structure**: Managed via `pnpm` and `turbo`.
    - `apps/api`: Express.js backend with Mongoose/MongoDB.
    - `apps/web`: React.js (Vite) frontend with Tailwind CSS.
    - `packages/vendeur-core`: Shared Zod schemas and constants.
- **Real-time Layer**: `Socket.io` for live WhatsApp QR generation and dashboard updates.
- **Security**: "Passport" system with JWT (Access + Refresh tokens) and Google SSO support.

## 🤖 AI Sales Engine
- **Expert Principal Persona**: A strategic prompt that adapts the AI's tone based on customer location (Local vs. International) and business category.
- **Multi-Model Support**: Connected to Gemini (Primary), with fallback logic for Groq/OpenAI.
- **Knowledge Base**: Automated generation of business rules (delivery zones, opening hours, payment methods) upon merchant creation.

## 📱 WhatsApp Integration
- **Direct Phone Link**: Powered by `@whiskeysockets/baileys` (QR Code scan).
- **Automation**: Automatic persistence of customers, conversations, and messages.
- **Meta Ready**: Webhook structure in place for Meta Cloud API scaling.

## 💰 SaaS Ecosystem
- **Monetization**: Paystack integration for the "Studio IA Premium" plan (5.000 FCFA / Month).
- **Money Board**: Real-time sales dashboard with pipeline visualization (Conversations -> Payments -> Orders).
- **Inventory Pro**: Full product CRUD with IA Vision UI (image-to-product mapping).

## 🎨 Design Language
- **Theme**: "Emerald & Coal" (Dark emerald tones, high contrast, heavy typography).
- **UI/UX Standard**: "Logic-Perfect" and "Zero UI Morte" as per `PROTOCOL.md`.
- **Key Components**: Mapbox Address Autocomplete, Flag-based Country Selector, Iconic Payment Method Selector.

## 📍 Current Status (Production Ready)
- Backend services are fully защищены (protected) via `authenticate` middleware.
- Onboarding flow transitions perfectly from Demo Simulator to real Merchant Account.
- High-fidelity Dashboard is connected to real database metrics.

*Last Updated: 2026-07-31*
