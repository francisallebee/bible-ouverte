-- Un ticket clos ne reçoit plus de réponse, et le verrou est en base.
--
-- La clôture d'un ticket appartient au seul administrateur — c'était déjà le
-- cas, `guard_ticket_update` restaurant `status` depuis l'ancienne ligne pour
-- tout appelant ordinaire. Ce qui manquait, c'est la conséquence : un ticket
-- clos restait ouvert aux commentaires, puisque `replies` est précisément la
-- colonne que le garde laisse passer.
--
-- Masquer le champ de saisie dans l'écran Support ne suffirait pas. La RLS est
-- la seule barrière du projet : le navigateur parle directement à Supabase avec
-- la clé anon, et un appel depuis la console contournerait n'importe quel
-- composant. Le refus doit donc venir d'ici.
--
-- L'administrateur, lui, n'est pas concerné : il sort de la fonction avant ce
-- contrôle, comme pour tout le reste. C'est nécessaire — sans quoi il ne
-- pourrait plus rouvrir un ticket qu'il vient de clore.
--
-- Le refus est une exception et non une restauration silencieuse, contrairement
-- aux autres colonnes de ce garde. Les deux ne jouent pas le même rôle : une
-- colonne restaurée corrige une écriture illégitime dont l'auteur n'a pas à
-- être averti, tandis qu'une réponse refusée doit remonter jusqu'à celui qui
-- l'a rédigée. Sans elle, `addReply` croirait avoir écrit, et la réponse
-- disparaîtrait à la synchronisation suivante sans un mot.

create or replace function public.guard_ticket_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  if old.status = 'closed' then
    raise exception 'ticket clos : plus aucune réponse ne peut y être ajoutée';
  end if;

  new.id := old.id;
  new.user_id := old.user_id;
  new."userName" := old."userName";
  new.type := old.type;
  new.message := old.message;
  new.status := old.status;
  new."createdAt" := old."createdAt";
  return new;
end;
$$;

revoke all on function public.guard_ticket_update() from public, anon, authenticated;
