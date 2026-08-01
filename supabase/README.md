# Base de données Bible Ouverte

Projet Supabase lié : `bible-ouverte` (`nttasjckcmoqvjchxbzf`).

## Migrations

Les fichiers de `migrations/` s'appliquent **dans l'ordre des noms**, sont
**idempotents** et **non destructifs** : les rejouer sur la production ne perd
aucune donnée.

| Fichier | Contenu |
|---|---|
| `20260801120000_baseline.sql` | Tables, index, RLS des données personnelles, helper `is_admin()`, trigger d'inscription |
| `20260801120001_profiles_rls.sql` | Verrouillage de `profiles` : personne ne peut s'attribuer `is_admin` depuis le navigateur |
| `20260801120002_tickets_roadmap_rls.sql` | Écriture colonne par colonne sur les tickets et la feuille de route |
| `20260801120003_private_helpers.sql` | Sort les fonctions internes de la surface d'API PostgREST |
| `20260801120004_storage_policies.sql` | Cloisonne les buckets `photos` et `audio` par utilisateur |

Ces fichiers remplacent l'ancien `supabase-schema.sql`, qui commençait par sept
`drop table … cascade` : le rejouer effaçait toutes les données utilisateurs.
**Toute évolution passe par un nouveau fichier**, jamais par la modification
d'un fichier déjà appliqué.

## Appliquer

Via le SQL Editor du dashboard Supabase, un fichier après l'autre dans l'ordre.
Ou avec la CLI, une fois installée (`brew install supabase/tap/supabase`) :

```bash
supabase db push
```

## État en production

Les quatre migrations ont été appliquées le 1er août 2026. Constat avant
application, sur la base réelle :

- `authenticated` avait le droit `UPDATE` sur `profiles.is_admin`, et la policy
  était `auth.uid() = id` sans restriction de colonne : **tout compte connecté
  pouvait se promouvoir administrateur** depuis la console du navigateur.
- La colonne `suspended` n'existait pas, alors que le middleware la lit et que
  le back-office l'écrit : **la suspension d'un compte n'avait aucun effet**.
- `tickets` et `roadmap_items` acceptaient un `UPDATE` de n'importe quel compte
  connecté sur n'importe quelle colonne.

Après application, les droits `UPDATE` de `authenticated` sur `profiles` se
limitent à `name`, `color`, `avatar_url`, `birth_date`, `phone`, `bio` et
`social_links`. Aucune ligne n'a été perdue.

`is_admin()` vit désormais dans le schéma `private`, que PostgREST n'expose pas,
et les fonctions de trigger ne sont plus appelables en RPC. L'analyseur de
sécurité Supabase ne signale plus aucun problème de schéma.

## Mots de passe

L'analyseur signale que la **protection contre les mots de passe compromis**
(HaveIBeenPwned) est désactivée. Elle ne peut pas être activée : elle est
réservée au **plan Pro**, et l'organisation ÔAppliday est sur le plan Free. Ce
n'est donc pas une case oubliée, elle n'apparaît pas dans le dashboard.

À défaut, ce sont les règles de robustesse qui ont été renforcées, dans
`config.toml` (`minimum_password_length = 10`,
`password_requirements = "lower_upper_letters_digits"`) et en miroir côté
formulaire dans `src/lib/auth/password.ts`.

Côté serveur, ces deux valeurs se règlent **dans le dashboard**, à
Authentication → Sign In / Providers → Email :

- *Minimum password length* : `10`
- *Password Requirements* : `Lowercase, uppercase letters and digits`

### N'utilise pas `supabase config push` pour ça

`config push` est tout ou rien : il enverrait toute la section `[auth]` de
`config.toml`, produite par `supabase init` avec les valeurs par défaut du
développement local. `site_url` y vaut `http://127.0.0.1:3000`. Les e-mails de
confirmation d'inscription pointeraient vers localhost et les redirections après
connexion seraient rejetées : **l'authentification cesserait de fonctionner en
production**, pour gagner deux réglages de mot de passe.

La CLI n'a pas de `config pull`, donc aucun moyen de fusionner avec l'existant.
Rendre `config push` utilisable supposerait de reconstruire à la main toute la
section `[auth]` à l'identique du dashboard. Tant que ce n'est pas fait, le
dashboard fait autorité.

Sans le réglage serveur, seule la validation du formulaire d'inscription
s'applique — un client appelant `/auth/v1/signup` directement, avec la clé anon
qui est publique par conception, resterait au minimum de 6 caractères.

Les comptes existants ne sont pas affectés : ils continuent de se connecter avec
leur mot de passe actuel, la règle ne s'applique qu'aux créations et aux
changements.

## Stockage

Audit du 1er août 2026 : les buckets `photos` et `audio` sont privés, la RLS est
active sur `storage.objects` — et il n'existait **aucune policy**. Personne ne
pouvait donc rien y lire ni y écrire : pas de fuite, mais des buckets
inutilisables (0 objet stocké).

`20260801120004_storage_policies.sql` les cloisonne par préfixe `{user_id}/`,
la convention déjà employée par la route de suppression de compte, et pose des
limites de taille et de type qui n'existaient pas (10 Mo pour les images, 25 Mo
pour l'audio).

## Vérifier après application

Que `is_admin` est bien hors de portée du client — connecté avec un compte
ordinaire, dans la console du navigateur :

```js
await supabase.from('profiles').update({ is_admin: true }).eq('id', (await supabase.auth.getUser()).data.user.id)
```

La réponse doit contenir une erreur (`permission denied for column is_admin`).
Si la ligne passe, la migration `20260801120001` n'a pas été appliquée.

## Ce qui reste hors du dépôt

Les buckets de stockage `photos` et `audio` sont créés depuis le dashboard et ne
sont pas décrits ici. Leurs policies méritent le même audit que les tables : la
route `/api/admin/users/[id]` y range les fichiers sous un préfixe `{user_id}/`,
et rien dans le dépôt ne garantit qu'un utilisateur ne peut pas lire le préfixe
d'un autre.

## Choix assumés

Le tableau des tickets support est **collectif** : tout utilisateur connecté lit
les tickets des autres, avec le nom de leur auteur. C'est le fonctionnement
voulu de la page Support, pas un défaut de configuration — mais si un jour un
ticket doit pouvoir contenir quelque chose de confidentiel, c'est la policy
`authenticated can read tickets` qu'il faudra revoir.
