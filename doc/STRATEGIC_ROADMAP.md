# 🗺️ Feuille de Route Stratégique - Système de Facturation

## ✅ Phase 1 : Visibilité Financière (Terminé)
- Dashboard Admin Finance opérationnel.
- Suivi du MRR et des transactions réelles.
- Historique des revenus sur 6 mois.

## ✅ Phase 2 : Automatisation des Revenus (Terminé)
- **Abonnements Récurrents** : Transition vers les "Plans" Paystack (Premium & Business).
- **Sécurisation des Webhooks** : Validation stricte des signatures HMAC.
- **Gestion des Échecs** : Webhook `invoice.payment_failed` géré avec alerte automatique sur WhatsApp.
- **Self-Service Marchand** : Interface Billing permettant de voir la date de prochain prélèvement et d'annuler le renouvellement automatique.

## 🚀 Phase 3 : Optimisation & Mise à l'Échelle (Prochaines Étapes)
- **Test de Charge Réel** : Simulation de 1000+ renouvellements simultanés sur BullMQ.
- **Reporting Avancé** : Export PDF des factures pour les marchands.
- **Multi-Devises** : Support natif du GHS (Ghana) et NGN (Nigeria) avec tarification dynamique.
