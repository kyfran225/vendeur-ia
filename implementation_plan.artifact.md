# Authentification WhatsApp Zéro Friction & Profil Marchand

Ce plan vise à sécuriser l'accès tout en offrant une expérience utilisateur fluide ("One-Tap") et à enrichir les données du marchand dès son inscription.

## User Review Required
> [!IMPORTANT]
> Nous allons utiliser le **Lien Magique (Magic Link)** envoyé par WhatsApp. Le marchand n'aura qu'à toucher le lien dans sa discussion avec le Bot pour être automatiquement connecté dans l'application.

## Proposed Changes

### [Auth & Security]

#### [MODIFY] [user.model.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/auth/user.model.ts)
- Ajouter `businessName`, `firstName` (optionnel), `lastName` (optionnel).
- Ajouter `magicTokenHash` et `magicTokenExpiresAt` pour gérer la connexion par lien.

#### [MODIFY] [auth.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/auth/auth.service.ts)
- **`requestWhatsAppAuth`** : Générer un token unique et envoyer un message WhatsApp via le service `whatsappService`.
- **`verifyMagicLink`** : Valider le token et retourner les accès JWT.
- **Enrichissement** : Si c'est un nouvel utilisateur, utiliser le `pushName` de WhatsApp pour remplir le `displayName` par défaut.

#### [MODIFY] [auth.routes.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/auth/auth.routes.ts)
- Ajouter `GET /api/auth/magic-login?t=TOKEN` pour la redirection après clic.

### [WhatsApp Integration]

#### [MODIFY] [whatsapp.service.ts](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/whatsapp/whatsapp.service.ts)
- Implémenter `sendAuthMagicLink(phoneNumber, loginUrl)` utilisant les identifiants système Meta (Cloud API) pour garantir la délivrabilité.

### [Frontend UX]

#### [MODIFY] [AuthSheet.tsx](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/web/src/features/auth/components/AuthSheet.tsx)
- Mettre à jour le flux : Saisie du numéro -> Affichage d'un message d'attente ("Vérifiez WhatsApp") -> Redirection automatique via socket ou manuelle via le lien.

## Verification Plan

### Automated Tests
- Tester la génération et la validité du token JWT court.
- Simuler la réception d'un message entrant WhatsApp pour valider la création du profil.

### Manual Verification
- Saisir son numéro sur mobile.
- Vérifier la réception du lien sur WhatsApp.
- Cliquer sur le lien et vérifier que l'on arrive sur le Dashboard déjà connecté.
