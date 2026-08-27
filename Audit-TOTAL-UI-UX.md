# MASTER PROMPT — AUDIT TOTAL UI/UX + REFACTOR MOBILE PREMIUM DE TOUTE L’APPLICATION

## MISSION

Je veux que tu réalises un **AUDIT UI/UX COMPLET DE TOUTE L’APPLICATION**, puis que tu corriges et harmonises l’ensemble de l’interface avec une priorité absolue donnée à **l’expérience mobile**.

⚠️ IMPORTANT :

Je ne te demande PAS de corriger uniquement les problèmes que je viens de signaler.

Les problèmes que je t'ai signalés sont seulement des **exemples permettant de montrer le type de défauts présents**.

Je veux que tu recherches **TOUS les problèmes UI/UX similaires ou non identifiés**, dans **TOUTE L’APPLICATION**.

L'objectif final est :

# TOTAL UI MOBILE PREMIUM

Une interface :

- mobile-first ;
- premium ;
- épurée ;
- soft ;
- moderne ;
- élégante ;
- cohérente ;
- simple ;
- intuitive ;
- facile à utiliser ;
- parfaitement lisible ;
- robuste avec des contenus dynamiques ;
- sans débordement ;
- sans chevauchement ;
- sans éléments coupés ;
- sans boutons cassés ;
- sans régression Desktop.

---

# 1. PÉRIMÈTRE : TOUTE L’APPLICATION

L’audit doit couvrir **toutes les interfaces accessibles dans l’application**, et pas uniquement l’Admin.

Inspecte notamment, selon ce qui existe réellement dans le projet :

- landing pages ;
- pages publiques ;
- authentification ;
- inscription ;
- connexion ;
- onboarding ;
- dashboard ;
- espace utilisateur ;
- espace administrateur ;
- profils ;
- paramètres ;
- réglages ;
- pages de gestion ;
- listes ;
- détails ;
- dossiers ;
- commandes ;
- paiements ;
- abonnements ;
- facturation ;
- formulaires ;
- recherche ;
- filtres ;
- notifications ;
- messages ;
- tableaux ;
- cartes ;
- statistiques ;
- pages de détail ;
- pages d'erreur ;
- pages 404 ;
- états vides ;
- états loading ;
- états success ;
- états error ;
- modals ;
- dialogs ;
- popups ;
- dropdowns ;
- menus ;
- navigation ;
- sidebar ;
- header ;
- footer ;
- composants flottants ;
- overlays ;
- toasts ;
- confirmations ;
- tous les composants réutilisables.

**Ne suppose pas qu'une page est correcte simplement parce qu'elle n'a pas encore généré de plainte.**

---

# 2. PREMIÈRE ÉTAPE : COMPRENDRE L’APPLICATION

Avant de modifier le code :

1. inspecte l'architecture du frontend ;
2. identifie toutes les routes ;
3. identifie tous les layouts ;
4. identifie tous les composants UI ;
5. identifie les composants partagés ;
6. identifie les variantes responsive existantes ;
7. identifie le système de design existant ;
8. identifie les breakpoints ;
9. identifie les composants qui sont utilisés dans plusieurs pages.

Construis mentalement une **carte complète de l'interface**.

Je veux éviter les corrections isolées qui créent ensuite des incohérences ailleurs.

---

# 3. AUDIT MOBILE COMPLET

Teste et analyse l'interface sur différentes largeurs :

- 320px ;
- 360px ;
- 375px ;
- 390px ;
- 414px ;
- 430px ;
- 768px.

Puis vérifie également les tailles Desktop existantes.

L'objectif est de détecter :

- horizontal overflow ;
- éléments trop larges ;
- éléments trop petits ;
- éléments coupés ;
- textes écrasés ;
- collisions ;
- mauvais wrapping ;
- alignements incorrects ;
- espacements incohérents ;
- boutons inutilisables ;
- modals dépassant de l'écran ;
- contenus cachés ;
- headers cassés ;
- navigation problématique.

---

# 4. AUDIT DES BOUTONS : PRIORITÉ ABSOLUE

Je veux un audit **de TOUS les boutons de toute l'application**.

Pas uniquement ceux de l'Admin.

Pour chaque bouton, vérifie :

- texte ;
- icône ;
- position de l'icône ;
- gap ;
- padding ;
- hauteur ;
- largeur ;
- alignement ;
- wrapping ;
- état loading ;
- état disabled ;
- état actif ;
- texte long ;
- responsive ;
- zone tactile.

Un bouton doit toujours rester utilisable.

Il ne doit jamais avoir :

❌ texte écrasé  
❌ icône qui touche ou recouvre le texte  
❌ texte coupé  
❌ largeur insuffisante  
❌ contenu qui déborde  
❌ hauteur incohérente  
❌ alignement vertical incorrect  
❌ bouton qui sort de sa carte  
❌ boutons qui se chevauchent

### Exemple réel à corriger

Dans l'Admin, lorsqu'un dossier est affiché après confirmation du paiement client, le bouton :

**« À vérifier »**

déborde actuellement en affichage mobile.

Corrige ce problème.

Mais surtout :

**identifie la cause générale et vérifie tous les boutons présentant le même risque dans toute l'application.**

---

# 5. ICÔNES + TEXTE

Audit global de tous les composants contenant :

**icône + texte**

C'est un point critique.

Recherche les situations où :

- l'icône écrase le texte ;
- le texte écrase l'icône ;
- le gap est insuffisant ;
- le bouton devient trop petit ;
- le contenu ne wrappe pas correctement ;
- l'icône est mal centrée ;
- le texte est verticalement mal aligné.

Cela concerne :

- boutons ;
- actions ;
- menus ;
- navigation ;
- badges ;
- tabs ;
- cartes ;
- headers ;
- dropdowns ;
- notifications ;
- formulaires.

---

# 6. HEADERS

Audit de TOUS les headers.

Vérifier :

- logo ;
- titre ;
- sous-titre ;
- boutons ;
- actions ;
- icônes ;
- menu ;
- retour ;
- notifications ;
- profil ;
- alignement.

Sur mobile, un header doit rester propre même lorsqu'il contient plusieurs actions.

---

# 7. TITRES ET TYPOGRAPHIE

Audit global :

- H1 ;
- H2 ;
- H3 ;
- titres de cartes ;
- sous-titres ;
- labels ;
- descriptions ;
- textes d'aide ;
- textes de boutons ;
- textes d'erreur ;
- messages système.

Vérifie :

- taille ;
- line-height ;
- wrapping ;
- largeur ;
- poids ;
- hiérarchie ;
- lisibilité.

Aucun titre ne doit provoquer un débordement horizontal.

---

# 8. BADGES / STATUS / LABELS

Audit de tous les badges.

Ils doivent fonctionner avec :

- textes courts ;
- textes longs ;
- plusieurs badges ;
- petits écrans ;
- différentes données dynamiques.

Vérifie :

- padding ;
- wrapping ;
- hauteur ;
- alignement ;
- espacement ;
- lisibilité.

---

# 9. CARDS / BLOCS / SECTIONS

Audit de toutes les cartes et tous les conteneurs.

Vérifie :

- largeur ;
- padding ;
- margin ;
- gap ;
- contenu ;
- boutons ;
- badges ;
- images ;
- icônes ;
- textes longs.

Une carte ne doit jamais être cassée par son contenu.

---

# 10. MODALS / POPUPS / DIALOGS

Audit de **tous les modals et popups de l'application**.

Ils doivent fonctionner correctement sur :

- 320px ;
- 360px ;
- 375px ;
- 390px ;
- 414px.

Vérifier :

- largeur ;
- hauteur ;
- max-height ;
- scroll ;
- header ;
- contenu ;
- footer ;
- boutons ;
- fermeture ;
- formulaires ;
- clavier mobile.

Aucun modal ne doit sortir de l'écran.

---

# 11. FORMULAIRES

Audit de tous les :

- inputs ;
- selects ;
- combobox ;
- textarea ;
- checkbox ;
- radio ;
- switch ;
- upload ;
- recherche ;
- filtres.

Vérifier :

- largeur ;
- hauteur ;
- labels ;
- placeholders ;
- erreurs ;
- focus ;
- clavier mobile ;
- boutons ;
- spacing.

---

# 12. TABLEAUX

Audit de toutes les tables.

Sur mobile :

- ne force pas une table illisible à tenir dans 320px ;
- utilise un scroll horizontal maîtrisé lorsque nécessaire ;
- ou transforme intelligemment la présentation en cartes/liste mobile lorsque cela est plus pertinent.

Les actions doivent rester accessibles.

---

# 13. NAVIGATION

Audit de toute la navigation :

- navbar ;
- sidebar ;
- menu mobile ;
- dropdown ;
- navigation secondaire ;
- breadcrumbs ;
- retour ;
- profil ;
- notifications.

L'expérience mobile doit être simple.

Pas de navigation miniature ou surchargée.

---

# 14. PAGE PAR PAGE

Pour CHAQUE page réelle de l'application, vérifie :

### Structure

- largeur ;
- padding ;
- spacing ;
- sections ;
- overflow.

### Contenu

- titres ;
- textes ;
- cartes ;
- images ;
- badges.

### Actions

- boutons ;
- icônes ;
- menus ;
- formulaires.

### Responsive

- 320px ;
- 360px ;
- 375px ;
- 390px ;
- 414px ;
- tablette ;
- Desktop.

---

# 15. RÉGLAGES / CONNEXION

Exemple concret à corriger :

Dans les réglages de connexion, les boutons :

**« Déconnecter »**  
**« Simulateur »**

ne sont actuellement pas correctement alignés sur mobile.

Corrige cela.

Mais encore une fois :

**ne corrige pas uniquement cette page.**

Recherche le même type de problème dans toute l'application.

---

# 16. RECHERCHE DE BUGS CSS

Effectue une recherche globale des patterns potentiellement responsables de problèmes responsive :

- width fixes ;
- min-width ;
- max-width ;
- nowrap ;
- overflow ;
- absolute positioning ;
- flex sans wrap ;
- grids rigides ;
- boutons à largeur fixe ;
- textes longs ;
- icônes ;
- tables ;
- modals.

⚠️ Ne supprime pas automatiquement ces propriétés.

Analyse leur usage et corrige uniquement lorsque nécessaire.

---

# 17. NE PAS CACHER LES BUGS

Interdiction d'utiliser :

```text
overflow: hidden
```

simplement pour faire disparaître un élément qui déborde.

Interdiction de masquer un problème plutôt que de le résoudre.

Je veux une correction de la **cause**, pas un camouflage.

---

# 18. DESIGN SYSTEM GLOBAL

Profite de cet audit pour identifier les incohérences globales :

- boutons ;
- tailles ;
- rayons ;
- paddings ;
- gaps ;
- icônes ;
- badges ;
- cartes ;
- champs ;
- typographie ;
- couleurs ;
- états.

Lorsque plusieurs composants font la même chose, privilégie des composants UI cohérents et réutilisables.

---

# 19. PHILOSOPHIE VISUELLE

Le résultat final doit être :

### PREMIUM
mais pas luxueux ou chargé.

### MODERNE
mais pas à la mode pour la mode.

### SOFT
avec une sensation visuelle agréable.

### ÉPURÉ
avec suffisamment d'espace.

### SIMPLE
chaque action doit être compréhensible.

### FACILE
l'utilisateur ne doit pas réfléchir à l'interface.

### MOBILE-FIRST
l'interface doit sembler avoir été pensée pour le téléphone, pas être un Desktop compressé.

Évite :

- surcharge ;
- animations inutiles ;
- effets flashy ;
- interfaces trop denses ;
- boutons minuscules ;
- textes microscopiques ;
- composants surchargés.

---

# 20. ACCESSIBILITÉ

Vérifie également :

- taille des zones tactiles ;
- contraste ;
- lisibilité ;
- focus ;
- labels ;
- aria-label ;
- boutons icon-only ;
- navigation clavier lorsque pertinent.

---

# 21. PERFORMANCE UI

Ne crée pas une solution responsive qui dégrade inutilement :

- performances ;
- rendering ;
- animations ;
- chargement ;
- scrolling.

Évite les solutions CSS ou JS excessivement complexes lorsqu'une solution simple suffit.

---

# 22. ZÉRO RÉGRESSION

IMPORTANT :

Cette mission est une **refonte UI/UX**, pas une réécriture de la logique métier.

Ne casse pas :

- authentification ;
- WhatsApp ;
- paiements ;
- API ;
- backend ;
- routing ;
- permissions ;
- données ;
- workflows ;
- logique métier.

Préserve le comportement fonctionnel existant.

Toute modification fonctionnelle nécessaire doit être explicitement signalée.

---

# 23. MÉTHODOLOGIE

Travaille dans cet ordre :

### PHASE 1
Cartographie de toute l'application.

### PHASE 2
Inventaire des composants UI.

### PHASE 3
Audit responsive global.

### PHASE 4
Identification des problèmes communs.

### PHASE 5
Correction des composants fondamentaux.

### PHASE 6
Correction page par page.

### PHASE 7
Tests aux différentes largeurs.

### PHASE 8
Test Desktop.

### PHASE 9
Deuxième audit complet.

### PHASE 10
Recherche des problèmes résiduels.

---

# 24. PRIORITÉS

Classe les problèmes :

### P0 — BLOQUANT

- débordement ;
- contenu inaccessible ;
- bouton inutilisable ;
- modal hors écran ;
- action impossible ;
- texte illisible.

### P1 — IMPORTANT

- collision ;
- mauvais alignement ;
- responsive cassé ;
- mauvaise hiérarchie ;
- navigation problématique.

### P2 — POLISH

- spacing ;
- typographie ;
- cohérence ;
- finition visuelle.

---

# 25. VALIDATION FINALE

À la fin, vérifie systématiquement :

- aucune page oubliée ;
- aucun bouton oublié ;
- aucun modal oublié ;
- aucun popup oublié ;
- aucun formulaire oublié ;
- aucun badge oublié ;
- aucun header oublié ;
- aucune navigation oubliée ;
- aucune table oubliée ;
- aucun état loading oublié ;
- aucun état error oublié ;
- aucun état empty oublié ;
- aucun état success oublié.

Teste également les contenus dynamiques :

- texte long ;
- nom long ;
- titre long ;
- plusieurs badges ;
- plusieurs boutons ;
- données nombreuses ;
- données absentes ;
- états d'erreur ;
- états de chargement.

---

# 26. RAPPORT FINAL

À la fin du travail, fournis :

## A. Pages auditées

Liste de toutes les pages analysées.

## B. Problèmes trouvés

Pour chaque problème :

- page ;
- composant ;
- cause ;
- correction ;
- priorité.

## C. Composants globaux corrigés

Liste les composants UI réutilisables modifiés.

## D. Responsive

Indique les différentes largeurs testées.

## E. Régressions

Indique les éventuelles régressions Desktop détectées puis corrigées.

## F. Résultat

Donne une synthèse claire de l'état final de l'interface.

---

# 27. CRITÈRE DE FIN ABSOLU

NE considère PAS la mission terminée parce que les deux problèmes que je t'ai signalés ont été corrigés.

Ces problèmes ne sont que des exemples.

La mission est terminée uniquement lorsque :

> **TOUTE L'APPLICATION a été auditée et optimisée pour une expérience mobile premium, cohérente, simple, moderne et robuste.**

Je veux que tu cherches activement les problèmes que je n'ai pas remarqués.

Ne te contente pas de corriger ce que je vois.

**INSPECTE. DÉTECTE. CORRIGE. HARMONISE. TESTE. RECHECK.**

Le résultat final doit donner une impression de :

**TOTAL UI MOBILE PREMIUM**

Épurée.  
Soft.  
Moderne.  
Simple.  
Facile.  
Cohérente.  
Respirante.  
Robuste.  
Sans débordement.  
Sans collision.  
Sans éléments cassés.  
Sans régression.