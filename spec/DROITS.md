# Les versions sous droits — état des démarches

Ce document existe parce que l'enquête du 16 août 2026 s'est perdue. `REPRISE.md`
en garde la conclusion — « 9 sur 11 sous droits (SBG, ABF, Biblica) » — mais
**pas la liste des onze versions**, ni les conditions relevées, ni les
interlocuteurs. Il a fallu tout refaire le 2 septembre.

Tout ce qui suit porte sa date et sa source. Ce qui n'a pas été vérifié est
signalé comme tel.

## Ce que l'application demande réellement

C'est le point de départ de toute négociation, et il est plus lourd qu'il n'y
paraît. Relevé dans le code le 2 septembre 2026 :

| Question que pose un ayant droit | Réponse, mesurée |
|---|---|
| Affichage à la demande, ou redistribution ? | **Redistribution.** `features/bible/import.ts` télécharge le fichier complet — 31 102 versets, 6 à 10 Mo — et `lib/storage` le conserve dans IndexedDB pour l'hors-ligne |
| Le texte est-il protégé sur l'appareil ? | **Non.** En clair dans IndexedDB, lisible depuis la console. Aucune mesure technique, aucun chiffrement |
| Le texte quitte-t-il l'appareil ? | **Oui, partiellement.** `readings.passageText` recopie le passage lu dans chaque lecture, et la colonne est répliquée chez Supabase (`20260801120000_baseline.sql`) |
| L'export de données emporte-t-il la bible ? | **Non.** `exportData()` sort `readings`, `contexts`, `bible_versions` et `settings` — jamais le magasin `passages`. Seules les citations déjà enregistrées par l'utilisateur en sortent |
| Modèle économique | Gratuit, sans publicité, sans abonnement, soutenu par des dons (`/soutenir`) |
| Taille | 118 comptes au 1er septembre 2026 |

**`copyrightStatus` n'est aujourd'hui qu'une `string` que personne ne lit**
(`lib/storage/types.ts:70`, `features/bible/import.ts:25`). Si une version sous
licence arrive, ce champ devra devenir une union littérale — jamais un
`as Record`, voir le piège 9 du dépôt — et être réellement lu, au moins pour
afficher la mention de copyright exigée.

## Le seuil de 500 versets, et pourquoi il décide de tout

**Trois ayants droit indépendants posent le même plafond**, ce qui en fait une
norme du secteur et non une particularité :

| Source | Plafond de citation libre | Relevé le |
|---|---|---|
| api.bible | cache de **500 versets consécutifs**, purgé à 14 jours | 16 août 2026 |
| Société biblique de Genève | **500 versets**, ni un livre entier, ni plus de **50 %** de l'ouvrage citant | 2 sept. 2026 |
| Alliance biblique française | **moins de 500 versets**, ni un livre entier, ni **25 %** ou plus | 2 sept. 2026 |

Bible Ouverte distribue **31 102 versets** et **66 livres entiers** par version.
C'est **62 fois** le seuil de citation. La demande ne relève donc d'aucun régime
de citation : elle relève de la licence de **reproduction et de distribution**,
qui est une autre conversation, souvent un autre service, et parfois un contrat.

**Conséquence pratique** : une demande qui présente l'application comme
« citant » des versets sera traitée puis retirée à la lecture des conditions.
Dire la copie intégrale hors ligne dès le premier paragraphe coûte moins cher
qu'un accord retiré six mois plus tard.

## Les interlocuteurs

### Société biblique de Genève — Segond 21, Nouvelle Édition de Genève 1979

Détient les droits des deux révisions modernes de Segond. La S21 est la plus lue
du monde évangélique francophone. La diffusion passe par **La Maison de la
Bible**, que plusieurs sites créditent conjointement pour leurs autorisations —
l'interlocuteur pratique est donc peut-être là plutôt qu'à la société elle-même.

Conditions publiques : citation jusqu'à 500 versets sans démarche, ni livre
entier ni plus de 50 % de l'ouvrage citant ; mention
`Version Segond 21 © 2007 Société Biblique de Genève`.

**Contact à vérifier** : non relevé le 2 septembre. Passer par
`universdelabible.net` (leur site) ou La Maison de la Bible.

### Alliance biblique française / Bibli'O — six versions d'un coup

TOB, Nouvelle Bible Segond, Parole de Vie, Nouvelle Français courant, Bible en
français courant, Segond « à la Colombe ». **Le meilleur rapport entre une
démarche et un catalogue.**

| | |
|---|---|
| Adresse | 6 rue Lhomond, 75005 Paris |
| Courriel | `contact@alliancebiblique.fr` |
| Téléphone | +33 (0)9 72 56 15 30 |

Conditions publiques : moins de 500 versets sur support non commercial, ni livre
entier ni 25 % ou plus. Au-delà, autorisation écrite, demandée à cette adresse.

### Éditions du Cerf — traduction liturgique officielle (AELF)

**L'AELF n'accorde pas elle-même les autorisations de reproduction.** Elle gère
les droits, mais renvoie explicitement, dans ses conditions générales, au
*service des droits de reproduction des Éditions du Cerf*. Écrire à l'AELF ferait
perdre un cycle.

Ses conditions précisent en outre que les textes servis par son site et son API
le sont **pour un usage privé** : l'API n'est donc pas une licence de
redistribution, contrairement à ce qu'on pourrait supposer de son ouverture.

### Biblica — Bible du Semeur

**Piste la plus prometteuse, et la moins vérifiée.** Une recherche du
2 septembre 2026 indique que Biblica autoriserait l'usage immédiat de ses textes
dans une application ou un site **véritablement non commerciaux** — sans vente,
abonnement, publicité ni monétisation — et **sans fonction d'intelligence
artificielle ou d'apprentissage automatique**.

Bible Ouverte remplit apparemment ces conditions : gratuite, sans publicité, et
ses trois jeux — quizz, mémorisation, verset du jour — sont **déterministes**,
sans aucun modèle. Deux réserves à lever avant de s'en prévaloir :

1. **La page n'a pas pu être lue** : `biblica.com/permissions` rend `403` à
   l'outil. Cette condition vient d'un résumé de recherche, pas de la source.
   **À confirmer au navigateur avant toute mise en production.**
2. Le **don** n'est ni une vente, ni un abonnement, ni une publicité — mais
   c'est à eux de le dire, pas à nous de le supposer.

Un formulaire de demande d'autorisation existe sur leur site pour les usages qui
sortent du cadre ; la copie intégrale hors ligne en sort probablement.

## L'ordre à suivre, et pourquoi

1. **Biblica d'abord** — parce qu'une autorisation générale existe peut-être
   déjà, et qu'un « oui » sans négociation change l'ordre du reste. Vérifier la
   page avant d'écrire.
2. **Alliance biblique française** — six versions pour une lettre, un
   interlocuteur habitué aux demandes, un contact vérifié.
3. **Société biblique de Genève** — la S21 est la plus demandée, mais le contact
   reste à trouver.
4. **Éditions du Cerf** — le plus lourd : maison d'édition classique, service de
   droits, et une traduction dont l'usage liturgique est encadré.

**Ne pas envoyer les quatre le même jour.** La première réponse apprendra ce que
la demande a de maladroit, et il vaut mieux le corriger sur trois lettres que
sur zéro.

## Ce qui n'est pas demandé, et qu'il faudra peut-être concéder

À garder en réserve pour la négociation, dans cet ordre de coût croissant :

| Concession | Ce qu'elle coûte au dépôt |
|---|---|
| Mention de copyright affichée avec le texte | Une ligne par écran de lecture. `copyrightStatus` existe déjà pour la porter |
| Ne pas écrire `passageText` en base pour ces versions | Un `if` à cinq endroits de création d'une lecture — voir le piège des cinq chemins. L'historique perdrait l'aperçu du texte |
| Retirer ces versions de l'export de données | Faible : `exportData()` ne sort déjà pas le magasin `passages` |
| Rendre le texte non lisible en clair dans IndexedDB | **Réel, et sans garantie.** Tout ce qui s'affiche est extractible ; une obfuscation ralentit, ne protège pas. Ne pas la présenter comme une protection |
| Renoncer à l'hors-ligne pour ces versions | Le cœur du produit. À ne concéder qu'en dernier, et alors la version n'a plus grand intérêt ici |

## Journal

| Date | Fait |
|---|---|
| 16 août 2026 | Onze versions examinées, neuf sous droits (SBG, ABF, Biblica). **Liste perdue.** api.bible écartée : cache 500 versets, purge 14 jours, 5 000 appels/mois |
| 2 sept. 2026 | Enquête refaite et consignée. Trois seuils de 500 versets relevés. Contact ABF vérifié. AELF renvoie au Cerf. Piste Biblica trouvée, non vérifiée (403) |
| **9 sept. 2026** | **Les quatre lettres envoyées**, par le propriétaire du dépôt, chacune par le moyen que son éditeur propose. Aucune réponse à ce jour |

## En attendant les réponses

### Ce qu'il faut surveiller, et quand

Les quatre lettres sont parties le **9 septembre 2026**. L'ordre d'envoi
recommandé n'a pas été suivi — elles sont parties ensemble —, ce qui retire la
possibilité de corriger les trois suivantes à la lumière de la première réponse.
C'est un choix du propriétaire, et il a un avantage que l'échelonnement n'avait
pas : les quatre délais courent en parallèle.

**Une relance est à prévoir vers le 30 septembre.** Un service de droits qui ne
répond pas sous trois semaines n'a le plus souvent pas refusé : il a classé. Une
relance courte, citant la date et l'objet du premier envoi, suffit généralement.

Ce qui vaut réponse, et ce qui n'en est pas une :

| Reçu | Ce que cela vaut |
|---|---|
| Un accord de principe par courriel | **Suffisant pour développer**, pas pour publier — demander les termes écrits, la mention exacte et la durée |
| Un renvoi vers un autre service | Une réponse utile : elle corrige l'aiguillage, comme l'AELF l'a fait vers le Cerf |
| Un barème ou un contrat | La question devient économique, et elle sort du dépôt |
| Rien, après relance | Ne pas conclure au refus : consigner la date et passer à la suivante |

### La seule chose certaine, quelle que soit la réponse

**Les quatre exigeront une mention de copyright affichée avec le texte.** C'est
la condition commune à toutes les licences bibliques, et la seule que l'on
puisse préparer sans connaître la réponse.

Or `copyrightStatus` n'est aujourd'hui qu'une `string` que **personne ne lit** —
`lib/storage/types.ts` et `features/bible/import.ts` la déclarent, aucun écran ne
l'affiche. La préparer demande trois choses, dans cet ordre :

1. **Typer plus fort.** Une union littérale — `'public-domain' | 'licensed'` —
   et jamais un `as Record`, qui désarmerait le garde-fou (piège 9, rencontré
   trois fois).
2. **Porter le texte de la mention**, et non seulement le statut : chaque
   éditeur impose sa formule exacte. « Version Segond 21 © 2007 Société Biblique
   de Genève » n'est pas interchangeable avec celle de l'Alliance biblique.
3. **L'afficher partout où le texte apparaît** — l'aperçu, la recherche
   biblique, le verset du jour, la mémorisation, le détail d'une lecture. C'est
   un inventaire de chemins, du même genre que les cinq points de création d'une
   lecture, et il se fera par `tsc` si le champ devient obligatoire.

Ajouter la version elle-même reste ensuite les **trois gestes de la règle 13** :
le script de téléchargement, `TEXT_VERSIONS`, et `VERSIONS` de
`features/bible/import.ts`.

### Ce qui n'est toujours pas vérifié

La page `biblica.com/permissions` n'a jamais pu être lue — `403` à l'outil le
2 septembre. La piste d'une autorisation immédiate pour usage non commercial
reste donc une information de seconde main, et la lettre partie chez eux pose
justement la question. **Leur réponse tranchera ; le résumé de recherche, non.**
