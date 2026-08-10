# VENDEUR IA
# OFFER, CHECKOUT, SUBSCRIPTION & WHATSAPP CONNECTION SYSTEM
## Product & UX Implementation Specification

VERSION: 1.0
STATUS: IMPLEMENTATION READY

---

# 0. MISSION

Refondre complètement le système d'offres, de paiement, d'abonnement et de connexion WhatsApp de Vendeur IA.

Le système actuel crée de la confusion parce qu'il mélange :

- les offres commerciales ;
- les méthodes techniques de connexion WhatsApp ;
- les services d'installation ;
- les abonnements ;
- les choix d'activation ;
- le paiement.

Cette architecture doit être remplacée par un parcours extrêmement simple.

OBJECTIF PRINCIPAL :

> Un commerçant non technique doit pouvoir comprendre ce qu'il achète en quelques secondes, choisir une seule fois, payer sans ambiguïté, connecter WhatsApp et comprendre immédiatement que son vendeur IA est opérationnel.

Le produit doit donner l'impression d'un service simple, pas d'un panneau de configuration technique.

---

# 1. PRINCIPES NON NÉGOCIABLES

## 1.1 UN CHOIX = UNE DÉCISION

Lorsqu'un utilisateur choisit une offre, il ne doit jamais être invité immédiatement à refaire un choix qui aurait dû être présenté avant.

INTERDIT :

Offre
→ clic
→ modal
→ autre choix
→ autre modal
→ paiement

AUTORISÉ :

Offres
→ choisir une offre
→ récapitulatif
→ paiement
→ activation

---

## 1.2 NE JAMAIS EXPOSER LA COMPLEXITÉ TECHNIQUE AU COMMERÇANT

Ne pas présenter dans l'interface commerciale :

- API Meta Cloud
- serveur partagé
- webhook
- session WhatsApp
- infrastructure
- QR authentication
- Cloud API
- configuration technique
- architecture multi-agent
- backend
- instance
- worker
- socket
- token

Ces informations peuvent exister dans le système et dans l'administration.

Elles ne doivent pas constituer le vocabulaire principal du vendeur.

Le commerçant veut savoir :

- ce qu'il obtient ;
- combien il paie ;
- quand il paie ;
- si WhatsApp fonctionne ;
- comment modifier son offre.

---

# 2. MODÈLE MENTAL DU PRODUIT

Le système doit séparer conceptuellement quatre éléments.

## A. OFFER

Ce que le client achète.

Exemples :

- Essentiel
- Pro

## B. SUBSCRIPTION

La relation commerciale entre le client et Vendeur IA.

Exemples d'états :

- active
- pending
- past_due
- scheduled_change
- cancelled
- expired

## C. WHATSAPP CONNECTION

L'état technique de la connexion WhatsApp.

Exemples :

- not_connected
- connecting
- connected
- disconnected
- error

## D. ONBOARDING SERVICE

Un éventuel service d'installation humaine.

Exemple :

- Installation Pro Expert
- 25 000 XOF
- paiement unique

IMPORTANT :

Une installation ne doit PAS être considérée comme une offre d'abonnement.

---

# 3. ARCHITECTURE COMMERCIALE RECOMMANDÉE

Ne plus utiliser :

- Mode Express
- Mode Pro
- Mode Manuel
- Pack Pro clé en main

comme s'ils étaient tous au même niveau.

Utiliser une structure commerciale claire :

---

## OFFRE 1 : ESSENTIEL

Titre :

Vendeur IA Essentiel

Sous-titre :

Votre vendeur IA pour WhatsApp.

Description courte :

Un vendeur IA qui répond à vos clients, présente vos produits et vous aide à vendre automatiquement.

Fonctionnalités :

- Réponses automatiques
- Catalogue produits
- Compréhension des questions clients
- Présentation des produits
- Assistance commerciale
- Disponibilité 24h/24
- Utilisation avec WhatsApp

Prix :

ESSENTIAL_MONTHLY_PRICE

Exemple actuel :

5 000 XOF / mois

CTA :

COMMENCER

---

## OFFRE 2 : PRO

Titre :

Vendeur IA Pro

Sous-titre :

Pour les vendeurs qui veulent une expérience plus avancée.

Fonctionnalités exactes :

À définir selon les capacités réelles du produit.

Exemples possibles :

- Tout Essentiel
- Connexion professionnelle
- fonctionnalités avancées
- multi-agents
- meilleure capacité
- support prioritaire
- accompagnement

Prix :

PRO_MONTHLY_PRICE

IMPORTANT :

NE PAS inventer de fonctionnalités qui ne sont pas réellement disponibles dans le produit.

Le codeur doit vérifier le code existant et utiliser uniquement les fonctionnalités réellement implémentées.

CTA :

CHOISIR PRO

---

# 4. SERVICE D'INSTALLATION PRO

Le service d'installation doit être présenté séparément.

Titre :

Installation Pro Expert

Prix :

25 000 XOF

Type :

PAIEMENT UNIQUE

Description :

Nous configurons votre Vendeur IA pour vous et vous accompagnons jusqu'à sa mise en service.

Inclut actuellement :

- Création / configuration de l'environnement nécessaire
- Configuration WhatsApp
- Import initial du catalogue
- Configuration du vendeur IA
- Formation
- Accompagnement

IMPORTANT :

Ce service ne doit PAS apparaître comme une troisième formule d'abonnement.

Il doit être présenté comme un service complémentaire.

---

# 5. RÈGLE DE PRICING

Toutes les valeurs tarifaires doivent être configurables côté backend/configuration.

NE PAS hardcoder les prix dans plusieurs composants frontend.

Créer une source unique de vérité.

Exemple conceptuel :

OFFERS = {
  essential: {
    monthlyPrice: 5000,
    currency: "XOF"
  },

  pro: {
    monthlyPrice: PRO_MONTHLY_PRICE,
    currency: "XOF"
  },

  proExpertSetup: {
    oneTimePrice: 25000,
    currency: "XOF"
  }
}

Le frontend doit récupérer les données d'offre depuis une source centralisée.

---

# 6. PAGE DES OFFRES

La page des offres doit répondre à une seule question :

> "Quelle formule me convient ?"

Elle ne doit PAS demander :

> "Comment voulez-vous connecter WhatsApp ?"

---

## STRUCTURE

Titre :

Choisissez votre Vendeur IA

Sous-titre :

Commencez simplement. Vous pourrez changer d'offre plus tard.

---

## CARTE ESSENTIEL

Vendeur IA Essentiel

Votre vendeur IA pour WhatsApp.

✓ Réponses automatiques
✓ Catalogue IA
✓ Assistance commerciale
✓ Disponible 24h/24

5 000 XOF / mois

[ COMMENCER ]

---

## CARTE PRO

Vendeur IA Pro

Pour aller plus loin.

✓ Tout Essentiel
✓ Fonctionnalités avancées
✓ Support prioritaire
✓ Options professionnelles

PRO_MONTHLY_PRICE XOF / mois

[ CHOISIR PRO ]

---

## SERVICE OPTIONNEL

Besoin que nous installions tout pour vous ?

Installation Pro Expert

25 000 XOF, une seule fois.

[ EN SAVOIR PLUS ]

IMPORTANT :

Le service d'installation ne doit pas être présenté comme une troisième formule concurrente aux abonnements.

---

# 7. PAGE DE COMPARAISON

Une page de comparaison peut être utilisée si nécessaire.

Elle doit rester très simple.

Exemple :

| Fonction | Essentiel | Pro |
|---|---|---|
| Vendeur IA WhatsApp | ✓ | ✓ |
| Catalogue IA | ✓ | ✓ |
| Réponses automatiques | ✓ | ✓ |
| Fonctionnalités avancées | — | ✓ |
| Support prioritaire | — | ✓ |

Ne pas créer un tableau de 30 lignes.

Maximum recommandé :

8 à 10 différences réellement importantes.

---

# 8. CTA ET NAVIGATION

Chaque offre possède UN CTA principal.

ESSENTIEL :

[ COMMENCER ]

PRO :

[ CHOISIR PRO ]

Ne pas utiliser :

- Débloquer
- Activer
- Continuer
- Configurer
- Choisir une méthode

simultanément.

Le CTA doit indiquer l'action.

---

# 9. PARCOURS D'ACHAT

## ÉTAPE 1

Utilisateur consulte les offres.

↓

## ÉTAPE 2

Utilisateur clique :

COMMENCER

ou

CHOISIR PRO

↓

## ÉTAPE 3

Afficher un récapitulatif de l'offre.

PAS DE DEUXIÈME CHOIX DE FORMULE.

---

# 10. PAGE RÉCAPITULATIVE

Titre :

Votre offre

Exemple :

Vendeur IA Essentiel

5 000 XOF / mois

---

Ce qui est inclus :

✓ Vendeur IA WhatsApp
✓ Catalogue IA
✓ Réponses automatiques
✓ Assistance commerciale

---

Total aujourd'hui :

5 000 XOF

---

Si une installation supplémentaire est nécessaire :

Installation Pro Expert
25 000 XOF
Paiement unique

Cette ligne ne doit apparaître QUE si l'utilisateur l'a réellement sélectionnée ou si l'offre nécessite cette installation.

---

CTA :

[ PAYER ET CONTINUER ]

---

# 11. IMPORTANT : PAS DE MODAL COMMERCIAL APRÈS LE CHOIX

Une fois l'offre choisie :

NE PAS afficher :

"Choisissez votre méthode d'activation"

NE PAS afficher :

"Mode Express / Mode Pro"

NE PAS redemander :

"Quel type de connexion souhaitez-vous ?"

Le choix de l'offre est déjà effectué.

Le prochain objectif est le paiement.

---

# 12. PAIEMENT

Le système doit utiliser Paystack.

Le backend doit initialiser la transaction.

Le frontend ne doit jamais posséder la clé secrète Paystack.

La clé secrète doit rester exclusivement côté backend.

---

# 13. MOYENS DE PAIEMENT

Le checkout doit permettre les moyens de paiement réellement disponibles pour le compte Paystack et le pays concerné.

Pour la Côte d'Ivoire, prévoir notamment :

- Wave
- Orange Money
- MTN Mobile Money
- Carte bancaire

Ne pas afficher un moyen de paiement s'il n'est pas disponible pour la configuration Paystack actuellement active.

---

# 14. PAIEMENT MOBILE MONEY

IMPORTANT :

Ne jamais considérer que le paiement est terminé uniquement parce que l'utilisateur revient dans l'application.

Un paiement Mobile Money peut nécessiter une confirmation asynchrone.

Le statut définitif doit être confirmé côté backend.

---

# 15. ÉTATS DE PAIEMENT

Créer les états :

payment_pending
payment_success
payment_failed
payment_cancelled
payment_expired
payment_unknown

---

# 16. RÈGLE ABSOLUE D'ACTIVATION

NE JAMAIS faire :

Frontend :
/payment-success
→ subscription = active

La redirection du navigateur n'est PAS une preuve de paiement.

Faire :

Paystack
→ webhook
→ backend vérifie l'événement
→ transaction confirmée
→ subscription activée
→ service activé

---

# 17. IDEMPOTENCE DES WEBHOOKS

Le backend doit supporter la réception plusieurs fois du même webhook sans créer :

- deux abonnements ;
- deux paiements ;
- deux activations ;
- deux installations ;
- deux crédits.

Chaque événement doit être traité de manière idempotente.

Stocker notamment :

- provider
- event type
- provider event ID si disponible
- transaction reference
- processedAt
- status

---

# 18. TRANSACTION

Créer une entité Transaction.

Exemple conceptuel :

Transaction {

  _id

  userId

  subscriptionId

  offerId

  type

  amount

  currency

  provider

  providerReference

  status

  paymentMethod

  metadata

  createdAt

  paidAt

  failedAt
}

Types possibles :

SUBSCRIPTION_INITIAL
SUBSCRIPTION_RENEWAL
SETUP_SERVICE
UPGRADE
OTHER

---

# 19. SUBSCRIPTION

Créer une entité Subscription indépendante de WhatsApp.

Exemple :

Subscription {

  _id

  userId

  offerId

  status

  billingInterval

  price

  currency

  startDate

  currentPeriodStart

  currentPeriodEnd

  nextBillingDate

  paymentMethod

  provider

  providerCustomerId

  providerSubscriptionId

  cancellationRequestedAt

  cancelledAt

  scheduledOfferId

  createdAt

  updatedAt
}

---

# 20. ÉTATS D'ABONNEMENT

Utiliser au minimum :

pending

active

past_due

cancelled

expired

scheduled_change

payment_failed

---

# 21. WHATSAPP CONNECTION

Créer une entité distincte.

WhatsAppConnection {

  _id

  userId

  phoneNumber

  status

  connectionType

  connectedAt

  disconnectedAt

  lastSeenAt

  errorCode

  errorMessage

  metadata

  createdAt

  updatedAt
}

---

# 22. ÉTATS WHATSAPP

Utiliser :

NOT_CONNECTED

CONNECTING

CONNECTED

DISCONNECTED

ERROR

RECONNECTING

---

# 23. NE JAMAIS COUPLER DIRECTEMENT

NE PAS faire :

subscription.status === active
→ whatsapp.status === connected

Un abonnement peut être actif alors que WhatsApp est temporairement déconnecté.

Exemple :

Subscription:
ACTIVE

WhatsApp:
DISCONNECTED

L'interface doit alors dire :

"Votre abonnement est actif mais votre WhatsApp doit être reconnecté."

---

# 24. AVANT ABONNEMENT

Dans la section WhatsApp, si l'utilisateur n'a pas d'abonnement :

Afficher :

---

WhatsApp

Votre vendeur IA travaille sur WhatsApp.

Pour commencer :

[ VOIR LES OFFRES ]

---

NE PAS afficher une multitude de méthodes techniques.

---

# 25. APRÈS PAIEMENT MAIS AVANT CONNEXION

Afficher une page d'activation.

Titre :

Votre Vendeur IA est presque prêt.

Progression :

✓ Offre activée
✓ Paiement confirmé
● Connexion WhatsApp
○ Vendeur IA prêt

---

Si l'utilisateur doit effectuer une action :

Titre :

Connectons votre WhatsApp

Instruction extrêmement simple.

Exemple :

Scannez le QR Code avec WhatsApp.

ou :

Suivez les instructions affichées.

---

Ne jamais demander à l'utilisateur de comprendre pourquoi cette méthode technique existe.

---

# 26. APRÈS CONNEXION RÉUSSIE

La section WhatsApp devient une page de statut.

Elle ne doit plus être une page de vente.

---

Titre :

WhatsApp

Badge :

● CONNECTÉ

Numéro :

+225 XX XX XX XX

Message :

Votre vendeur IA est opérationnel.

---

CTA :

[ TESTER MON VENDEUR ]

---

# 27. INFORMATIONS À AFFICHER APRÈS ACTIVATION

Afficher :

Vendeur IA

● Actif

WhatsApp

● Connecté

Offre

Essentiel / Pro

Prochaine échéance

DATE

---

Éventuellement :

Messages traités aujourd'hui

47

Clients accompagnés

23

Commandes détectées

8

Ces statistiques sont optionnelles.

Ne pas afficher de statistiques fictives.

---

# 28. BLOC "MON OFFRE"

Après activation :

Mon offre

Vendeur IA Essentiel

5 000 XOF / mois

● Actif

Prochaine échéance :

DATE

CTA :

[ GÉRER MON OFFRE ]

---

# 29. PAGE "GÉRER MON OFFRE"

Titre :

Mon offre

---

Afficher clairement :

Offre actuelle
Essentiel

Prix
5 000 XOF / mois

Statut
● Actif

Prochaine échéance
DATE

Mode de paiement
Wave / Orange / MTN / Carte

---

Actions :

[ CHANGER D'OFFRE ]

[ GÉRER LE PAIEMENT ]

[ ANNULER L'ABONNEMENT ]

---

# 30. CHANGER D'OFFRE

Le changement d'offre doit être une page dédiée.

PAS un petit modal complexe.

Titre :

Changer mon offre

Sous-titre :

Vous pouvez changer d'offre à tout moment.

---

Afficher toutes les offres.

L'offre actuelle possède un badge :

VOTRE OFFRE ACTUELLE

---

# 31. UPGRADE

Exemple :

Essentiel → Pro

Afficher :

Vous passez à :

Vendeur IA Pro

---

Prix :

PRO_MONTHLY_PRICE XOF / mois

---

Afficher clairement ce qui change.

---

CTA :

[ PASSER À PRO ]

---

Si un paiement supplémentaire est nécessaire :

Afficher exactement :

À payer aujourd'hui :

X XOF

Ne jamais cacher le montant.

---

# 32. DOWNGRADE

Exemple :

Pro → Essentiel

Afficher :

Vous passez à :

Vendeur IA Essentiel

---

IMPORTANT :

Recommandation MVP :

Le downgrade prend effet à la prochaine échéance.

Message :

"Votre offre Pro reste active jusqu'au DATE. Votre offre Essentiel prendra ensuite le relais."

CTA :

[ CONFIRMER LE CHANGEMENT ]

---

# 33. CHANGEMENT D'OFFRE EN ATTENTE

Après confirmation :

Afficher :

Changement programmé

Votre offre actuelle :

Pro

Nouvelle offre :

Essentiel

Date d'application :

DATE

---

CTA :

[ ANNULER LE CHANGEMENT ]

---

# 34. ANNULER UN DOWNGRADE PROGRAMMÉ

Si l'utilisateur change d'avis :

Afficher :

"Votre changement d'offre est programmé pour le DATE."

CTA :

[ ANNULER LE CHANGEMENT ]

Après confirmation :

"Votre offre Pro reste votre offre active."

---

# 35. ANNULATION D'ABONNEMENT

Ne pas utiliser une interface agressive.

Afficher :

Résilier mon abonnement

"Votre Vendeur IA restera disponible jusqu'à la fin de votre période actuelle."

Afficher :

Fin de votre accès :

DATE

CTA principal :

[ CONFIRMER LA RÉSILIATION ]

CTA secondaire :

[ GARDER MON ABONNEMENT ]

---

# 36. APRÈS ANNULATION

Subscription :

cancelled

mais l'accès peut rester actif jusqu'à :

currentPeriodEnd

Afficher :

Votre abonnement est résilié.

Vous pouvez continuer à utiliser Vendeur IA jusqu'au :

DATE

---

# 37. EXPIRATION

Lorsque currentPeriodEnd est dépassé sans renouvellement valide :

Subscription :

expired

---

WhatsApp :

ne pas forcément supprimer immédiatement la connexion technique.

Afficher :

Votre abonnement a expiré.

Votre vendeur IA est actuellement en pause.

[ RÉACTIVER MON ABONNEMENT ]

---

# 38. PAIEMENT ÉCHOUÉ

Afficher :

Votre paiement n'a pas abouti.

Votre abonnement n'a pas été renouvelé.

[ RÉESSAYER LE PAIEMENT ]

---

Ne jamais afficher :

ERROR 402

Stripe-like technical message

gateway_response_code

provider exception

etc.

---

# 39. PAIEMENT MOBILE MONEY EN ATTENTE

Afficher :

Paiement en attente

"Validez votre paiement sur votre téléphone."

Puis :

"Nous attendons la confirmation du paiement."

Le système doit attendre la confirmation backend.

---

# 40. CONNEXION WHATSAPP EN ERREUR

Afficher :

Votre WhatsApp n'est pas encore connecté.

Votre abonnement est bien actif.

[ RECONNECTER WHATSAPP ]

[ CONTACTER LE SUPPORT ]

---

IMPORTANT :

Ne pas demander à l'utilisateur de repayer son abonnement.

---

# 41. WHATSAPP DÉCONNECTÉ APRÈS ACTIVATION

Afficher :

WhatsApp

🔴 Déconnecté

"Votre vendeur IA ne peut plus répondre à vos clients pour le moment."

[ RECONNECTER ]

---

Afficher également :

"Votre abonnement reste actif."

---

# 42. WHATSAPP EN RECONNEXION

Afficher :

WhatsApp

🟡 Reconnexion en cours

"Nous essayons de reconnecter votre vendeur IA."

---

CTA secondaire :

[ ANNULER ]

uniquement si techniquement pertinent.

---

# 43. CHANGER DE NUMÉRO WHATSAPP

Dans les paramètres WhatsApp :

Numéro connecté

+225 XX XX XX XX

[ CHANGER DE NUMÉRO ]

---

Afficher un avertissement :

"Changer de numéro peut interrompre temporairement votre vendeur IA."

CTA :

[ CONTINUER ]

---

# 44. RÈGLE SUR LES NUMÉROS

Un utilisateur doit savoir quel numéro est actuellement utilisé.

Toujours afficher :

+225 XX XX XX XX

et éventuellement un libellé :

Numéro WhatsApp connecté

---

# 45. PAGE WHATSAPP : ÉTAT FINAL RECOMMANDÉ

## CAS CONNECTÉ

WhatsApp

🟢 CONNECTÉ

+225 XX XX XX XX

Votre vendeur IA est opérationnel.

[ TESTER MON VENDEUR ]

---

Votre offre

Vendeur IA Essentiel

5 000 XOF / mois

Prochaine échéance :

12 septembre 2026

[ GÉRER MON OFFRE ]

---

# 46. CAS NON CONNECTÉ

WhatsApp

⚪ NON CONNECTÉ

Votre vendeur IA n'est pas encore connecté à WhatsApp.

[ CONNECTER WHATSAPP ]

---

# 47. CAS ERREUR

WhatsApp

🔴 ACTION REQUISE

Votre connexion WhatsApp nécessite votre attention.

[ RÉPARER ]

---

# 48. CAS CONNEXION

WhatsApp

🟡 CONNEXION EN COURS

Nous préparons votre vendeur IA.

---

# 49. CAS ABONNEMENT INACTIF

WhatsApp

Votre abonnement n'est pas actif.

[ VOIR LES OFFRES ]

---

# 50. IMPORTANT : NE PAS AFFICHER LES OFFRES SUR LA PAGE WHATSAPP ACTIVE

Une fois l'utilisateur actif :

NE PAS afficher :

Essentiel
Pro
Pack Expert
Mode Express
Mode Pro

en permanence.

La page doit être centrée sur :

"Est-ce que mon vendeur fonctionne ?"

Les offres doivent être accessibles via :

Mon offre
→ Changer d'offre

---

# 51. NAVIGATION RECOMMANDÉE

Dans le menu :

Stats
IA
Catalogue
Messages
Plus

Dans "Plus" :

Mon offre
WhatsApp
Paramètres
Support

OU, si WhatsApp mérite une place principale :

Stats
IA
Catalogue
Messages
WhatsApp
Plus

Choisir selon l'architecture actuelle.

---

# 52. RÈGLE DE PRIORITÉ UI

L'information la plus importante doit être :

1. Vendeur opérationnel ou non
2. WhatsApp connecté ou non
3. Offre active ou non
4. Prochaine échéance
5. Actions disponibles

Ne pas donner la priorité au prix une fois que l'utilisateur est déjà client.

---

# 53. VOCABULAIRE

Utiliser :

"Votre offre"

"Votre abonnement"

"Votre vendeur IA"

"WhatsApp connecté"

"Changer d'offre"

"Prochaine échéance"

"Paiement"

"Réessayer"

"Reconnecter"

---

# 54. VOCABULAIRE À ÉVITER

Éviter :

"Instance"

"Session"

"API"

"Cloud API"

"Serveur"

"Worker"

"Webhook"

"Token"

"Provisioning"

"Configuration Meta"

"Activation technique"

"Mode manuel"

"Mode Express"

"Mode Pro"

sauf dans les interfaces administrateur/debug.

---

# 55. MODALS

Principe :

Les modals doivent être utilisés pour :

- confirmation ;
- avertissement ;
- petite action secondaire.

Ils ne doivent pas servir à cacher un deuxième catalogue d'offres.

INTERDIT :

Carte offre
→ clic
→ modal
→ nouvelles cartes offres

---

# 56. CHECKOUT

Le checkout doit être très court.

Étape 1 :

Offre

Étape 2 :

Montant

Étape 3 :

Paiement

Étape 4 :

Confirmation

---

# 57. RÉCAPITULATIF DE PAIEMENT

Toujours afficher :

Produit

Prix

Intervalle

Montant aujourd'hui

Éventuels frais d'installation

Total

---

Exemple :

Vendeur IA Essentiel

5 000 XOF / mois

Installation :

0 XOF

---

Total aujourd'hui :

5 000 XOF

[ PAYER ]

---

# 58. INSTALLATION PRO EXPERT

Si l'utilisateur choisit l'installation :

Vendeur IA Pro

Abonnement :

PRO_MONTHLY_PRICE XOF / mois

Installation Pro Expert :

25 000 XOF

Paiement unique

---

Total aujourd'hui :

PRO_MONTHLY_PRICE + 25 000 XOF

---

IMPORTANT :

Le système doit indiquer clairement :

"25 000 XOF sont facturés une seule fois."

---

# 59. PAS DE DOUBLE FACTURATION

Une installation payée ne doit pas créer une deuxième subscription.

Elle crée :

Transaction type:
SETUP_SERVICE

L'abonnement reste :

Subscription type:
MONTHLY

---

# 60. DONNÉES DE L'OFFRE

Créer un modèle Offer.

Offer {

  id

  slug

  name

  description

  monthlyPrice

  currency

  features

  isActive

  sortOrder

  metadata

}

---

# 61. DONNÉES DU SERVICE D'INSTALLATION

SetupService {

  id

  slug

  name

  price

  currency

  features

  isActive

}

---

# 62. LIEN ENTRE OFFRE ET INSTALLATION

Une offre peut avoir :

setupRequired = true/false

ou :

setupOptions = [...]

Exemple :

PRO

setupOptions:

[
  {
    type: "SELF_SERVICE",
    price: 0
  },
  {
    type: "EXPERT",
    price: 25000
  }
]

IMPORTANT :

Si une offre propose plusieurs options d'installation, elles doivent être affichées AVANT le paiement.

---

# 63. RÈGLE SI PLUSIEURS OPTIONS EXISTENT

Si techniquement il existe :

Installation autonome

et

Installation Expert

alors l'interface doit les présenter sur la page de l'offre AVANT le checkout.

Exemple :

## Comment souhaitez-vous commencer ?

### Je le fais moi-même

Inclus

[ CHOISIR ]

### Faites-le pour moi

25 000 XOF

[ CHOISIR ]

Ce choix doit être explicite.

Il ne doit pas apparaître après un premier choix ambigu.

---

# 64. RÈGLE GÉNÉRALE

TOUT choix qui modifie le prix final doit être présenté AVANT le paiement.

Jamais après.

---

# 65. CHECKOUT FINAL

Le checkout doit toujours connaître :

offerId

setupOptionId éventuellement

userId

amount

currency

paymentProvider

metadata

---

# 66. METADATA PAYSTACK

Utiliser metadata pour identifier proprement la transaction.

Exemple :

{
  userId,
  offerId,
  transactionType,
  subscriptionId,
  setupServiceId,
  setupOptionId
}

NE PAS placer de secret dans metadata.

---

# 67. RÉFÉRENCE DE TRANSACTION

Créer une référence unique côté backend.

Exemple conceptuel :

VIA-USERID-TIMESTAMP-RANDOM

La référence doit être unique.

---

# 68. SÉCURITÉ PAYSTACK

La clé secrète Paystack :

NE DOIT JAMAIS être envoyée au frontend.

Elle doit rester dans les variables d'environnement backend.

Ne jamais :

- la commit ;
- la mettre dans Vite ;
- la mettre dans React ;
- la mettre dans localStorage ;
- l'afficher dans les logs.

---

# 69. CONFIRMATION DE PAIEMENT

Lorsqu'un événement Paystack arrive :

1. vérifier la signature du webhook ;
2. identifier la transaction ;
3. vérifier l'idempotence ;
4. vérifier la référence ;
5. vérifier le montant ;
6. vérifier la devise ;
7. vérifier le contexte ;
8. enregistrer le paiement ;
9. activer ou modifier l'abonnement ;
10. déclencher l'activation du service.

---

# 70. NE JAMAIS FAIRE CONFIANCE AU FRONTEND

Le frontend ne peut jamais décider :

subscription = active

Le backend est la seule source de vérité.

---

# 71. RÈGLE DE MONTANT

Le montant reçu doit correspondre au montant attendu côté backend.

Si attendu :

5000 XOF

et reçu :

1000 XOF

NE PAS activer l'abonnement.

Créer une alerte transactionnelle.

---

# 72. RÈGLE DE DEVISE

Vérifier :

XOF

avant activation.

---

# 73. JOURNAL DES ÉVÉNEMENTS

Créer un PaymentEventLog.

Exemple :

PaymentEventLog {

  provider

  eventType

  reference

  payloadHash

  status

  processedAt

  error

}

Ne pas stocker inutilement des données sensibles.

---

# 74. RENOUVELLEMENT

Le système doit distinguer :

paiement initial

et

paiement de renouvellement.

---

## PAIEMENT INITIAL

Subscription :

pending

↓

paiement confirmé

↓

active

---

## RENOUVELLEMENT

À la date prévue :

tentative de paiement

↓

succès

↓

nouvelle période

---

ou :

échec

↓

past_due / payment_failed

---

# 75. MOBILE MONEY ET RENOUVELLEMENT

Ne pas supposer qu'un paiement Mobile Money peut être automatiquement débité comme une carte.

Le système doit pouvoir gérer un renouvellement nécessitant une nouvelle action de paiement.

Interface :

Votre abonnement arrive à échéance.

[ RENOUVELER ]

---

# 76. CARTE

Si une autorisation réutilisable est disponible et que le système l'utilise pour les renouvellements, afficher :

Renouvellement automatique

ou

Paiement automatique

uniquement lorsque c'est réellement actif.

---

# 77. NE PAS PROMETTRE "RENOUVELLEMENT AUTOMATIQUE"

si le moyen de paiement ne le permet pas.

---

# 78. NOTIFICATIONS

Prévoir :

7 jours avant échéance

3 jours avant

1 jour avant

jour de l'échéance

paiement échoué

abonnement expiré

---

# 79. NOTIFICATION SIMPLE

Exemple :

"Votre abonnement Vendeur IA arrive à échéance dans 3 jours."

CTA :

[ RENOUVELER ]

---

# 80. PAIEMENT ÉCHOUÉ

Notification :

"Le renouvellement de votre Vendeur IA n'a pas abouti."

[ RÉESSAYER ]

---

# 81. WHATSAPP ET EXPIRATION

Ne pas supprimer immédiatement les données du vendeur lorsque l'abonnement expire.

Conserver :

- catalogue ;
- configuration IA ;
- historique ;
- paramètres ;
- profil.

Le compte peut être réactivé.

---

# 82. RÉACTIVATION

Après expiration :

[ RÉACTIVER MON VENDEUR ]

L'utilisateur doit pouvoir reprendre une offre.

---

# 83. RETOUR APRÈS PAIEMENT

Après confirmation backend :

rediriger vers :

/activation

et non directement vers :

/dashboard

si WhatsApp n'est pas encore connecté.

---

# 84. SI WHATSAPP EST DÉJÀ CONNECTÉ

Si l'utilisateur possède déjà une connexion WhatsApp valide et qu'il renouvelle son abonnement :

ne pas refaire l'onboarding.

Afficher directement :

Votre Vendeur IA est actif.

---

# 85. SI L'UTILISATEUR UPGRADE

Ne pas déconnecter WhatsApp.

Ne pas recréer inutilement la connexion.

Modifier uniquement :

subscription.offerId

et les permissions/fonctionnalités associées.

---

# 86. SI L'UTILISATEUR DOWNGRADE

Ne pas déconnecter WhatsApp.

Le changement concerne les droits de l'offre.

---

# 87. SI L'OFFRE CHANGE DE TECHNOLOGIE

Si une nouvelle offre nécessite réellement une autre architecture WhatsApp :

le backend doit gérer la migration.

L'utilisateur doit voir :

"Votre connexion WhatsApp doit être mise à jour."

et non :

"Choisissez votre mode."

---

# 88. RÈGLE DE MIGRATION

Migration :

ancienne connexion
→ préparation nouvelle connexion
→ validation
→ bascule
→ ancienne connexion désactivée

Ne jamais couper l'ancienne connexion avant que la nouvelle soit prête, lorsque techniquement possible.

---

# 89. PAGE DE SUCCÈS

Après activation complète :

🎉

Votre Vendeur IA est prêt.

WhatsApp :

🟢 Connecté

Votre IA peut maintenant répondre à vos clients.

[ OUVRIR MON VENDEUR ]

---

# 90. PAGE DE SUCCÈS APRÈS PAIEMENT MAIS AVANT WHATSAPP

Votre abonnement est actif.

Votre Vendeur IA doit maintenant être connecté à WhatsApp.

[ CONNECTER WHATSAPP ]

---

# 91. RÈGLE UX MAJEURE

Ne jamais afficher un écran vide après paiement.

L'utilisateur doit toujours savoir :

- ce qui vient de se passer ;
- ce qui reste à faire ;
- pourquoi ;
- quel bouton utiliser.

---

# 92. BREADCRUMB / PROGRESSION

Pendant onboarding :

1. Offre
2. Paiement
3. WhatsApp
4. Prêt

L'étape actuelle doit être visuellement claire.

---

# 93. MOBILE FIRST

L'ensemble du parcours doit être optimisé pour mobile.

Priorité :

- gros CTA ;
- texte court ;
- prix très visible ;
- une action principale ;
- peu de champs ;
- pas de tableaux complexes sur mobile ;
- pas de modal géante ;
- pas de jargon.

---

# 94. DESIGN

Respecter le design existant de Vendeur IA.

Utiliser :

- fond sombre si le design système actuel le prévoit ;
- vert de marque ;
- blanc pour les CTA principaux ;
- cartes sobres ;
- contraste élevé ;
- espaces généreux.

Ne pas transformer le checkout en écran publicitaire.

Le paiement doit inspirer confiance.

---

# 95. BOUTONS

Un seul bouton primaire par écran.

Exemples :

Page offres :

[ COMMENCER ]

Checkout :

[ PAYER 5 000 XOF ]

Connexion :

[ CONNECTER WHATSAPP ]

Erreur :

[ RÉESSAYER ]

Gestion :

[ CHANGER D'OFFRE ]

---

# 96. BOUTONS À ÉVITER

Éviter :

CONTINUER

OK

VALIDER

SUIVANT

ACTIVER

si leur signification réelle n'est pas évidente.

Préférer des verbes précis.

---

# 97. CONFIRMATIONS

Avant toute action irréversible :

Afficher une confirmation.

Exemple :

Résilier mon abonnement ?

Votre abonnement restera actif jusqu'au DATE.

[ GARDER MON ABONNEMENT ]

[ CONFIRMER LA RÉSILIATION ]

---

# 98. RÈGLE DES 3 SECONDES

Un nouvel utilisateur doit pouvoir répondre en moins de 3 secondes à :

1. Que vend Vendeur IA ?
2. Combien ça coûte ?
3. Que dois-je faire maintenant ?

---

# 99. RÈGLE DES 10 SECONDES

Un utilisateur doit pouvoir commencer son achat en moins de 10 secondes après avoir ouvert la page des offres.

---

# 100. RÈGLE DU "ZERO SURPRISE"

Aucune surprise après clic.

Avant paiement :

l'utilisateur doit connaître :

- l'offre ;
- le prix ;
- la périodicité ;
- l'éventuel coût d'installation ;
- le montant payé aujourd'hui.

---

# 101. ÉTATS UI À IMPLEMENTER

Pour les offres :

AVAILABLE
SELECTED
CURRENT
UPGRADE_AVAILABLE
DOWNGRADE_AVAILABLE
DISABLED

Pour paiement :

IDLE
PROCESSING
PENDING
SUCCESS
FAILED
CANCELLED

Pour abonnement :

PENDING
ACTIVE
PAST_DUE
CANCELLED
EXPIRED
SCHEDULED_CHANGE

Pour WhatsApp :

NOT_CONNECTED
CONNECTING
CONNECTED
DISCONNECTED
RECONNECTING
ERROR

---

# 102. RÈGLE DES ÉTATS

L'UI doit être pilotée par l'état réel du backend.

Ne pas utiliser uniquement :

localStorage

pour déterminer :

- abonnement actif ;
- paiement réussi ;
- WhatsApp connecté.

Le frontend peut mettre en cache l'information mais le backend reste la source de vérité.

---

# 103. ROUTES FRONTEND RECOMMANDÉES

Adapter aux routes existantes.

Conceptuellement :

/offers

/offers/:offerId

/checkout

/payment/success

/payment/failed

/activation

/whatsapp

/whatsapp/connect

/subscription

/subscription/change

/subscription/upgrade

/subscription/cancel

---

# 104. ROUTES BACKEND CONCEPTUELLES

GET
/api/offers

GET
/api/subscription

POST
/api/subscription/checkout

POST
/api/subscription/upgrade

POST
/api/subscription/downgrade

POST
/api/subscription/cancel

POST
/api/subscription/reactivate

GET
/api/whatsapp/status

POST
/api/whatsapp/connect

POST
/api/whatsapp/reconnect

POST
/api/payments/initialize

POST
/api/payments/webhook

GET
/api/payments/:reference

---

# 105. IMPORTANT

Ne pas créer toutes ces routes si des routes équivalentes existent déjà.

Avant de modifier le code :

AUDITER LE CODE EXISTANT.

Identifier :

- modèles ;
- routes ;
- services ;
- controllers ;
- hooks ;
- composants ;
- pages ;
- logique Paystack ;
- logique WhatsApp ;
- état global ;
- stockage.

Réutiliser ce qui est propre.

Ne pas créer une deuxième architecture parallèle.

---

# 106. MIGRATION DE L'ANCIEN SYSTEMENT

Identifier les anciennes valeurs :

express
pro
manual
expert
etc.

Créer une migration claire.

NE PAS casser les utilisateurs existants.

---

# 107. COMPATIBILITÉ UTILISATEURS EXISTANTS

Pour chaque utilisateur existant :

déterminer :

- offre actuelle ;
- statut abonnement ;
- paiement ;
- WhatsApp ;
- date d'échéance ;
- type de connexion.

Puis migrer vers les nouveaux états.

---

# 108. AUCUNE PERTE DE DONNÉES

La refonte UI ne doit pas :

- supprimer un catalogue ;
- supprimer une conversation ;
- supprimer une configuration IA ;
- déconnecter inutilement WhatsApp ;
- supprimer un abonnement historique.

---

# 109. HISTORIQUE DES PAIEMENTS

Dans "Mon offre" :

Historique des paiements

Afficher :

DATE
DESCRIPTION
MONTANT
STATUT

Exemple :

12 août 2026
Vendeur IA Essentiel
5 000 XOF
Payé

---

# 110. REÇU

Prévoir un accès :

[ VOIR LE REÇU ]

ou

[ TÉLÉCHARGER LE REÇU ]

Ne pas bloquer le MVP si la génération PDF n'existe pas encore.

---

# 111. SUPPORT

Depuis un problème de paiement :

[ CONTACTER LE SUPPORT ]

Depuis un problème WhatsApp :

[ CONTACTER LE SUPPORT ]

Le contexte doit être transmis automatiquement au support lorsque possible :

- userId ;
- subscriptionId ;
- transaction reference ;
- WhatsApp status ;
- error code.

Le client ne doit pas avoir à expliquer toute son histoire.

---

# 112. ANALYTICS PRODUIT

Suivre au minimum :

offer_viewed

offer_selected

checkout_started

payment_started

payment_success

payment_failed

activation_started

whatsapp_connect_started

whatsapp_connected

activation_completed

upgrade_started

upgrade_completed

downgrade_started

downgrade_completed

cancellation_started

cancellation_completed

renewal_success

renewal_failed

---

# 113. FUNNEL

Le produit doit permettre de mesurer :

Offers viewed
↓
Offer selected
↓
Checkout started
↓
Payment successful
↓
WhatsApp connection started
↓
WhatsApp connected
↓
First AI conversation
↓
First sale / conversion

---

# 114. OBJECTIF BUSINESS

Le vrai KPI n'est pas :

"combien de personnes ont cliqué sur Débloquer"

mais :

"combien de vendeurs ont un Vendeur IA réellement opérationnel."

---

# 115. ACTIVATION

Définir :

ACTIVATED_USER

comme :

subscription.status === ACTIVE

AND

whatsapp.status === CONNECTED

AND

AI agent available === TRUE

---

# 116. NE PAS CONSIDÉRER COMME ACTIVÉ

Un utilisateur qui :

- a payé ;
- mais n'a pas connecté WhatsApp.

Il est :

PAID_NOT_ACTIVATED

---

# 117. DASHBOARD APRÈS ACTIVATION

Le dashboard peut afficher :

🎉 Votre vendeur IA est actif.

WhatsApp :
🟢 Connecté

Offre :
Essentiel

Prochaine échéance :
DATE

---

# 118. PREMIÈRE EXPÉRIENCE

Après connexion :

proposer immédiatement :

[ ENVOYER UN MESSAGE TEST ]

Exemple :

"Bonjour, je voudrais voir vos produits."

Le système doit permettre de vérifier que l'IA répond.

---

# 119. TEST DU VENDEUR

Le bouton :

[ TESTER MON VENDEUR ]

doit ouvrir une expérience très simple.

Objectif :

prouver immédiatement que le vendeur IA fonctionne.

---

# 120. PAS DE TECHNIQUE APRÈS ACTIVATION

Une fois le vendeur opérationnel :

NE PAS montrer :

API status
session ID
server
connection ID
webhook status

dans l'interface normale.

Ces informations appartiennent à l'administration/debug.

---

# 121. ADMINISTRATION

Créer éventuellement une interface admin séparée :

Admin > Payments
Admin > Subscriptions
Admin > WhatsApp Connections
Admin > Webhooks
Admin > Errors

L'administrateur peut voir les détails techniques.

Le commerçant ne doit pas.

---

# 122. RÈGLE DE SÉPARATION

USER UI :

Simple.

ADMIN UI :

Détaillée.

DEVELOPER LOGS :

Très détaillés.

Ne pas mélanger les trois.

---

# 123. CAS LIMITE : DOUBLE CLIC

Si l'utilisateur clique deux fois sur :

PAYER

ne pas créer deux transactions.

Désactiver le bouton pendant le traitement.

Le backend doit également gérer l'idempotence.

---

# 124. CAS LIMITE : FERMETURE DU NAVIGATEUR

Si l'utilisateur ferme le navigateur pendant le paiement :

le paiement peut continuer côté Paystack.

Lorsqu'il revient :

GET /subscription

doit permettre de récupérer l'état réel.

---

# 125. CAS LIMITE : PAIEMENT RÉUSSI MAIS NAVIGATEUR FERMÉ

Webhook reçu :

subscription = active

Lorsque l'utilisateur revient :

il voit :

Votre abonnement est actif.

---

# 126. CAS LIMITE : PAIEMENT RÉUSSI MAIS WEBHOOK EN RETARD

Le frontend peut afficher :

"Nous vérifions votre paiement."

NE PAS afficher :

"Paiement échoué."

avant confirmation réelle.

---

# 127. CAS LIMITE : WEBHOOK DUPLIQUÉ

Ignorer proprement l'événement déjà traité.

---

# 128. CAS LIMITE : WEBHOOK INVALIDE

Rejeter.

Logger.

Ne jamais activer l'abonnement.

---

# 129. CAS LIMITE : MONTANT INCORRECT

Rejeter l'activation.

Créer une alerte.

Ne jamais attribuer automatiquement le mauvais produit.

---

# 130. CAS LIMITE : UTILISATEUR DÉJÀ ABONNÉ

S'il clique sur une offre déjà active :

ne pas lancer un nouveau paiement.

Afficher :

"Vous utilisez déjà cette offre."

[ GÉRER MON OFFRE ]

---

# 131. CAS LIMITE : UPGRADE DÉJÀ PROGRAMMÉ

Afficher l'état.

Ne pas créer un deuxième changement.

---

# 132. CAS LIMITE : DOWNGRADE DÉJÀ PROGRAMMÉ

Afficher :

Votre changement vers Essentiel est prévu le DATE.

[ ANNULER LE CHANGEMENT ]

---

# 133. CAS LIMITE : OFFRE INACTIVE

Si une ancienne offre n'est plus vendue :

les utilisateurs existants doivent pouvoir continuer à l'utiliser si la politique commerciale le permet.

Elle ne doit plus apparaître pour les nouveaux clients.

---

# 134. CAS LIMITE : PRIX MODIFIÉ

Un changement de prix ne doit pas modifier rétroactivement une transaction déjà créée.

Une transaction doit stocker le montant au moment de l'achat.

---

# 135. SOURCE DE VÉRITÉ

Offer :
configuration commerciale

Subscription :
relation client/offre

Transaction :
argent

WhatsAppConnection :
connexion

AI Agent :
fonctionnement

NE PAS stocker ces responsabilités dans une seule collection.

---

# 136. RÈGLE D'ARCHITECTURE

Ne pas faire :

User.subscriptionPrice
User.whatsappConnected
User.paymentSuccess

comme source de vérité unique.

Ces valeurs doivent être dérivées des entités appropriées.

---

# 137. PERMISSIONS PAR OFFRE

Les fonctionnalités doivent être contrôlées par l'offre active.

Conceptuellement :

subscription
→ offer
→ entitlements

Exemple :

{
  catalogAI: true,
  whatsappAI: true,
  advancedFeatures: false,
  prioritySupport: false
}

Pour Pro :

{
  catalogAI: true,
  whatsappAI: true,
  advancedFeatures: true,
  prioritySupport: true
}

---

# 138. NE PAS CODER

if user.plan === "pro"

dans 50 composants.

Utiliser un service central :

getEntitlements(user)

ou équivalent.

---

# 139. UI BASED ON ENTITLEMENTS

Le frontend doit recevoir :

features.available

et afficher les fonctionnalités autorisées.

Mais le backend doit également contrôler les permissions.

Le frontend ne constitue jamais une sécurité.

---

# 140. TESTS UNITAIRES

Tester :

- création d'offre ;
- création abonnement ;
- paiement ;
- webhook ;
- activation ;
- upgrade ;
- downgrade ;
- cancellation ;
- expiration ;
- retry payment ;
- WhatsApp status.

---

# 141. TESTS D'INTÉGRATION

Tester :

1. nouvel utilisateur
2. sélection Essentiel
3. paiement réussi
4. webhook
5. abonnement actif
6. activation WhatsApp
7. connexion
8. dashboard actif

---

# 142. TEST MOBILE MONEY

Tester les scénarios :

Wave

Orange Money

MTN Mobile Money

---

# 143. TEST CARTE

Tester :

- première transaction ;
- succès ;
- échec ;
- autorisation réutilisable si applicable ;
- renouvellement.

---

# 144. TEST ÉCHEC

Simuler :

payment_failed

et vérifier :

- abonnement non activé ;
- interface correcte ;
- possibilité de réessayer.

---

# 145. TEST WEBHOOK DUPLIQUÉ

Envoyer deux fois le même événement.

Résultat attendu :

un seul paiement enregistré.

un seul abonnement activé.

---

# 146. TEST DOUBLE PAIEMENT

Double clic utilisateur.

Résultat attendu :

une seule transaction logique.

---

# 147. TEST UPGRADE

Essentiel

→ Pro

Résultat :

- abonnement modifié ;
- WhatsApp reste connecté ;
- historique conservé ;
- aucune nouvelle connexion inutile.

---

# 148. TEST DOWNGRADE

Pro

→ Essentiel

Résultat :

- changement programmé ;
- Pro reste actif jusqu'à la date prévue ;
- WhatsApp reste connecté.

---

# 149. TEST ANNULATION

Active

→ Cancelled

Résultat :

- accès maintenu jusqu'à échéance ;
- statut visible ;
- pas de suppression immédiate des données.

---

# 150. TEST EXPIRATION

Expiration :

- accès commercial suspendu ;
- catalogue conservé ;
- données conservées ;
- possibilité de réactivation.

---

# 151. TEST WHATSAPP DISCONNECTED

Subscription :

ACTIVE

WhatsApp :

DISCONNECTED

Résultat :

l'abonnement reste actif.

L'interface demande de reconnecter WhatsApp.

---

# 152. TEST WHATSAPP ERROR

Afficher une erreur compréhensible.

Ne pas afficher une stack trace.

---

# 153. TEST OFFRE INACTIVE

Une offre désactivée :

- n'apparaît plus aux nouveaux utilisateurs ;
- reste visible dans l'historique des utilisateurs concernés.

---

# 154. TEST PRIX

Modifier le prix dans la configuration.

Vérifier que :

- la page offres change ;
- checkout change ;
- backend utilise le nouveau prix ;
- ancien paiement reste inchangé.

---

# 155. TEST CURRENCY

Toujours :

XOF

pour la Côte d'Ivoire.

Ne jamais afficher :

FCFA 5000

à certains endroits et :

5 000 XOF

ailleurs.

Choisir une convention unique.

RECOMMANDATION :

5 000 XOF

---

# 156. FORMATAGE PRIX

Utiliser :

5 000 XOF

25 000 XOF

100 000 XOF

Jamais :

5000 XOF

25K

5k

dans les zones principales de paiement.

---

# 157. MICROCOPY

Utiliser des phrases courtes.

Exemples :

"Votre vendeur IA est prêt."

"WhatsApp est connecté."

"Votre paiement est en attente."

"Votre abonnement est actif."

"Votre offre changera le 12 septembre."

---

# 158. TON

Le ton doit être :

- simple ;
- professionnel ;
- rassurant ;
- direct ;
- accessible.

Ne pas parler comme une documentation technique.

---

# 159. EXEMPLE DE PARCOURS COMPLET

UTILISATEUR NOUVEAU

↓

Page offres

↓

Choisit Essentiel

↓

Récapitulatif

↓

5 000 XOF / mois

↓

Payer

↓

Paystack

↓

Paiement confirmé backend

↓

Subscription ACTIVE

↓

Activation WhatsApp

↓

WhatsApp CONNECTED

↓

🎉 Vendeur IA prêt

↓

Dashboard

---

# 160. PARCOURS CLIENT EXISTANT

Utilisateur ouvre WhatsApp

↓

WhatsApp CONNECTED

↓

Subscription ACTIVE

↓

Afficher statut

↓

Pas de page d'offres.

---

# 161. PARCOURS UPGRADE

Dashboard

↓

Mon offre

↓

Changer d'offre

↓

Pro

↓

Comparer

↓

Confirmer

↓

Paiement si nécessaire

↓

Backend confirme

↓

Subscription PRO

↓

WhatsApp reste connecté

---

# 162. PARCOURS DOWNGRADE

Dashboard

↓

Mon offre

↓

Changer d'offre

↓

Essentiel

↓

Confirmer

↓

Changement programmé

↓

Pro reste actif

↓

Échéance

↓

Essentiel devient actif

---

# 163. PARCOURS RENOUVELLEMENT

Avant échéance :

notification

↓

Paiement

↓

succès

↓

nouvelle période

↓

aucune interruption

---

# 164. PARCOURS RENOUVELLEMENT MOBILE MONEY

Avant échéance :

notification

↓

Renouveler

↓

checkout

↓

Mobile Money

↓

paiement

↓

webhook

↓

nouvelle période

---

# 165. PARCOURS PAIEMENT ÉCHOUÉ

Échéance

↓

paiement échoué

↓

past_due

↓

notification

↓

Réessayer

↓

paiement réussi

↓

active

---

# 166. PARCOURS WHATSAPP DÉCONNECTÉ

Subscription ACTIVE

↓

WhatsApp DISCONNECTED

↓

Alerte

↓

Reconnecter

↓

WhatsApp CONNECTED

↓

vendeur opérationnel

---

# 167. RÈGLE UX FINALE

À aucun moment l'utilisateur ne doit se demander :

"Qu'est-ce que je dois choisir maintenant ?"

L'écran doit lui donner une seule action évidente.

---

# 168. CE QUI DOIT ÊTRE SUPPRIMÉ DE L'UI ACTUELLE

Supprimer de la page commerciale :

"Mode Express"

"Mode Pro"

"Mode manuel"

"API Meta Cloud"

"Serveur partagé"

"Pas besoin de téléphone allumé"

"Support multi-agents"

si ces éléments sont présentés comme des choix techniques.

Ils peuvent éventuellement devenir :

petites caractéristiques de l'offre.

---

# 169. RÈGLE SUR LES CARACTÉRISTIQUES TECHNIQUES

Une caractéristique technique peut être affichée uniquement si elle aide réellement le client à choisir.

Exemple acceptable :

"Votre téléphone n'a pas besoin de rester connecté."

Exemple inutile :

"API Meta Cloud."

Le premier répond à une question du commerçant.

Le second décrit notre infrastructure.

---

# 170. OBJECTIF FINAL DU DESIGN

Le client doit percevoir :

"Je choisis mon vendeur IA."

et non :

"Je dois configurer un système WhatsApp."

---

# 171. CONSIGNE D'IMPLÉMENTATION POUR L'AGENT IA

AVANT DE MODIFIER LE CODE :

1. analyser l'intégralité du système actuel ;
2. identifier les composants liés aux offres ;
3. identifier les composants liés au paiement ;
4. identifier les modèles Subscription ;
5. identifier les modèles Payment ;
6. identifier les modèles WhatsApp ;
7. identifier les routes Paystack ;
8. identifier les webhooks ;
9. identifier les états actuels ;
10. identifier les utilisateurs existants.

NE PAS commencer directement par modifier le JSX.

---

# 172. AUDIT PRÉALABLE

Produire d'abord un rapport interne contenant :

- architecture actuelle ;
- modèles existants ;
- flux actuel ;
- problèmes ;
- risques de migration ;
- fichiers concernés ;
- composants à conserver ;
- composants à refactoriser ;
- composants à supprimer ;
- nouvelles entités nécessaires ;
- nouvelles routes nécessaires.

---

# 173. NE PAS CASSER LE PRODUIT

Pendant la refonte :

NE PAS casser :

- login ;
- catalogue ;
- messages ;
- IA ;
- WhatsApp ;
- dashboard ;
- paiement existant ;
- utilisateurs existants.

---

# 174. STRATÉGIE DE MIGRATION

Faire la migration en étapes :

PHASE 1
Audit

PHASE 2
Modèles

PHASE 3
Payment architecture

PHASE 4
Subscription state machine

PHASE 5
WhatsApp state machine

PHASE 6
Offers UI

PHASE 7
Checkout

PHASE 8
Activation

PHASE 9
Subscription management

PHASE 10
Tests

PHASE 11
Production verification

---

# 175. ÉTAT MACHINE D'ABONNEMENT

Implémenter une logique explicite.

Exemple :

PENDING
→ ACTIVE

ACTIVE
→ PAST_DUE

ACTIVE
→ CANCELLED

ACTIVE
→ SCHEDULED_CHANGE

PAST_DUE
→ ACTIVE

PAST_DUE
→ EXPIRED

CANCELLED
→ EXPIRED

---

# 176. ÉTAT MACHINE WHATSAPP

NOT_CONNECTED
→ CONNECTING

CONNECTING
→ CONNECTED

CONNECTING
→ ERROR

CONNECTED
→ DISCONNECTED

DISCONNECTED
→ RECONNECTING

RECONNECTING
→ CONNECTED

RECONNECTING
→ ERROR

---

# 177. INTERDICTION

Ne pas utiliser une seule variable :

user.status

pour représenter :

- paiement ;
- abonnement ;
- WhatsApp ;
- activation.

Ces états sont indépendants.

---

# 178. ACCEPTANCE CRITERIA

La mission est considérée comme réussie uniquement si :

[ ] L'utilisateur voit les offres avant tout choix technique.

[ ] L'utilisateur choisit une offre une seule fois.

[ ] Aucun modal ne redemande une deuxième sélection d'offre.

[ ] Le prix final est visible avant paiement.

[ ] L'éventuel coût d'installation est visible avant paiement.

[ ] Le paiement est lancé directement après confirmation.

[ ] Le backend confirme le paiement.

[ ] Les webhooks sont sécurisés.

[ ] Les webhooks sont idempotents.

[ ] Le statut d'abonnement est indépendant de WhatsApp.

[ ] Le statut WhatsApp est indépendant de l'abonnement.

[ ] Une connexion WhatsApp active n'est pas supprimée lors d'un upgrade.

[ ] Une connexion WhatsApp active n'est pas supprimée lors d'un downgrade.

[ ] L'utilisateur peut voir son offre actuelle.

[ ] L'utilisateur peut changer d'offre.

[ ] Le downgrade peut être programmé.

[ ] L'utilisateur peut annuler un downgrade programmé.

[ ] L'utilisateur peut résilier.

[ ] L'utilisateur peut réactiver.

[ ] L'utilisateur peut réessayer un paiement échoué.

[ ] Les utilisateurs existants ne perdent aucune donnée.

[ ] Les prix sont centralisés.

[ ] Les fonctionnalités sont pilotées par les entitlements.

[ ] Le mobile est prioritaire.

[ ] Les textes ne contiennent pas de jargon technique inutile.

---

# 179. ACCEPTANCE CRITERIA UX

Un utilisateur qui ne connaît rien à Meta Cloud API doit pouvoir :

1. comprendre les offres ;
2. choisir une offre ;
3. connaître le prix ;
4. payer ;
5. connecter WhatsApp ;
6. savoir si le vendeur est actif ;
7. retrouver son abonnement ;
8. changer d'offre.

S'il doit demander au support :

"Je dois cliquer où ?"

l'UX n'est pas terminée.

---

# 180. CONSIGNE FINALE AU CODEUR IA

NE PAS reproduire l'ancienne logique avec de nouveaux composants.

Il faut réellement refondre le parcours selon cette architecture.

La priorité est :

CLARTÉ > NOMBRE D'OPTIONS

SIMPLICITÉ > TECHNICITÉ

ÉTAT RÉEL > ILLUSION FRONTEND

UNE DÉCISION > MULTIPLES MODALS

CONFIANCE > DARK PATTERNS

Le résultat final doit donner l'impression que Vendeur IA est un produit simple à acheter et simple à utiliser.

La complexité technique doit être absorbée par le produit.

---

# 181. LIVRABLES ATTENDUS DE L'AGENT IA

À la fin de l'implémentation, fournir :

1. Rapport d'audit initial.
2. Architecture finale.
3. Liste des fichiers modifiés.
4. Liste des fichiers supprimés.
5. Liste des nouveaux fichiers.
6. Schémas de données.
7. Flux de paiement.
8. Flux webhook.
9. Flux abonnement.
10. Flux WhatsApp.
11. Migration utilisateurs existants.
12. Tests unitaires.
13. Tests intégration.
14. Tests E2E.
15. Rapport de sécurité.
16. Rapport UX.
17. Instructions de configuration Paystack.
18. Variables d'environnement nécessaires.
19. Procédure de test en sandbox.
20. Procédure de passage en production.

---

# 182. INSTRUCTION DE TRAVAIL

Ne pas me répondre avec une simple explication de ce que tu comptes faire.

Commencer par auditer le code existant.

Puis implémenter.

Ne pas inventer de fonctionnalités non présentes.

Ne pas supprimer des fonctionnalités existantes sans justification.

Ne pas modifier l'architecture globale de Vendeur IA sans nécessité.

Réutiliser les composants existants lorsqu'ils sont sains.

Refactoriser lorsqu'ils sont mal structurés.

Construire le nouveau système comme une architecture cohérente et maintenable.

---

# 183. RÉSULTAT ATTENDU

À la fin, le parcours doit être mentalement aussi simple que :

JE CHOISIS
↓
JE PAIE
↓
JE CONNECTE WHATSAPP
↓
MON VENDEUR TRAVAILLE

Puis :

MON OFFRE
↓
JE PEUX LA GÉRER

C'est le modèle UX final à atteindre.
