-- Archiver et supprimer un message, côté destinataire.
--
-- La boîte ne savait que lire : `read_at` était la **seule** colonne que la RLS
-- laissait écrire à l'utilisateur, et aucune policy `DELETE` n'existait. Un fil
-- s'allongeait donc sans fin, sans moyen d'en écarter ce qui était traité.
--
-- **Deux colonnes, deux gestes qui ne disent pas la même chose.** Archiver,
-- c'est « je l'ai traité » — le message quitte la boîte active et se retrouve
-- sous l'onglet Archivés, d'où il revient d'un clic. Supprimer, c'est « je n'en
-- veux plus » — il disparaît. Les deux sont des horodatages plutôt que des
-- booléens : on sait alors *quand*, ce qu'un `true` ne dit pas, et la colonne
-- nulle reste le cas normal.
--
-- **Supprimer masque, et n'efface pas.** La ligne demeure, invisible pour le
-- destinataire, toujours lisible par l'administration. C'est le choix du
-- propriétaire du dépôt, et c'est la contrepartie exacte du `kind = 'courriel'`
-- du 21 août : un message envoyé doit rester retrouvable par qui l'a écrit,
-- sans quoi l'administration serait incapable de dire ce qu'elle a envoyé. Ce
-- qui est rendu à l'utilisateur, c'est sa boîte — pas le droit d'effacer la
-- mémoire de son correspondant.
--
-- **Le masquage vit dans la RLS, jamais dans une requête.** Le navigateur parle
-- directement à Supabase avec la clé anon : un filtre posé à l'affichage se
-- contournerait depuis la console. Même raisonnement que pour les tickets clos
-- et le courriel seul.
--
-- **Le `grant` colonne est obligatoire ici, et c'est mesuré.** `messages` est
-- dans le cas de `profiles`, pas dans celui de `readings` : relevé le
-- 1er septembre 2026, elle n'a **aucun `UPDATE` au niveau table**, seulement un
-- `grant update (read_at)` pour `authenticated`. Sans les deux colonnes
-- ajoutées à ce grant, l'archivage échouerait sans message clair — la règle 2
-- d'`AGENTS.md`, dans le cas exact qu'elle décrit. La veille, la même
-- vérification sur `readings` avait conclu l'inverse : deux tables, deux
-- régimes, et rien ne se généralise.

alter table public.messages
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

comment on column public.messages.archived_at is
  'Quand le destinataire a archivé le message. Nul = actif. Réversible depuis l''onglet Archivés.';
comment on column public.messages.deleted_at is
  'Quand le destinataire a supprimé le message. Nul = présent. La ligne demeure : seul le destinataire cesse de la voir, l''administration continue de la lire.';

-- Sans ceci, l'écriture est refusée sans message exploitable : `update` est
-- révoqué au niveau table sur `messages`, exactement comme sur `profiles`.
grant update (archived_at, deleted_at) on public.messages to authenticated;

-- Le destinataire ne voit plus ce qu'il a supprimé ; l'administration, si.
-- Les archivés restent visibles des deux côtés : c'est l'écran qui les range
-- sous leur onglet, puisque rien n'a à être caché.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    (
      user_id = (select auth.uid())
      and coalesce(kind, '') <> 'courriel'
      and deleted_at is null
    )
    or private.is_admin()
  );
