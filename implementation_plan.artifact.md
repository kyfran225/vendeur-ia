# Correction de la conversion des tarifs lors du changement de devise

L'utilisateur a signalé que lors du changement de la devise du catalogue, les montants des tarifs dans les réglages (frais de livraison) n'ont pas été convertis, bien que le libellé de la devise ait changé.

## Analyse du problème

1.  **Conflit Frontend/Backend** : Dans `SettingsPage.tsx`, lors de la sauvegarde des réglages, le frontend envoie deux requêtes consécutives :
    - `PATCH /api/commerce/merchant` : Met à jour la devise. Le serveur effectue alors une conversion automatique des produits et des frais de livraison en base de données.
    - `PATCH /api/commerce/knowledge` : Envoie les données de connaissance, y compris les `deliveryFees` du state local. Ces valeurs sont encore les anciennes (non converties) et écrasent donc la conversion faite par le serveur juste avant.
2.  **Conversions manquantes** : Le serveur ne convertit actuellement que les produits et les frais de livraison. Le chiffre d'affaires généré dans les campagnes marketing (`MarketingCampaignModel.revenueGenerated`) n'est pas converti, ce qui fausse les statistiques après un changement de devise.

## Propositions de changements

### Frontend

#### [MODIFY] [SettingsPage.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/settings/SettingsPage.tsx)
- Modifier la validation du changement de devise pour convertir localement les `deliveryFees` dans le state React.
- Cela garantit que lorsque la requête `PATCH /api/commerce/knowledge` est envoyée, elle contient les nouveaux tarifs convertis.

### Backend

#### [MODIFY] [commerce.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/commerce/commerce.service.ts)
- Ajouter la conversion de `revenueGenerated` dans `MarketingCampaignModel` lors d'un changement de devise du marchand.
- Vérifier s'il y a d'autres champs de montants à convertir.

## Plan de vérification

### Tests Manuels
1.  Aller dans Réglages > Boutique.
2.  Noter un frais de livraison (ex: 1000 XOF).
3.  Changer la devise en EUR.
4.  Vérifier que le modal de confirmation affiche bien la conversion.
5.  Confirmer et Sauvegarder.
6.  Vérifier que le tarif de livraison dans le champ est maintenant ~1.52 EUR (et non plus 1000 EUR).
7.  Vérifier que les produits dans le catalogue sont aussi convertis.
8.  Vérifier les statistiques de campagne marketing si possible.
