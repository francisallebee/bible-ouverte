-- Un jour de plan peut porter un texte à lire, en plus de ses passages.
--
-- Depuis le 17 septembre 2026, un plan se crée depuis un document — texte,
-- Word, PowerPoint, OpenDocument, EPUB, PDF —, chaque ligne qui porte une
-- référence devenant un jour. Le propriétaire a demandé le même jour un second
-- mode : ne pas retenir que les références, mais **lire le document dans son
-- intégralité** — un recueil de méditations dont chaque jour a sa page et ses
-- passages. Il faut donc que le jour porte cette page.
--
-- Une colonne `text`, nulle par défaut, sur la table qui a déjà la maille du
-- jour — la même décision que `passages` le 19 août : ni table jointe, ni RLS
-- de plus, ni reprise de données. Un jour sans texte se lit exactement comme
-- avant ; un appareil resté sur l'ancienne version ignore la colonne et montre
-- les passages seuls — tronqué, jamais faux.
--
-- Aucun `grant` : `plan_days` a l'`UPDATE` au niveau table pour
-- `authenticated`, vérifié par `information_schema.table_privileges` le
-- 17 septembre 2026 — le cas de `readings`, pas celui de `profiles`.
--
-- Rien n'est stocké du fichier lui-même : la colonne porte le texte que le
-- lecteur a choisi de garder, découpé par jour, et rien d'autre.

alter table public.plan_days
  add column if not exists texte text;

comment on column public.plan_days.texte is
  'Texte à lire ce jour, en plus des passages — la page d''un document dont le plan est tiré. Nul = passages seuls.';
