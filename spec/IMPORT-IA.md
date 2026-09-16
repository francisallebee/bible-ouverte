# Import de lectures par IA — cadre avant le premier geste

Demandé par le propriétaire le 16 septembre 2026 au soir, pour la séance
suivante. Ce document pose ce que l'architecture du dépôt impose déjà, et ce
qui reste à trancher — **par le propriétaire**, avant toute ligne de code.

## La demande, telle qu'elle a été faite

Une « fonction avancée » : extraire des références bibliques d'une source par
IA, et les enregistrer dans les lectures. Quatre entrées :

1. une **photo**, de la galerie ou de l'appareil, avec reconnaissance « en
   temps réel » ;
2. un **fichier** — pdf, csv, excel, word, txt et autres ;
3. le **presse-papier**, copier-coller ;
4. l'**audio** et la dictée vocale.

Trois contraintes : **aucun fichier stocké**, traitement en temps réel avant
enregistrement, **plusieurs langues**.

## Ce que le dépôt impose déjà

- **Un secret ne vit que côté serveur.** Le navigateur parle à Supabase avec la
  clé anon ; une clé d'API de modèle ne peut exister que dans une route
  `src/app/api/`, avec `cache: 'no-store'` (piège 1) et l'identité de
  l'appelant vérifiée. Ce sera la première route qui ne sert pas la clé
  service_role, et la première à appeler un modèle.
- **Le propriétaire dépose la clé lui-même**, dans l'environnement Vercel —
  Production seulement, comme `service_role`. Un agent ne dépose ni clé ni mot
  de passe. Sans elle, la route rend un `500` nommé, jamais un `200` vide.
- **Une fonction Vercel accepte 4,5 Mo de corps.** Un PDF de 10 Mo ne passe
  pas tel quel ; un fichier Office non plus sans extraction. Ce plafond décide
  de l'endroit où le texte est extrait (voir les décisions).
- **Rien n'est stocké** : ni bucket, ni colonne, ni journal du contenu. La
  route reçoit, appelle, rend des références, oublie. Ce qui peut être
  consigné sans trahir la promesse : un compteur d'appels par compte, s'il
  faut un quota — et alors c'est une table, donc une migration d'abord.
- **Une septième voie de création de lecture.** Il y en a six, toutes
  trouvées par `tsc` parce que les champs sont obligatoires. La septième passe
  par le même store, avec `contextId`, `sessionTitle`, `translationId`, et
  `passageText` pris dans le cache local de la version lue — jamais dans la
  réponse du modèle.
- **Les références sortent en codes USFM** (`GEN`, `2CH`), pas en noms : c'est
  ce que `readings.book` stocke, et c'est ce qui rend l'import indépendant de
  la langue de la source. `i18n/books.ts` connaît les noms dans les cinq
  langues ; le modèle peut les recevoir pour lever une ambiguïté.
- **Tout texte visible passe par les dictionnaires** (règle 10), y compris les
  consignes envoyées au modèle si elles portent la langue de l'utilisateur.
- **Un chapitre sans versets est un chapitre entier** (`chapitreEntier`) ;
  « Jean 3 » extrait d'une photo s'enregistre 3:1-36, pas 3:1.
- **Rien ne s'enregistre sans relecture.** Le modèle propose, le lecteur coche.
  C'est la seule protection contre une référence mal lue, et elle coûte un
  écran de validation — une liste de propositions, chacune modifiable par le
  sélecteur de passage existant.
- **`/avance` est un cadre vide pour l'administrateur, et `isAdmin` vient du
  navigateur** : il ne protège rien. Si la fonction est réservée, la route
  doit vérifier le droit elle-même, en base.
- **Charger le skill `claude-api` avant de nommer un modèle** ou d'écrire un
  appel : identifiants, formats acceptés (le PDF est pris nativement, l'image
  aussi ; l'audio ne l'est pas), coût par appel.

## Les décisions du propriétaire

Chacune change ce qui se construit. Aucune n'a de bonne réponse par défaut.

| # | Question | Ce qui pèse d'un côté et de l'autre |
|---|---|---|
| 1 | **Pour qui ?** Tous les lecteurs, ou l'administrateur seul dans `/avance` ? | Tous : un quota par compte s'impose, donc une table et une migration. Admin seul : plus simple, mais la vérification se fait en base, pas par `isAdmin` du navigateur. |
| 2 | **« Temps réel » sur la photo** : reconnaissance sur l'appareil, ou par le modèle ? | Sur l'appareil (tesseract.js) : une dépendance nouvelle (règle 6), 2 à 4 Mo de moteur plus un dictionnaire par langue, et un OCR qui ne comprend pas ce qu'il lit. Par le modèle : une image envoyée, une à deux secondes, un coût par prise — le « temps réel » devient « viseur, déclenchement, résultat ». |
| 3 | **Les fichiers Office et les gros PDF** : extraire le texte dans le navigateur, ou envoyer le fichier ? | Dans le navigateur : deux ou trois dépendances (Word, Excel), rien ne quitte l'appareil que du texte, et le plafond de 4,5 Mo ne gêne plus. Envoyer : plus simple, mais borné à 4,5 Mo et le fichier transite. Le PDF peut aller nativement au modèle sous le plafond. |
| 4 | **L'audio** : la reconnaissance vocale du navigateur, ou une transcription serveur ? | Web Speech API : aucune dépendance, cinq langues, rien ne passe par notre serveur — mais Chrome envoie l'audio chez Google, et Firefox ne l'a pas. Transcription serveur : le modèle du dépôt ne prend pas d'audio ; il faudrait un second fournisseur. |
| 5 | **Ce que l'IA extrait** : les références seules, ou aussi une date, un titre, un contexte (« prédication du 14 septembre sur Jean 3 ») ? | Références seules : une seule chose à relire. Davantage : l'écran de validation grossit, mais une photo de notes de culte donne la lecture complète d'un coup. |
| 6 | **Quel modèle, et quel plafond de coût par lecteur et par jour ?** | À poser avec le skill `claude-api` : le plus petit modèle qui lit une image suffit probablement pour des références ; le coût par photo décide du quota. |
| 7 | **Une trace de l'import sur la lecture ?** `sessionTitle` « Import photo du 16 septembre », ou rien qui la distingue d'une saisie ? | Une trace aide à retrouver et à corriger en bloc ; rien respecte la promesse « aucune donnée du fichier » au sens le plus strict. |

## Les réponses du propriétaire — 17 septembre 2026

| # | Décision | Conséquence dans le dépôt |
|---|---|---|
| 1 | **L'administrateur seul, pour le moment** | Pas de quota par lecteur, donc pas de table pour ça. La route vérifie `is_admin` **en base**, jamais par le `isAdmin` du navigateur. La fonction vit dans `/avance`. |
| 2 | **OCR sur l'appareil** | `tesseract.js` entre au dépôt (règle 6, justifiée par la décision) : le moteur plus un dictionnaire par langue, chargés à la demande comme les bibles, jamais par `import()`. L'image ne quitte pas l'appareil ; seul le texte reconnu poursuit. |
| 3 | **Les deux** pour les fichiers | Extraction dans le navigateur pour Word, Excel, csv, txt (deux dépendances) ; envoi du fichier pour le PDF sous 4,5 Mo, sinon extraction locale. |
| 4 | **Transcription serveur** | Voir la tension ci-dessous : le modèle du dépôt ne prend pas d'audio. |
| 5 | **Tout quand c'est possible** — références, date, titre, contexte | L'écran de validation porte toute la lecture proposée, chaque champ modifiable avant enregistrement. |
| 6 | **Modèle gratuit, cinq par jour** | Voir la tension ci-dessous. Le compteur « cinq par jour » pour un seul compte tient dans les réglages `jsonb` (comme Verset du jour date sa visite), sans table. |
| 7 | **Une trace** | `sessionTitle` porte la source et la date — « Import photo · 17 septembre 2026 » — et le contexte reste au choix du lecteur. |

### Deux réponses que les faits contredisent en partie

**« Transcription serveur » et « modèle gratuit » ne tiennent pas ensemble
tels quels.** Les modèles Claude ne prennent pas d'audio en entrée : une
transcription côté serveur suppose **un second fournisseur**, avec son
compte et sa clé — et aucun n'est gratuit au sens d'une clé qu'on n'a pas à
payer. Deux issues, à trancher :

- la reconnaissance vocale **du navigateur** (Web Speech API) : gratuite,
  cinq langues, rien ne passe par notre serveur — mais Chrome envoie l'audio
  chez Google, et Firefox ne l'a pas ;
- un fournisseur de transcription **choisi par le propriétaire**, dont il
  dépose la clé lui-même ; le dépôt n'en désigne aucun.

**Il n'existe pas de modèle Claude gratuit** : l'API est facturée à l'usage.
« Gratuit, cinq par jour » peut vouloir dire deux choses, et elles ne
construisent pas la même fonction :

- **aucun modèle payant du tout** — alors les références s'extraient **sans
  IA**, par un analyseur déterministe des cinq langues (`i18n/books.ts`
  connaît les noms, la versification borne les chapitres), ce qui couvre
  photo, fichiers et presse-papier une fois le texte obtenu, mais pas le
  « tout » du point 5 (date, titre, contexte), qui demande de comprendre ;
- **le plus petit modèle, plafonné à cinq appels par jour** — quelques
  centimes par jour au plus, une clé déposée par le propriétaire, et le
  point 5 devient possible.

Tant que ces deux points ne sont pas tranchés, la séance suivante peut
commencer par ce qui n'en dépend pas : l'OCR sur l'appareil, l'extraction
des fichiers dans le navigateur, le presse-papier, l'analyseur déterministe
de références, et l'écran de validation.

## Ce qui est construit, et comment

### L'analyseur, `lib/import/references.ts`

Déterministe, sans dépendance. Il lit les noms de `i18n/books.ts` dans les
langues qui en portent — **fr et en**, `BY_LOCALE` étant un `Partial` où
l'espagnol, l'italien et l'arabe retombent sur le français, un reste du piège 9
que l'import rend visible — plus une table d'abréviations usuelles mêlant les
deux langues. Ordinaux sous toutes leurs formes (« 1 », « 1re », « 1ère »,
« I », « 1st »), séparateurs `:` `.` et virgule collée, mots « verset » et
« verse », listes, intervalles à cheval sur deux chapitres, points-virgules,
livres à un chapitre (« Jude 3 » est un verset, « Philémon 1 » seul est le
livre). Un chapitre sans versets est un chapitre entier par `dernierVerset`.

Il rend **deux listes** : les références, et les rejets avec leur raison —
`ordinal-manquant` (« Samuel 3 »), `tome-inexistant` (« 3 Samuel »),
`chapitre-inexistant`, `verset-inexistant`. Rien ne disparaît en silence ;
rien n'est rogné : « Jean 3:40 » est refusé, pas ramené à 36.

La normalisation garde la **longueur** du texte — un caractère pour un — afin
que chaque référence porte le fragment exact d'où elle vient, tel qu'écrit.
C'est ce fragment que l'écran montre sous la référence lue : c'est là qu'une
erreur d'OCR se verra.

### L'écran, `components/import/ImportLectures.tsx` dans `/avance`

Un champ de texte, « Analyser », les propositions cochées avec leur fragment,
les rejets sur fond ambre, puis date, version, contexte (`ContextPicker`, le
même que partout), nom de séance — par défaut « Import presse-papier · date »,
la trace décidée le 17 — et « Enregistrer n lectures ». Chaque lecture passe
par `addReading`, `passageText` pris dans le cache par `getPassagesForRange`,
comme les six autres voies.

Éprouvé par un aller-retour réel, session du propriétaire, serveur de
développement : un texte de culte avec six références dont deux fausses →
4 propositions, 2 rejets nommés ; trois décochées ; Psaumes 23 enregistré —
ligne **897**, `PSA 23:1-6`, 626 caractères de Louis Segond, contexte
`bible`, séance « Import presse-papier · 17/09/2026 » ; vu dans l'historique
sous ce titre ; effacé par l'écran Détail de la lecture, qui vide aussi le
cache local ; base revenue à **745**, ligne 897 absente.

### Ce qui suit, dans l'ordre

1. Les fichiers : txt et csv sans dépendance, Word et Excel par extraction
   dans le navigateur (deux dépendances), PDF sous 4,5 Mo.
2. L'OCR sur l'appareil (`tesseract.js`), galerie puis appareil.
3. Les deux arbitrages ouverts : l'audio, le modèle.

## Ce qui n'est pas demandé, et qu'il faudra dire

- La confidentialité : une photo de notes personnelles part chez un tiers pour
  être lue. À écrire à l'écran, une fois, avant le premier envoi.
- Les droits : le texte biblique d'une photo n'est pas réécrit en base —
  `passageText` vient du cache local, comme ailleurs. La question de
  `spec/DROITS.md` ne s'ouvre pas ici.
- L'hors-ligne : cette fonction n'en a pas. C'est une exception assumée, comme
  la messagerie.

## Journal

| Date | Fait |
|---|---|
| 16 sept. 2026 | Demande reçue, cadre écrit. Aucune décision prise, aucun code. |
| 17 sept. 2026 | Sept réponses reçues et consignées. Deux tensions relevées : transcription serveur sans fournisseur, modèle gratuit qui n'existe pas. Aucun code. |
| 17 sept. 2026 | **Premier étage livré** : `lib/import/references.ts`, l'analyseur déterministe (53 tests), et `components/import/ImportLectures.tsx` dans `/avance` — le presse-papier, l'écran de validation, la septième voie de création. Vu et éprouvé par un aller-retour réel : Psaumes 23 enregistré (ligne 897, texte du cache, séance « Import presse-papier · 17/09/2026 »), vu dans l'historique, effacé par l'écran, base revenue à 745. |
