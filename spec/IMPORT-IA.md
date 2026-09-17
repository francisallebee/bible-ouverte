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

### Les fichiers, `lib/import/fichiers.ts`

**Sans dépendance**, et c'est une décision : Word, Excel, PowerPoint et
OpenDocument sont des archives zip de XML, et le navigateur dégonfle le
deflate lui-même (`DecompressionStream('deflate-raw')` — Safari ≥ 16.4,
Chrome ≥ 80, Firefox ≥ 113). Un lecteur zip de cinquante lignes — fin de
répertoire, répertoire central, en-têtes locaux, méthodes 0 et 8 — remplace
`mammoth` et `xlsx`, dont la version npm traîne des vulnérabilités que son
auteur ne corrige plus là. Le texte brut (`txt`, `md`, `csv`, `tsv`, `log`,
tout `text/*`) se lit en UTF-8 strict avec repli en windows-1252 ; le HTML
perd scripts, styles et balises, ses blocs deviennent des lignes. Excel rend
une ligne par ligne, tabulations entre les cellules, chaînes partagées
résolues. Le `pdf` est **refusé avec sa raison** : l'extraire dans le
navigateur demanderait `pdfjs-dist`, l'envoyer au serveur suppose le modèle
— l'arbitrage ouvert. 15 tests, les fixtures zip fabriquées par le test.

À l'écran, « Choisir un fichier » à côté d'« Analyser » : le texte extrait
**atterrit dans le champ** — le lecteur voit ce qui a été lu —, l'analyse
part aussitôt, la séance se nomme « Import culte.docx · date ». Un refus
s'affiche avec sa phrase et laisse le champ intact.

**L'essai réel a trouvé un défaut que 53 tests ignoraient.** Un `.docx`
fabriqué dans le panneau — « Romains 8:28-30 ; 1 Jean 4:8 » — rendait
« Romains 1 » et perdait « 1 Jean 4:8 » : le point-virgule enchaîne les
chapitres du même livre, et l'ordinal du livre suivant avait été pris pour
un chapitre ; le nom, déjà dépassé, n'était plus vu. La virgule avait le même
angle mort (« Jean 3:16, 1 Pierre 2:9 »). Un nombre suivi d'un nom de livre
n'est jamais un chapitre ni un verset : `enchainer` regarde avant de
consommer le séparateur. Deux tests de plus ; 70 sur l'analyseur.

Vu, session du propriétaire : le `.docx` → 4 références justes, dont
« 1 Jean 4:8 » ; un `.pdf` → le refus, le champ intact.

Relevé d'écriture, hors de l'import : « Jude 1:3 » — `ecrireReference`
écrit le chapitre des livres qui n'en ont qu'un, où l'usage écrit « Jude 3 ».

### La photo, `lib/import/ocr.ts`

**La seule dépendance de la fonction** : `tesseract.js` 7.0.0, la décision 2
du propriétaire. Bornée trois fois — chargée par `import()` au premier usage,
donc dans son propre chunk (`_app-pages-browser_node_modules_tesseract_js…`,
vu au journal réseau, chargé au clic et pas avant) ; le moteur WASM et le
script du worker viennent de jsDelivr, le dictionnaire de la langue de
tessdata, une fois, gardés en IndexedDB par la bibliothèque ; **la photo ne
quitte pas l'appareil** — dessinée dans un canevas réduit à 2 000 px et
redressée selon son EXIF, c'est le canevas que le moteur lit. `npm audit`
compte **31** vulnérabilités avant comme après l'installation (`AGENTS.md`
en annonçait 7 : la note était périmée, pas la dépendance coupable).

La langue de l'interface décide du dictionnaire (`fra`, `eng`, `spa`, `ita`,
`ara` — un `Record<Locale, string>` que le test lit depuis `LOCALES`). Le
worker est gardé d'une photo à l'autre pour une même langue : son
initialisation coûte des secondes, la lecture une ou deux. Le rapporteur de
progression est une variable de module lue par le `logger`, pas la fonction
de la première photo figée dans le worker.

À l'écran, « Photo » à côté des deux autres boutons ; `accept="image/*"`
**sans** `capture`, pour qu'iOS propose l'appareil *et* la photothèque. Une
ligne d'état : « Préparation de la lecture… » pendant le chargement, puis le
pourcentage. Une photo sans texte le dit, une lecture qui échoue aussi.

Vu, session du propriétaire : un canevas de 1 400 × 500 où trois lignes
étaient écrites en Georgia 64 px, exporté en PNG et posé sur le champ —
**texte reconnu exact au caractère en moins de 18 secondes**, téléchargements
compris ; 3 références, dont « Romains 8, verset 28 » lu 8:28. Le journal
réseau de la page ne porte que les chunks de Next et un `blob:` (le worker) ;
les téléchargements du moteur se font dans le worker, hors du journal de la
page, vers les hôtes que le code de la bibliothèque nomme.

**La compilation de production n'a pas pu être vérifiée ici.** Deux `next
build` dans un `worktree` séparé — donc sans le `.next` partagé du piège 28 —
se sont figés au même point, le côté serveur compilé, la trace arrêtée au
milieu des modules client, pas un octet en dix minutes. Google Fonts répond
200 depuis le bac à sable ; ce n'est pas `next/font`. **Hypothèse** : le bac à
sable laisse partir les processus de travail de webpack et les bloque
ensuite, et le piège 28 du 16 septembre avait la même cause. Vercel jugera au
push, avec une sonde ; ce n'est pas la discipline voulue, c'est ce que le bac
à sable laisse.

### Vu par le propriétaire, en production — 17 septembre 2026

« Avec presse-papier tout est ok. » « Avec photo, ça fonctionne aussi. » Ce
sont les premières preuves d'écran de la fonction qui ne viennent pas de
l'agent, et elles portent sur la production, pas sur le serveur de
développement. La photo était une vraie photo, pas un canevas.

Et une demande née de l'usage : **« Actes 3/8 » n'était pas lu**, il fallait
corriger en « 3.8 » à la main. La barre oblique est désormais un séparateur
(« Actes 3/8 », « Actes 3 / 8 », « Actes 3/8-10 »), et « 3 : 8 » avec espaces
l'était déjà.

### Les six retours du 17 septembre, et ce qu'ils ont donné

| Demande | Fait |
|---|---|
| « / » comme séparateur | `SEPARATEUR_VERSET` l'accepte ; 4 tests |
| Photo sur plusieurs pages | `multiple` sur le champ ; les pages lues l'une après l'autre, « page 2 sur 5… 40 % », textes joints par une ligne vide. Vu : deux canevas en 3 s, 4 références |
| EPUB, Kindle, autres livres | **EPUB** lu par le lecteur zip — `container.xml` → OPF → `spine`, l'ordre de lecture et non celui de l'archive, repli sur les XHTML triés ; **FB2** (XML nu) lu. **Kindle refusé avec sa raison** : `mobi`/`azw`/`azw3`/`kfx` sont un format binaire propriétaire et les livres achetés sont chiffrés par une clé que seul le compte Amazon détient — aucun lecteur ne les ouvre. Le message dit : convertir en EPUB, ou copier le texte |
| Un lien vers un document | La route `api/import/lien` — voir ci-dessous |

### Le lien, `api/import/lien` — la première route de l'import

Un navigateur ne peut pas lire une page d'un autre site (CORS). La route va la
chercher et **rend les octets tels quels** ; le navigateur en fait un `File`
nommé par l'en-tête `X-Import-Nom` (`nomDeFichierPour` : le nom de l'adresse
s'il porte une extension que le type confirme, sinon `page.html`, `123.pdf`)
et le passe au même `texteDuFichier` qu'un fichier choisi — **une seule voie
d'extraction**. La route ne garde rien, ne lit rien du contenu, et c'est la
première du dépôt qui ne sert pas la clé service_role : elle existe pour le
CORS, pas pour un droit de plus.

Garde-fous : `requireAdmin` — `is_admin` lu en base avec la session de
l'appelant, comme les routes d'administration ; `adresseAdmise` — `http(s)`
seuls, ni identifiants dans l'adresse, ni `localhost`, `.local`, `.internal`,
ni les plages privées, le lien-local `169.254.x` (les métadonnées des
hébergeurs) et les équivalents IPv6 ; l'adresse **finale** rejugée après
redirection ; dix secondes ; quatre mégaoctets, la lecture arrêtée net au-delà
même si le serveur n'annonce pas sa taille. 23 tests sur la part pure.

Vu, session du propriétaire : `http://localhost:3000/admin` → « Cette adresse
désigne un réseau interne » ; la page Wikipédia « Jean 3:16 » rapportée en
9 s, 11 256 caractères, 5 références, séance « Import Jean_3:16.html · date ».

**Cette page réelle a montré un troisième défaut de l'analyseur** : « p. 490 »,
« P66 », « P52 » signalés « quel tome ? » — `p` est l'abréviation de Pierre.
Une abréviation d'une ou deux lettres sans ordinal n'est presque jamais un
livre (une page, un chapitre, un papyrus) ; elle est désormais ignorée en
silence, et « Samuel 3 » reste signalé. Troisième fois qu'un texte réel bat
la suite verte : 113 tests sur l'import après.

### Les arbitrages, tranchés le 17 septembre au soir

- **La dictée vocale est abandonnée** : l'utilisateur se sert de celle de son
  appareil, qui écrit dans le champ. La tension « transcription serveur »
  tombe avec elle.
- **L'audio est un fichier**, importé par une fonction distincte.
- **Le modèle est remis à plus tard.** Le « tout » du point 5 attend avec lui.
- **Le PDF entre dans l'import de fichiers**, sans modèle.

### Le PDF, `lib/import/pdf.ts`

`pdfjs-dist` 6.3 — le lecteur de Firefox —, deuxième dépendance de l'import,
chargée par `import()` au premier PDF, son worker depuis jsDelivr à la version
exacte installée. `npm audit` : 31 avant, 31 après. Le texte est extrait
**page par page**, et une page qui n'en porte pas — un scan — est dessinée
dans un canevas à la taille que l'OCR lit le mieux et passe par
`reconnaitreCanevas`, le moteur de la photo (extrait d'`ocr.ts` pour cela).
Un document peut mêler les deux ; la décision se prend à chaque page, sous un
seuil de vingt caractères. La progression dit la page, et l'OCR quand il y en a.

Vu : un PDF fabriqué dans la page — trois lignes en Helvetica — lu en 1 s,
texte exact, 4 références (« Actes 3/8 » → 3:8), séance « Import culte.pdf ·
date » ; un PDF sans texte → le chunk de Tesseract demandé, la page blanche
lue, « Aucune référence reconnue », pas d'erreur. Le test unitaire vérifie que
`fichiers.ts` confie le PDF à `pdf.ts` avec la langue — `pdf.js` a besoin d'un
navigateur.

### L'audio, `lib/import/audio.ts`

**Sans modèle payant, il reste un modèle de parole sur l'appareil** — Whisper
« tiny » (`onnx-community/whisper-tiny`, ~40 Mo une fois, gardés par le
navigateur), cinq langues, par `transformers.js`. **Aucune dépendance npm** :
`@huggingface/transformers` tire `sharp` et `onnxruntime-node`, deux binaires
natifs que le navigateur n'emploie pas ; la bibliothèque vient de jsDelivr à
la demande, version épinglée, par un `import()` que `webpackIgnore` laisse au
navigateur. Mono-fil et sans worker (`numThreads = 1`, `proxy = false`) : une
origine tierce ne crée pas de workers sans détours. Plus lent, mais sûr.

Le fichier est décodé par l'API Web Audio — tout format que le navigateur
lit —, rééchantillonné à 16 kHz en mono par un `OfflineAudioContext`, borné à
30 minutes. Les étapes sont dites parce qu'elles durent : décodage,
téléchargement du modèle en pourcentage, transcription. Une sortie sans
lettre ni chiffre — le « ... » d'un silence — vaut « aucune parole ».

Vu : un WAV de trois secondes de sinusoïde — décodé, bibliothèque et modèle
téléchargés, transcrit en « ... » en 21 s tout compris, sans erreur. **Ce
n'est pas une preuve de qualité**, seulement que la chaîne tient ; ce que
Whisper tiny vaut sur une vraie voix, le propriétaire le verra. À dire au
lecteur, et c'est écrit sous le bouton : honnête sur une voix claire et
proche, médiocre sur un culte enregistré de loin, plus lent que le réel sur un
téléphone.

### Vu par le propriétaire en production, seconde fois — 17 septembre au soir

« PDF ok. » « Choisir un fichier ok. » Et deux retours qui ont changé la forme :

- **La photo multi-pages « ne semble pas fonctionner »** — et pour cause : sur
  iOS, l'appareil ne prend qu'une image par ouverture ; le `multiple` ne
  valait que pour la galerie, où le propriétaire ne voulait pas aller. Le
  bouton ouvre désormais **directement l'appareil** (`capture="environment"`),
  une photo à la fois, et le texte reconnu **s'ajoute** au champ à la suite du
  précédent ; une page de plus est une photo de plus, l'analyse suit chaque
  ajout. Le multi-pages est devenu une suite de prises. Vu : deux prises →
  « Actes 3:8 » puis « Actes 3:8, Luc 15:11-32 », un seul champ.
- **« Audio ne sert à rien » comme bouton** : retiré. Un enregistrement se
  choisit par « Choisir un fichier », comme un document — `fichiers.ts`
  reconnaît `mp3`, `m4a`, `wav`, `ogg`, `aac`, `flac`… et tout `audio/*`, et
  confie le fichier à `audio.ts`. « Aucune parole » et « trop long » sont des
  refus de fichier nommés, comme Kindle. Vu : un WAV par le sélecteur →
  modèle repris du cache, transcription, « Aucune parole reconnue ».

Une porte pour tous les fichiers, une pour l'appareil, une pour le lien, et
le champ pour le reste.

### Un plan de lecture depuis un document — 17 septembre au soir

« Créer un plan de lecture à partir d'un document Texte, Word, PowerPoint,
OpenDocument, EPUB, PDF avec autant de facilité que les autres plans. » Tout
existait sauf la sortie : le texte sort par `texteDuFichier`, les références
par `extraireReferences`, et `lib/plans/from-document.ts` en fait des jours.

**La règle : une ligne qui porte au moins une référence est un jour**, avec
tous ses passages — la forme des plans qu'on imprime, « Jour 12 : Genèse
25-26, Psaume 9 ». Les lignes sans référence (titres, « Semaine 3 »,
consignes) sont passées et comptées. Second découpage offert : un passage par
jour. Les rejets remontent avec leur fragment. `documentDayRows` écrit les
jours par `toDayColumns`, datés à partir d'un début ou libres (date vide) ;
en base c'est l'un des deux `PlanKind` existants — l'écran du plan n'a rien à
apprendre. 7 tests.

Dans le formulaire des plans, une troisième forme à côté de « Daté » et
« Libre » : choisir le document, le nom se propose (le fichier sans son
extension), découpage, rythme, date, et **l'aperçu des jours avant de créer**
— les dix premiers, le compte du reste, les lignes passées, les rejets.

Vu, en aller-retour réel : un `.txt` de six lignes → 3 jours, 3 lignes
passées, nom « plan automne » ; créé — plan **70**, `scheduled`/`custom`,
3 jours du 17 au 19, jour 1 à deux passages dans `passages`, jour 3 à un
seul dans les colonnes ; ouvert — « Jour 1 · 17 sept. · Genèse 1-3 ·
Psaumes 1 », comme tout plan daté ; supprimé par le bouton — base revenue à
26 plans, 4 099 jours.

### Le document en entier — la première migration de la fonction

« Garde les références seules, mais donne le choix de lire le document dans
son intégralité. » Compris ainsi : le plan porte la **page** de chaque jour —
la méditation, le commentaire — et pas seulement les passages qu'elle cite.
Un jour de plan n'avait aucune colonne pour un texte : migration
`20260917200000_plan_day_texte`, une colonne `texte` nullable sur
`plan_days`, additive, sans reprise, sans `grant` (l'`UPDATE` est au niveau
table, vérifié). Appliquée par l'outil MCP sur accord du propriétaire ;
journal à 30, colonne relue.

La règle de découpage suit celle des jours : la page d'un jour va de sa ligne
à références jusqu'à la suivante ; ce qui précède le premier jour — un titre,
un avant-propos — lui revient. En découpage par passage, la page va au
premier jour de la ligne. Le formulaire offre « Contenu : les références
seules / le document en entier, jour par jour », et l'aperçu montre les
premiers mots de chaque page. Dans l'écran du plan, « Lire le texte du jour »
déplie la page sous la ligne — un jour de plan reste une ligne tant qu'on ne
demande pas. **Cocher le jour** met la page dans les notes des lectures :
l'historique la garde. 12 tests sur le module.

Vu, en aller-retour réel : un recueil de deux méditations → plan **71**, deux
jours avec leur page dans `texte`, sauts de ligne gardés ; la page dépliée à
l'écran ; jour 1 coché → lecture **962**, Genèse 1:1-31, notes « Plan :
meditations (jour 1) » puis la page ; décoché → lecture retirée ; plan
supprimé → 26 plans, 4 099 jours, aucun avec texte.

En chemin, la base a montré que le propriétaire s'est servi de l'import en
production sur de vraies notes de prédication — séances « Approchez-vous de
Dieu » (20 lectures) et « L'hérédité, que dit la bible ? ».

### Ce qui suit

1. Sur l'iPhone du propriétaire : un vrai plan depuis un PDF, en entier.
2. Le modèle, plus tard — et avec lui le « tout » du point 5.

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
| 17 sept. 2026 | **Le document en entier** : migration `plan_day_texte` appliquée (journal à 30), la page de chaque jour dans `plan_days.texte`, dépliable à l'écran, copiée dans les notes au cochage. Aller-retour réel : plan 71, lecture 962, tout retiré. 943 tests. |
| 17 sept. 2026 | **Un plan depuis un document** : `lib/plans/from-document.ts`, une ligne = un jour, troisième forme du formulaire des plans avec aperçu. Aller-retour réel : plan 70 créé, vu, supprimé. 938 tests. |
| 17 sept. 2026 | **Seconde revue du propriétaire** : PDF et fichiers ok. Photo → appareil direct, une prise à la fois, texte cumulé. Bouton Audio retiré, l'audio passe par « Choisir un fichier ». |
| 17 sept. 2026 | **Arbitrages** : dictée abandonnée, audio en fichier, modèle plus tard, PDF maintenant. `pdf.ts` (pdf.js + OCR des pages scannées), `audio.ts` (Whisper tiny sur l'appareil, transformers.js depuis jsDelivr, sans dépendance npm). 929 tests. |
| 17 sept. 2026 | **Vu en production par le propriétaire** : presse-papier et photo. Six retours : « / » séparateur, photo multi-pages, EPUB et FB2 lus, Kindle refusé (DRM), la route `api/import/lien`. Le bruit des abréviations courtes retiré. 924 tests. |
| 17 sept. 2026 | **Troisième étage** : `lib/import/ocr.ts`, la photo lue sur l'appareil par `tesseract.js` (7.0.0, la seule dépendance, chargée à la demande). Vu sur une image fabriquée : texte exact, 3 références. `next build` figé deux fois dans un worktree — le bac à sable, hypothèse. |
| 17 sept. 2026 | **Deuxième étage** : `lib/import/fichiers.ts`, Word, Excel, PowerPoint, OpenDocument, texte, csv, html sans dépendance (15 tests) ; PDF refusé avec sa raison. L'essai réel a trouvé le défaut du point-virgule devant un ordinal ; corrigé, 70 tests sur l'analyseur. |
| 17 sept. 2026 | **Premier étage livré** : `lib/import/references.ts`, l'analyseur déterministe (53 tests), et `components/import/ImportLectures.tsx` dans `/avance` — le presse-papier, l'écran de validation, la septième voie de création. Vu et éprouvé par un aller-retour réel : Psaumes 23 enregistré (ligne 897, texte du cache, séance « Import presse-papier · 17/09/2026 »), vu dans l'historique, effacé par l'écran, base revenue à 745. |
