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
| `20260801120003_private_helpers.sql` | Sort les fonctions internes de la surface d'API PostgREST — **pas encore appliquée** |

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

Les migrations `…120000`, `…120001` et `…120002` ont été appliquées le
1er août 2026. Constat avant application, sur la base réelle :

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

`…120003` reste à appliquer : elle déplace `is_admin()` dans un schéma `private`
pour que PostgREST cesse de l'exposer en `/rest/v1/rpc/`, et révoque le droit
d'exécution des fonctions de trigger. Sans elle, deux avertissements subsistent
dans l'analyseur de sécurité Supabase.

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
