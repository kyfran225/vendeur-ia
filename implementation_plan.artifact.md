# Harmonisation des Offres et Tarifs (Vendeur IA)

Ce plan vise à rendre cohérents les tarifs et les descriptions des offres dans toute l'application (Frontend, Backend et Documentation), en suivant les spécifications validées :
1. **Essentiel** : 5 000 XOF / mois.
2. **Pro** : 20 000 XOF / mois.
3. **Pack Pro Expert** : 45 000 XOF initial (20k Pro + 25k Installation).

## Proposed Changes

### ⚙️ Backend (`apps/api`)

#### [MODIFY] [offers.constants.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/commerce/offers.constants.ts)
- Vérifier et affiner les `features` pour correspondre exactement au focus demandé (IA autonome 24h/7, PaymentShield, etc.).

#### [MODIFY] [payment.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/services/payment.service.ts)
- Harmoniser les fallbacks de prix pour `essential` (5k), `pro` (20k) et `pack_pro` (45k si cumulé).

---

### 💻 Frontend (`apps/web`)

#### [MODIFY] [OffersModal.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/settings/components/OffersModal.tsx)
- Supprimer les valeurs hardcodées.
- Utiliser les données de l'API `/api/commerce/offers`.
- Afficher clairement les 3 options ou adapter la colonne Pro pour inclure l'option Expert (45 000 XOF).
- Corriger le label "UNIQUE" qui est trompeur pour un premier paiement d'abonnement.

#### [MODIFY] [PackProModal.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/dashboard/components/PackProModal.tsx)
- Mettre à jour le prix affiché à 45 000 XOF.
- Rediriger vers `/checkout?offer=pro&setup=EXPERT` au lieu de l'ancienne route `/api/commerce/buy-pack-pro` pour une expérience unifiée.

---

### 📄 Documentation

#### [MODIFY] [TODO.md](file:///C:/Users/Franck/web-apps/vendeur-ia/TODO.md)
- Mettre à jour les références de prix dans la roadmap.

#### [MODIFY] [ROADMAP_END_TO_END_PAYMENT_AND_PAYWALL.md](file:///C:/Users/Franck/web-apps/vendeur-ia/ROADMAP_END_TO_END_PAYMENT_AND_PAYWALL.md)
- Aligner les exemples de prix.

#### [MODIFY] [catalogue-fonctionnalites.md](file:///C:/Users/Franck/web-apps/vendeur-ia/doc/fr/product/catalogue-fonctionnalites.md)
- Mettre à jour les descriptions si nécessaire pour refléter le focus "IA autonome" et "PaymentShield".

## Verification Plan

### Automated Tests
- Vérifier que l'API `/api/commerce/offers` retourne bien les bons prix (5k et 20k).

### Manual Verification
1. Ouvrir le dashboard et vérifier le popup de bienvenue (OffersModal).
2. Vérifier que les prix correspondent aux spécifications (5k, 20k, 45k).
3. Cliquer sur "Activer mon Pack Pro" et vérifier que la page de Checkout affiche bien un total de 45 000 XOF.
4. Parcourir les réglages de facturation pour confirmer la cohérence.
