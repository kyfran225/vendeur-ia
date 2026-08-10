# Rapport de Migration : Refonte Commerciale & WhatsApp

## Architecture des Données
- **Modèle `Offer`** : Centralise les prix (5 000 XOF Essentiel / 20 000 XOF Pro) et les fonctionnalités.
- **Modèle `Subscription`** : Gère les états commerciaux (`active`, `past_due`, `cancelled`) indépendamment de la technique.
- **Modèle `WhatsAppConnection`** : Gère l'état technique (`CONNECTED`, `DISCONNECTED`) sans impact sur la facturation.

## Changements API
- Nouveau service `CommerceService` avec support du checkout unifié.
- Webhook Paystack refondu avec **Idempotence** (vérification systématique de la référence transaction).
- Support des frais d'installation Expert (25 000 XOF).

## Parcours Utilisateur
- **/offers** : Page de choix simplifiée (Essentiel vs Pro).
- **/checkout** : Récapitulatif financier clair.
- **/activation** : Page de progression en 4 étapes (Offre -> Paiement -> WhatsApp -> Prêt).

## Sécurité
- Clé secrète Paystack uniquement côté serveur.
- Validation des signatures de webhook.

## Migration
- Script `seed-offers.ts` exécuté pour initialiser les produits commerciaux.
- Les anciens champs `merchant.subscription` sont conservés en mode lecture seule pour la rétrocompatibilité temporaire.
