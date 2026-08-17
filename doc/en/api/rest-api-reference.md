# 🌐 REST API Reference

The Vendeur IA API is built with Node.js/Express and uses Zod for strict request validation.

## 🔑 Authentication
Most routes require a Bearer JWT Token.
- **Header**: `Authorization: Bearer <jwt_token>`
- **Auth Endpoint**: `/api/auth/google` (Google OAuth exchange).

---

## 🛍️ Commerce Module (`/api/commerce`)

### Products
- `GET /products`: List merchant products.
- `POST /products/vision`: Multi-modal image analysis for product creation.
- `PATCH /products/:id`: Update product details/stock.
- `POST /products/:id/caption`: Generate marketing copy via AI.

### Orders
- `GET /orders`: List sales with filters (7d, 30d, status).
- `POST /orders`: Create a manual order.
- `POST /orders/:id/verify-payment`: Trigger Payment Shield analysis on a receipt.
- `POST /orders/:id/dispatch`: Generate delivery instructions for a courier.

### Analytics
- `GET /metrics/growth`: Retrieve AI productivity and revenue metrics.

---

## 💬 Communication Module (`/api/whatsapp`)

- `GET /status`: Current connection state (CONNECTED, INITIALIZING, DISCONNECTED).
- `GET /qr`: Retrieve the latest QR code for pairing.
- `POST /logout`: Terminate the current session.
- `POST /conversations/:id/fast-pay`: Send a stylized Mobile Money request.
- `POST /conversations/:id/voice`: Handle voice memo recording and transcription.

---

## 🤖 Copilot Module (`/api/copilot`)

- `POST /chat`: Interact with the Merchant Assistant (Copilot).
- `POST /tickets`: Open a support ticket to the founders.

---

## 📡 Webhooks

- **Paystack**: `/api/payments/webhook/paystack` (Subscription renewals).
- **WhatsApp (Meta)**: `/api/whatsapp/webhook` (Message incoming).
