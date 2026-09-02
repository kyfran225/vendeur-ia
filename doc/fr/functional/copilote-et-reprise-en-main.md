# 🤝 Copilote IA & Reprise en Main Marchand - Vendeur IA OS

Ce document présente le fonctionnement du Copilote IA intégré au tableau de bord marchand et la logique de collaboration hybride Humain-IA.

---

## 🧠 1. Le Rôle du Copilote Marchand

Le **Copilote IA** agit comme un conseiller stratégique et opérationnel en temps réel pour le marchand. Il s'appuie sur le modèle de langage Gemini pour analyser en permanence :
- L'état des stocks et les ruptures imminentes.
- Les conversations en cours nécessitant une attention commerciale urgente.
- Les reçus de paiement en attente d'arbitrage.
- Les statistiques de vente et recommandations de réapprovisionnement.

---

## ⚡ 2. Actions Suggérées Intelligentes

Le Copilote ne se contente pas de répondre à des questions ; il propose des **boutons d'action clairs** exécutables immédiatement depuis l'interface :

```json
{
  "message": "Vous avez 3 commandes en attente de livraison pour la commune de Cocody.",
  "actions": [
    {
      "type": "navigate",
      "label": "Voir les commandes à livrer",
      "payload": "/dashboard/orders?status=confirmed"
    },
    {
      "type": "modal",
      "label": "Générer les bordereaux de livraison",
      "payload": "EXPORT_DELIVERY_SLIPS"
    }
  ]
}
```

---

## 🔀 3. Collaboration Hybride Humain / IA

| Mode | Responsable de la Réponse | Cas d'Usage |
| :--- | :--- | :--- |
| **IA Autonome** | Agent Gemini | Réponses standard 24/7, présentation du catalogue, prise de commande, encaissement. |
| **Copilote Assisté** | Marchand avec suggestions IA | Négociations spécifiques, gros volumes, commandes sur-mesure. |
| **Humain Exclusif** | Marchand seul | Litiges clients, réclamations sensibles, échanges privés. |
