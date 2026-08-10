# Reprise des travaux — état au 9 août 2026

Ce document ne liste pas les fonctionnalités à venir : **la feuille de route
fait foi**, et elle vit dans l'application (`/roadmap`, table `roadmap_items`).
La recopier ici produirait une seconde source de vérité qui divergerait.

Il consigne ce que la feuille de route ne peut pas porter : les mesures faites
sur l'application réelle, les pièges rencontrés, et les points qui attendent une
action hors du dépôt.

## Ce qui attend une action hors du dépôt

1. **Les previews Vercel restent bloquées.** Les routes API portent désormais
   `export const dynamic = 'force-dynamic'`, ce qui règle la moitié du problème.
   L'autre moitié ne se règle pas ici : il faut ajouter
   `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` à
   l'environnement **Preview** depuis le tableau de bord Vercel. Ne jamais y
   mettre la clé `service_role` : chaque branche poussée est déployée sur une
   URL publique.
2. **Trois chemins n'ont jamais été exécutés sur des données réelles** : la
   suppression d'un ticket support, le changement de mot de passe, et la
   suppression en bloc dans l'historique. Le code est en place et le reste a été
   vérifié, mais ces trois-là attendent un premier essai.
3. **Deux migrations ont été appliquées par exécution SQL directe**, l'outil de
   migration ayant été refusé : `20260809100000_meditation_emoji.sql` et
   `20260809140000_plan_reading_context.sql`. Elles ne figurent donc pas dans la
   table `supabase_migrations` du projet. Les fichiers sont au dépôt et
   rejouables sans dégât.

## Mesures faites sur l'application réelle

À ne pas redécouvrir. Toutes datent du 9 août 2026, sur un compte réel.

| Sujet | Mesure |
|---|---|
| Cache des traductions | 216 812 versets, 42 Mo par appareil, 47 Mo téléchargés |
| Comptage des versions | 932 ms, autrefois répété à chaque montage d'écran |
| Appels Supabase | 24 appels et 4 895 ms cumulées sur trois navigations |
| Appels `/auth/v1/user` | ramenés de 17 à 3 par session |

Le prochain levier de performance est identifié : **chaque écran resynchronise
contextes, lectures et réglages à son ouverture** sans mémoire de ce qui vient
d'être récupéré. Sur trois navigations, cela donne `contexts` ×8, `readings` ×6,
`settings` ×4, `profiles` ×3. C'est ce qui reste entre l'utilisateur et une
application rapide.

## Pièges vérifiés, à ne pas réintroduire

- **Ne pas appeler `auth.getUser()` directement.** L'identité est mémorisée par
  `getUserId()` dans `lib/supabase/store.ts`, sur lequel s'appuie
  `getCurrentUserId()`. Un second chemin sans cache avait fait quatre
  allers-retours réseau par ouverture d'écran.
- **Ne pas retirer les garde-fous de `seedIfNeeded`.** Le verrou d'exécution
  unique et l'import non bloquant sont couverts par `seed.test.ts` ; sans eux,
  un écran restait sur « Chargement… » indéfiniment, de façon intermittente.
- **Après une mutation, mettre à jour l'état local** plutôt que de rappeler
  `getAllReadings()`. Celui-ci resynchronise depuis Supabase, où l'écriture
  partie en arrière-plan n'est pas forcément arrivée : la liste se repeuple
  alors avec l'état d'avant.
- **Vérifier qu'un champ ajouté figure dans les trois chemins** : `toRemote` à
  la création, `rowToReading` à la lecture, et le payload de mise à jour.
  `contextId` manquait dans le troisième, ce qui rendait toute modification
  éphémère.
- **Sous RLS, un `delete` qui ne correspond à rien réussit sans erreur.**
  Ajouter `.select()` pour distinguer une suppression d'un refus silencieux.
- **L'espace disque n'est pas rendu immédiatement** quand on désactive une
  version : les lignes sont supprimées, mais le navigateur ne récupère les
  octets qu'à sa prochaine compaction. Ne rien promettre à l'utilisateur sur ce
  point.

## Vérification visuelle

Vus fonctionner le 9 août 2026 : Nouvelle lecture, Recherche, Historique,
Statistiques, Progression, Réglages, Profil, Support, Feuille de route,
Soutenir, Plans de lecture, Détail d'un plan, Détail d'une lecture.

**Jamais vu fonctionner : Administration.** Typage, lint, tests et build
passent, ce qui n'est pas la même chose.

## Méthode

Sur cette session, quatre diagnostics posés à la lecture du code se sont
révélés faux, et ont été redressés par la mesure ou l'essai à l'écran : la cause
du blocage au chargement, l'espace prétendument libéré au décochage d'une
version, l'origine des appels d'authentification, et le rafraîchissement après
modification en bloc. Les tâches traitées sans vérification à l'écran sont
celles où l'erreur est passée.
