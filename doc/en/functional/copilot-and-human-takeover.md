# 🤝 AI Copilot & Human Takeover - Vendeur IA OS

This document explains how the merchant-facing AI Copilot operates and how hybrid Human-AI collaboration is handled.

---

## 🧠 1. The Role of the AI Copilot

The **AI Copilot** acts as a 24/7 proactive store manager inside the merchant's web dashboard. Powered by Google Gemini, it continuously evaluates:
- Inventory levels and low-stock alerts.
- High-intent active conversations requiring merchant attention.
- Pending payment proofs flagged for manual review.
- Business performance analytics and actionable insights.

---

## ⚡ 2. Actionable Recommendations

The Copilot provides **interactive one-click action buttons** rather than static text:

```json
{
  "message": "You have 3 orders ready for dispatch in Abidjan (Cocody).",
  "actions": [
    {
      "type": "navigate",
      "label": "View Pending Deliveries",
      "payload": "/dashboard/orders?status=confirmed"
    },
    {
      "type": "modal",
      "label": "Print Delivery Slips",
      "payload": "EXPORT_DELIVERY_SLIPS"
    }
  ]
}
```

---

## 🔀 3. Hybrid Collaboration Matrix

| Mode | Responsible Entity | Best Use Case |
| :--- | :--- | :--- |
| **Autonomous AI** | Gemini Agent | 24/7 automated FAQs, catalog browsing, standard orders, and payment verification. |
| **Copilot Assisted** | Merchant + AI Suggestions | Custom price negotiations, bulk inquiries, VIP client requests. |
| **Full Human Control** | Merchant only | Customer disputes, sensitive inquiries, or private messages. |
