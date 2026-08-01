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
