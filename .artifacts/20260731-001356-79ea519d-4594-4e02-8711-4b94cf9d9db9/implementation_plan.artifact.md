# Vendeur IA OS - Finalization & Production Implementation Plan (Target 110%)

This plan targets 110% implementation by completing all core features and adding high-value extras for production excellence.

## Proposed Changes

### 1. Backend: AI Vision & Product Intelligence
Add a specialized route for analyzing product images and generating structured data.

#### [commerce.routes.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/commerce/commerce.routes.ts)
- Add `POST /products/vision` endpoint.
- Use Gemini 1.5 Flash (Vision) to extract: Name, Price (suggested), Category, Description, and TikTok caption.

#### [commerce.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/commerce/commerce.service.ts)
- Add `analyzeProductImage` method to handle multi-modal input for Gemini.

### 2. Backend: Real-time Inbox & Conversation Management
Enable real data flow for the merchant's message center.

#### [commerce.routes.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/commerce/commerce.routes.ts)
- Add `GET /conversations` to list active sales chats.
- Add `GET /conversations/:id/messages` to fetch message history.

#### [whatsapp.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/whatsapp/whatsapp.service.ts)
- Emit `conversation:update` via Socket.io when a new message arrives.
- Handle audio messages (Voice to Text/Intent).

### 3. Frontend: AI Vision UI & Catalog Integration
Implement the "Magic Onboarding" feel for adding products.

#### [SalesDashboard.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/dashboard/SalesDashboard.tsx)
- Integrate a file uploader for the "IA Vision" button.
- Show a loading state with "AI is analyzing..." animation.
- Auto-fill the product form with AI results.

### 4. Frontend: Real-time Sales Inbox
Connect the inbox to the backend and socket events.

#### [SalesInbox.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/inbox/SalesInbox.tsx)
- Use `useQuery` to fetch conversations.
- Use `useSocket` to listen for real-time updates.
- Implement manual message sending.

### 5. PWA & Offline Support
Transform the web app into a Progressive Web App for mobile usage.

#### [NEW] [manifest.webmanifest](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/public/manifest.webmanifest)
- Define app icons, theme colors, and standalone display mode.

#### [vite.config.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/vite.config.ts)
- Integrate `vite-plugin-pwa` for service worker generation and caching strategies.

### 6. Push Notifications
Implement real-time merchant alerts for new orders and "hot leads".

#### [notifications.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/notifications/notifications.service.ts)
- Implement Web-Push or Firebase Cloud Messaging (FCM) integration.
- Store merchant push subscriptions in the database.

#### [SalesDashboard.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/dashboard/SalesDashboard.tsx)
- Add "Enable Notifications" prompt in the settings panel.

### 7. Google Authentication
Complete the missing Google SSO integration on both frontend and backend.

#### [env.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/config/env.ts)
- Add `GOOGLE_CLIENT_ID` to the Zod schema and configuration.

#### [AuthSheet.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/auth/components/AuthSheet.tsx)
- Integrate `@react-oauth/google` to trigger the one-tap or popup login.
- Send the `id_token` to the `/api/auth/google` endpoint.

### 8. Advanced "110%" Features
Going beyond basic requirements for a world-class OS.

#### [NEW] [TikTokBridge.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/products/components/TikTokBridge.tsx)
- Feature to generate viral social media captions for products using IA.

#### [whatsapp.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/whatsapp/whatsapp.service.ts)
- Enhanced "Payment Proof Detection": Use Vision to analyze image messages and flag payment screenshots.

### 9. Documentation & "Product Bible" Completion
Update the blueprint to reflect the final technical stack and "Local Intelligence" rules.

#### [vendeur-ia_product_bible.txt](file:///C:/Users/Franck/web-apps/vendeur-ia/doc/vendeur-ia_product_bible.txt)
- Add **PART 7: ADVANCED AI OPERATIONS & LOGISTICS**.
- Detail the "Local Intelligence" prompt engineering strategies.

## Verification Plan

### Automated Tests
- `pnpm test` (if applicable)
- Verify Zod schema validation for new endpoints.

### Manual Verification
1. **Product Creation**: Upload an image in the dashboard and verify the AI fills the form correctly.
2. **WhatsApp Flow**: Send a message to the connected WhatsApp number and see it appear in the Dashboard Inbox in real-time.
3. **AI Response**: Verify the AI responds according to the merchant's Knowledge Base.
4. **Order Simulation**: Verify that "converted" status can be set when a payment is discussed.
