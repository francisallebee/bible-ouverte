-- Écrire un courriel sans déposer de message dans l'application.
--
-- Il y a des mots qui n'ont pas à rester : une relance, une convocation, un
-- avis ponctuel. Les laisser dans la boîte de réception encombre un fil que
-- l'utilisateur relira pour autre chose.
--
-- **Une valeur de `kind`, et non une table de plus.** La colonne existe depuis
-- les vœux d'anniversaire, la fonction Edge lit déjà `messages` sans filtrer
-- dessus, et l'envoi, les tentatives, `emailed_at` et le journal d'audit
-- fonctionnent alors sans une ligne de code neuve. Une table `outbound_emails`
-- aurait demandé sa RLS, sa fonction d'envoi et son propre compteur de
-- tentatives, pour la même chose.
--
-- **Le masquage est dans la RLS, pas dans une requête.** Le navigateur parle
-- directement à Supabase avec la clé anon : filtrer à l'affichage laisserait
-- la ligne lisible depuis la console, ce qui est exactement le raisonnement
-- qui a fait poser le verrou des tickets clos dans la base plutôt que dans
-- l'écran.
--
-- **L'administrateur, lui, continue de les voir.** Un courriel envoyé doit
-- rester retrouvable par qui l'a envoyé — c'est la contrepartie de sa
-- discrétion, et c'est ce qui distingue « invisible pour le destinataire »
-- de « disparu ».

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    (user_id = (select auth.uid()) and coalesce(kind, '') <> 'courriel')
    or private.is_admin()
  );

comment on column public.messages.kind is
  'null : message ordinaire · birthday : vœu d''anniversaire · courriel : envoyé par courriel seul, masqué de la boîte du destinataire';
