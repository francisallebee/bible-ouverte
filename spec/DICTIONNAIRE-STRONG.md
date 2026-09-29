# Dictionnaire biblique, codes Strong, interlinéaire — enquête sur les sources

Demandé par le propriétaire le 28 septembre 2026 : un dictionnaire biblique
libre de droits accessible d'un clic sur un mot, et les codes Strong avec les
interlinéaires. Enquête lancée le soir même, **achevée le 29 septembre** — les
quatre points qui ne demandaient pas d'arbitrage sont tranchés, et il n'en
reste qu'un, qui appartient au propriétaire.

Règle de lecture, celle de `spec/DROITS.md` : **ce qui n'a pas été lu à la
source est signalé comme non vérifié.** La piste Biblica, restée en l'air
depuis le 2 septembre parce que sa page rend `403`, est là pour le rappeler.

## Ce qui est vérifié, et à quelle source

| Ressource | Licence relevée | Où | Poids |
|---|---|---|---|
| **Lexique Strong hébreu** (`openscriptures/strongs`) | **Aucune licence déclarée par le dépôt** — l'API GitHub rend `license: None`, il n'y a pas de fichier `LICENSE`. Le domaine public vient de l'œuvre de 1890, pas d'une déclaration. **Mais l'en-tête du fichier, lui, revendique une CC BY-SA** — voir « La forme exacte des lexiques Strong » plus bas | API GitHub, 28 sept. 2026 ; en-tête relu le 29 | `strongs-hebrew-dictionary.js` : **1,91 Mo** |
| **Lexique Strong grec** (même dépôt) | idem | idem | `strongs-greek-dictionary.js` : **1,15 Mo** |
| **Ancien Testament hébreu + morphologie** (`openscriptures/morphhb`, OSHB) | **CC BY 4.0**, sur la base du *Westminster Leningrad Codex*, domaine public. Attribution à la formule imposée : « Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb » | `LICENSE.md` lu à la source | **28,8 Mo utiles** — 39 fichiers XML, mesurés le 29 sept. ; les 79 Mo sont le dépôt entier, pas la donnée |
| **Nouveau Testament grec + morphologie** (`morphgnt/sblgnt`) | Deux licences distinctes : le **texte SBLGNT** en CC BY 4.0, l'**analyse morphologique** sous **CC BY-SA 3.0** — copyleft, à ne pas confondre avec BY | `README.md` lu à la source | dépôt **20,6 Mo** |
| **Licence du texte SBLGNT** | La page annoncée comme « EULA » sert une **Creative Commons Attribution 4.0 International**, **sans aucune clause additionnelle** — page relue en entier le 29 sept. : ni plafond de versets, ni restriction commerciale, ni condition de redistribution logicielle. Attribution due à Faithlife / Logos | `sblgnt.com/license`, lu à la source | — |
| **Segond 1910** (le texte seul) | Domaine public — confirmé par les développeurs CrossWire | liste `sword-devel`, nov. 2024 | déjà au dépôt |

**Le lexique Strong tient donc en 3 Mo pour les deux langues** — dérisoire à
côté des 82 Mo de `public/bibles/`. Ce n'est pas lui qui pose problème. Avec
les 28,8 Mo de l'hébreu balisé, l'ensemble « originaux + Strong » pèse
**environ 32 Mo**, soit quatre traductions.

## Le point dur, vérifié : il n'existe pas de Segond 1910 balisé Strong

C'est la conclusion du fil `sword-devel` de novembre 2024, entre développeurs
de CrossWire, et elle tranche la faisabilité du point 3 :

- l'ancien module français à numéros Strong a été **retiré faute
  d'autorisation** — « we do not have the authorization […] so this module has
  been removed or replaced » ;
- le module subsistant (`fraLSG1910eb`) porte des numéros **incomplets** — « not
  available for all books » — et **fautifs** — « there are errors in this
  module » ;
- une version antérieure est décrite comme « horrible, filled with errors ».

**Le texte français est libre ; son alignement mot à mot sur les numéros
Strong ne l'est pas, et n'existe pas sous une forme fiable.** Baliser un
Segond 1910 serait un travail d'édition — des dizaines de milliers de mots —,
pas un téléchargement. C'est la décision la plus lourde des trois demandes, et
elle ne se règle pas par du code.

Deux issues, à trancher par le propriétaire :

1. **Les Strong sur les textes originaux seulement.** Hébreu et grec sont
   disponibles, balisés et sous licence claire. Le lecteur verrait le verset
   français, et, en regard, le mot original avec son numéro et sa définition —
   sans lien mot-à-mot vers le **français**, qui est précisément ce qui manque.
   Honnête, faisable, et moins que ce qui était imaginé.
2. **Faire baliser le français.** Un chantier éditorial, avec son coût et sa
   relecture. Hors du dépôt.

## Le dictionnaire : une piste solide, un format à produire

**Jean-Augustin Bost, *Dictionnaire de la Bible*, 1849** — domaine public sans
ambiguïté (publication 1849, auteur mort en 1881). Diffusé par plusieurs sites
en **HTML et PDF** ; **aucune version en données structurées n'a été trouvée**.
Le convertir est un travail de script, du même genre que
`scripts/download-bible-versions.mjs`, et c'est la règle 13 qui s'appliquerait
ensuite : un script, une entrée au registre, un chargement à la demande.

**La recherche d'un dictionnaire français déjà structuré n'a rien donné**
(29 sept.). Le seul dépôt candidat, `Similarly1/open-shema-data` (110 Mo, qui
annonce des dictionnaires « sous licences libres ou dans le domaine public »),
**ne déclare aucune licence** — donc tous droits réservés par défaut. C'est le
même piège que le dépôt Strong, en pire : là-bas une œuvre de 1890 rattrape
l'absence de déclaration, ici on ignore ce que le dépôt contient au juste.
**Une absence de licence n'est pas une licence permissive**, et c'est la règle
à opposer à toute trouvaille de ce genre.

### Westphal est écarté, et pas pour la raison attendue

La piste Westphal (*Dictionnaire encyclopédique de la Bible*, 1932-1935) était
la plus séduisante — bien plus riche et moderne que Bost. **Elle ne tient
pas**, et l'hypothèse « libre depuis 2022 » notée la veille est retirée.

Deux choses ont été trouvées le 29 septembre, dans cet ordre.

**La date de mort de Westphal est contestée entre deux fichiers d'autorité.**
IdRef (ABES) donne « 01/07/1861 » et **1951** ; data.bnf.fr affiche
**1861-1961**. Dix ans d'écart, et ni l'un ni l'autre ne cite sa source. Cela
suffisait déjà à interdire de conclure.

**Mais le point décisif est ailleurs, et il est structurel** : le dictionnaire
est une œuvre **collective**, « publiée sous la direction de » Westphal, avec
un comité de rédaction nommé — Albert Dartigue, Jean Laroche, A.-J.
Baumgartner et **André Parrot**. Or Parrot est mort en **1980** (1901-1980,
vérifié). Si l'ouvrage relève de l'œuvre de collaboration (CPI art. L123-2),
les droits courent soixante-dix ans après le **dernier auteur survivant** :
**2051**. La qualification en œuvre collective (L113-5, soixante-dix ans après
publication, donc 2002) est plaidable, mais ce n'est pas au dépôt d'en
décider, et les contributions signées restent protégées pour leur compte.

La date de mort du directeur ne datait donc jamais les droits de l'ouvrage.
**Bost 1849 — auteur unique, mort en 1881 — reste le seul chemin propre.**

## Ce qui n'est pas une question de contenu mais d'architecture

« Accessible partout quand on clique sur un mot » est un **inventaire de
chemins**, du même genre que la mention de copyright de `spec/DROITS.md` :
l'aperçu, la recherche biblique, le verset du jour, la mémorisation, le détail
d'une lecture, le lecteur de document. Le rendre sûr par `tsc` suppose de faire
passer tout affichage de texte biblique par **un composant unique**, que le
produit n'a pas encore. Ce refactoring est le préalable, et il est
indépendant du choix du dictionnaire.

## Ce qu'il reste : une seule décision, et elle est au propriétaire

Les quatre points d'enquête sont clos (29 septembre). Le cinquième n'est pas
une recherche : c'est un arbitrage.

**Les codes Strong : sur les textes originaux seulement, ou chantier de
balisage du français ?**

| | Originaux seuls | Baliser le français |
|---|---|---|
| Faisabilité | **Acquise** : hébreu et grec balisés, licences vérifiées | Travail d'édition sur des dizaines de milliers de mots |
| Poids | ~32 Mo, à charger à la demande | idem, plus le texte balisé |
| Licences | CC BY 4.0 (OSHB, SBLGNT) + CC BY-SA 3.0 (morphologie MorphGNT) | à établir |
| Ce que le lecteur voit | Le verset français, et en regard le mot original, son numéro et sa définition | Le mot **français** cliquable, relié à son original |
| Ce qui manque | Le lien mot-à-mot vers le **français** — précisément ce qui était imaginé | Rien, mais ce n'est plus du code |

### Tranché le 29 septembre 2026 : les originaux seulement

Le propriétaire a retenu **les Strong sur les textes originaux**, et écarté le
balisage du français. La conséquence est à écrire noir sur blanc, parce qu'elle
sera la première question posée à l'usage : **on ne pourra pas cliquer un mot
français pour en voir le Strong.** Ce que le lecteur aura, c'est le verset dans
sa version, et en regard le mot hébreu ou grec avec son numéro et sa
définition. C'est moins que ce qui était imaginé le 28 septembre, et c'est le
seul périmètre que les licences et les données existantes permettent
honnêtement.

Ce que cette décision ferme : aucun chantier d'édition, aucune dépendance à un
module tiers incomplet, aucune zone d'ombre sur les droits.

### La conversion de Bost, tentée et mesurée — 29 septembre 2026

La source a été choisie sur deux critères, et non sur sa commodité :
l'édition **1865** déposée à l'Internet Archive (`bub_gb_6v4UAAAAYAAJ`) porte
une licence **explicite** — Public Domain Mark 1.0, lue dans ses métadonnées
et non déduite de l'âge de l'ouvrage — et elle **se sert à un script**. Les
transcriptions en ligne, de bien meilleure qualité de texte, répondent `403` à
tout ce qui n'est pas un navigateur : un script du dépôt ne dépendra pas d'un
déguisement.

`scripts/download-bost.mjs` nettoie ce que l'OCR d'un fac-similé de 1865
laisse : **24 087 césures** recollées, **940** « Digitized by Google »,
**764 080** doubles espaces, et la confusion systématique du `1` pour `I` dans
les capitales — ABILÈNE lu AB1LÈNE, ARCHIPPE ARCH1PPE. Cette dernière est sûre
parce qu'elle est bornée aux mots tout en capitales, où un chiffre entouré de
lettres n'est jamais un chiffre.

**Le résultat ne se publie pas, et le chiffre le dit** : 1 015 entrées
détectées quand la page de titre de l'ouvrage annonce « PLUS DE 4 000
ARTICLES » — un quart. Les entrées manquées se collent à la précédente, dont
la plus longue atteint 74 363 caractères contre une médiane de 2 195. AARON
manque quand ABEL est là.

Le repérage du terme est réparable. **Le texte, non** : « ennanéenne » pour
cananéenne, « tixès » pour fixés, « .los. » pour Jos., « DE8 » pour DES. Un
meilleur analyseur relèverait la couverture sans corriger une seule de ces
fautes, et la valeur d'un dictionnaire est dans son texte. Rien n'a donc été
écrit dans `public/` ; le script reste au dépôt parce qu'il porte la mesure.

### Tranché le 29 septembre 2026 : Bost est mis de côté, pas abandonné

Décision du propriétaire, et la raison est celle que la mesure avait donnée :
**1 015 entrées pour « plus de 4 000 » annoncées, et un texte fautif qu'aucun
meilleur analyseur ne corrigerait.** Le repérage du terme se réparait ; le
texte, non — et la valeur d'un dictionnaire est dans son texte. Reprendre
cette source supposerait une relecture éditoriale, c'est-à-dire exactement le
chantier que le balisage du français avait fait écarter le même jour.

**L'effort va aux Strong.** C'est le point 3 des trois demandes, sa
faisabilité est acquise et ses licences sont vérifiées, là où le dictionnaire
attend encore une source qui n'existe peut-être pas sous forme exploitable.

« Mis de côté » n'est pas « abandonné », et la nuance porte sur deux choses
concrètes :

- **`scripts/download-bost.mjs` reste au dépôt**, et ce n'est pas de
  l'indécision : il porte la mesure. Le chiffre de 1 015 n'est pas une
  opinion sur cette source, c'est un relevé reproductible, et il resservira le
  jour où quelqu'un proposera de reprendre Bost.
- **Les deux issues restent ouvertes** — faire relire cette édition, ou
  trouver une transcription déjà corrigée. Celle de 2014 existe, refuse
  l'accès automatisé, et ses droits d'édition restent à éclaircir : c'est une
  enquête, pas du code, et rien n'oblige à la mener maintenant.

L'ordre des travaux ne dépend plus d'aucune enquête :

1. Le **composant unique de rendu du texte biblique** — préalable indépendant
   du dictionnaire comme des Strong, et le seul moyen que `tsc` garantisse
   l'inventaire des chemins. **Livré le 29 septembre 2026.**
2. Les **originaux balisés et les codes Strong** — le travail en cours.
3. Le **dictionnaire**, quand une source au texte sûr aura été trouvée. Bost
   n'en est pas une en l'état.

## La forme exacte des lexiques Strong — relevée le 29 septembre 2026

Cette section existe parce que **la forme de ces fichiers ne se devine pas**,
et qu'aucun script de conversion ne s'écrit sans elle. Tout ce qui suit est lu
à la source (`raw.githubusercontent.com`, dépôt `openscriptures/strongs`,
branche `master`), et non déduit.

### Ce que sont ces fichiers : du CommonJS, pas du JSON

```js
var strongsHebrewDictionary = {"H1":{…},"H2":{…}, … };

module.exports = strongsHebrewDictionary;
```

Le grec est bâti de même, avec `strongsGreekDictionary`. Un `index.js` à la
racine fait `Object.assign({}, hebrew, greek)` et `package.json` déclare un
paquet npm `strongs`.

**Conséquence pour la conversion, et c'est la seule qui compte** : ce ne sont
pas des fichiers JSON, donc `JSON.parse()` échoue sur eux tels quels. Mais il
n'est pas nécessaire de les exécuter pour autant — découper entre le premier
`{` et le dernier `}` rend un JSON valide. **Ne pas faire de `require()`** :
ce serait exécuter du code tiers au moment du build pour lire des données, et
la règle 4 veut de toute façon un fichier servi depuis `public/`, pas un
module empaqueté par webpack.

### Les clés, et ce qu'elles ont d'irrégulier

| | Hébreu | Grec |
|---|---|---|
| Fichier | `hebrew/strongs-hebrew-dictionary.js` | `greek/strongs-greek-dictionary.js` |
| Poids | **2 003 130 o** (1,91 Mo) | **1 200 839 o** (1,15 Mo) |
| Forme des clés | `H1` … `H8674` | `G1` … `G5624` |
| Ordre des entrées | **numérique croissant** | **quelconque** — le fichier s'ouvre sur `G1615`, puis `G2274`, `G4533` |

Les poids confirment au format près les 1,91 et 1,15 Mo déjà relevés le
28 septembre. **L'ordre, lui, est un piège** : le grec n'est pas trié, et tout
affichage qui parcourrait le fichier dans son ordre naturel sortirait en
désordre. Trier sur la partie numérique de la clé, jamais sur la chaîne —
`G10` se range avant `G2` dans un tri lexical.

Autre irrégularité, dans le texte et non dans les clés : les renvois internes
d'une langue à l'autre sont **complétés par des zéros** quand les clés ne le
sont pas. L'entrée `G4533` porte « of Hebrew origin (H08012); » quand la clé
réelle est `H8012`. Un lien cliquable construit sur le texte des renvois
devra retirer ces zéros.

### Les champs ne portent pas les mêmes noms d'une langue à l'autre

C'est le piège principal, et il est silencieux.

| Champ | Hébreu | Grec | Contenu |
|---|---|---|---|
| `lemma` | ✅ | ✅ | le mot original — `אָב`, `ἐκτελέω` |
| `xlit` | ✅ | ❌ | translittération hébraïque — `ʼâb` |
| `translit` | ❌ | ✅ | translittération grecque — `ekteléō` |
| `pron` | ✅ | ❌ | prononciation — `awb` |
| `derivation` | ✅ | ✅ | étymologie |
| `strongs_def` | ✅ | ✅ | la définition de Strong |
| `kjv_def` | ✅ | ✅ | les rendus de la King James |

**Un convertisseur écrit sur l'exemple grec perdrait la translittération des
8 674 entrées hébraïques sans qu'aucune erreur ne soit levée** — `entry.translit`
vaut simplement `undefined`. C'est exactement le genre de défaut que le dépôt
a déjà rencontré à la règle 13 : une chose qui s'affiche, se laisse cocher, et
manque à l'usage. Le type de l'entrée doit donc porter les deux noms, et la
conversion normaliser vers un seul.

Deux détails de moindre portée : l'ordre des champs **à l'intérieur** d'une
entrée varie d'une entrée à l'autre — sans effet après analyse, mais de quoi
rendre illisible un `diff` —, et le `kjv_def` contient des marques d'édition
comme `[idiom]`, qu'il faudra décider d'afficher ou de retirer.

### La licence : le dépôt n'en déclare aucune, les fichiers si

**Et ce qu'ils déclarent est du copyleft.** C'est une correction à ce qui
était écrit plus haut le 28 septembre, et elle n'est pas anodine.

| Ce qui a été lu | Où | Le 29 sept. 2026 |
|---|---|---|
| `license: None` | API GitHub du dépôt | confirmé |
| Aucun fichier `LICENSE` | listing de la racine du dépôt | confirmé — `.gitignore`, `build.pl`, `index.js`, `package.json`, deux dossiers, trois fichiers de travail, et rien d'autre |
| « Copyright 2009, Open Scriptures. **CC-BY-SA**. Derived from XML. » | en-tête de `strongs-greek-dictionary.js` | **relevé ce jour** |
| « Copyright 2010, Open Scriptures. **CC-BY-SA**. Derived from XML. » | en-tête de `strongs-hebrew-dictionary.js` | **relevé ce jour** |

La ligne du tableau d'ouverture — « aucune licence déclarée par le dépôt » —
reste **vraie du dépôt**, et c'est bien ainsi qu'elle avait été relevée. Elle
était seulement incomplète : la déclaration existe, elle est dans les fichiers.

Ce que cela change, concrètement :

- **L'œuvre de 1890 est bien du domaine public**, et c'est toujours elle qui
  fonde le droit d'usage du contenu. Strong est mort en 1894.
- **Mais la mise en forme JSON revendique une CC BY-SA**, au même titre que la
  morphologie MorphGNT déjà relevée. C'est du **copyleft** : partage à
  l'identique de l'œuvre dérivée, à ne pas confondre avec la simple
  attribution des CC BY de l'OSHB et du SBLGNT.
- **En pratique, la prudence est la même dans les deux lectures** : créditer
  Open Scriptures et signaler la licence là où le lexique est servi. C'est
  gratuit, et cela vaut que la revendication tienne ou non.

**Ce qui n'est pas tranché ici, et ne peut pas l'être par un agent** : savoir
si une simple transcription du domaine public en JSON ouvre réellement un
droit d'auteur — la question de l'originalité d'une base de données — est un
point de droit, pas un relevé. Il est noté, non résolu.

## La forme exacte de l'OSHB — relevée et mesurée le 29 septembre 2026

Même démarche que pour les lexiques, et elle était nécessaire : la structure
porte **quatre pièges dont aucun ne se voit sur un seul exemple**. Les
39 livres ont été téléchargés et parcourus en entier ; tous les chiffres
ci-dessous sont des relevés, pas des estimations.

### Ce qu'est le fichier

Du **OSIS** — XML à espace de noms par défaut
(`http://www.bibletechnologies.net/2003/OSIS/namespace`), ce qui oblige tout
XPath à le déclarer. Un fichier par livre, `wlc/Gen.xml` … `wlc/Mal.xml`, plus
un `wlc/VerseMap.xml` : **40 fichiers pour 39 livres**, ce qui explique l'écart
avec le relevé du 28 septembre — il comptait les livres, non les fichiers.

```xml
<verse osisID="Obad.1.1">
  <w lemma="2377" n="1.0" morph="HNcmsc" id="31xeN">חֲז֖וֹן</w>
  <w lemma="3541" morph="HD" id="31TyA">כֹּֽה</w><seg type="x-maqqef">־</seg>
  <w lemma="c/6735 a" morph="HC/Ncmsa" id="31C5U">וְ/צִיר֙</w>
</verse>
```

L'en-tête de chaque livre porte sa propre déclaration de droits —
`<rights type="x-BY">Creative Commons Attribution 4.0</rights>` pour l'OSHB,
`Public Domain` pour le Westminster Leningrad Codex sous-jacent. La CC BY 4.0
relevée le 28 septembre est donc confirmée **dans la donnée**, et pas seulement
dans le `LICENSE.md`.

### Ce que pèse et contient réellement la donnée

| Mesuré sur les 39 livres | |
|---|---|
| Octets | **28 527 617** (28,5 Mo) |
| Versets | **23 213** |
| Mots `<w>` | **306 785** |
| Notes `<note>` | **2 472** |
| Numéros Strong distincts employés | **8 640** |

### Les quatre pièges

**1. `lemma` n'est pas un numéro Strong.** C'est le piège principal, et il est
structurel : le champ porte les préfixes agglutinés du mot, puis le numéro,
puis parfois une lettre.

| Forme rencontrée | Lecture | Combien |
|---|---|---|
| `2377` | numéro nu | 189 538 mots |
| `c/6735 a` | préfixe + numéro + homonyme | 110 469 mots portent au moins un préfixe |
| `6965 b` | numéro + lettre d'homonyme | 59 283 mots |
| `1177+` | numéro suivi de `+` — **premier mot d'un nom propre composé** | 801 mots, 348 formes |
| `l` | **préfixe seul, aucun numéro** | voir le piège 2 |

Les segments de préfixe sont **huit, et seulement huit** : `c` (51 272),
`d` (24 060), `l` (16 361), `b` (14 469), `m` (6 316), `k` (2 964),
`i` (661), `s` (142). Les lettres d'homonyme sont **six** : `a` (46 457),
`b` (10 015), `c` (1 807), `d` (848), `e` (155), `f` (1 — une seule occurrence
dans toute la Bible hébraïque).

Obtenir la clé du lexique demande donc **trois gestes** : découper sur `/` et
garder le dernier segment, retirer un `+` final, retirer une lettre d'homonyme
finale. Aucun des trois ne se devine en lisant un exemple.

**La lettre d'homonyme est une information que le lexique ne sait pas
recevoir** : `6965 a` et `6965 b` sont deux mots distincts pour l'OSHB, mais
Strong n'a qu'une entrée `H6965`. La distinction est portée par la source et
perdue à l'affichage — à dire, plutôt qu'à masquer.

**2. Environ 2 % des mots n'ont aucun numéro Strong.** Mesuré : **5 977 mots
sur 306 785**, soit **1,95 %**. Ce sont les formes préposition + suffixe
pronominal — `ל֔/וֹ`, « à lui » —, dont le noyau vaut `l` (4 491), `b` (1 378),
`m` (98), `k` (9) ou `i` (1). **Tous se ramènent à un préfixe, aucun n'est une
anomalie.** L'interface devra donc prévoir un mot sans entrée : ce n'est pas un
défaut de la donnée, c'est sa nature.

**3. La ponctuation est hors des mots.** Maqqef et sof-pasuq sont des `<seg>`
**entre** les `<w>`, jamais dedans : 42 577 `x-maqqef`, 23 192 `x-sof-pasuq`,
2 278 `x-paseq`, plus quelques marques rares (`x-samekh`, `x-pe`,
`x-reversednun`, `x-large`, `x-small`, `x-suspended`). Un rendu qui ne
ramasserait que les `<w>` rendrait un texte **faux** — mots recollés sans leur
trait d'union, versets sans leur point final.

**4. Les notes sont à l'intérieur du verset, entre deux mots.** 2 472 `<note>`,
en anglais, placées au fil du texte. Une extraction qui concaténerait le texte
des descendants d'un `<verse>` **injecterait de la prose anglaise au milieu de
l'hébreu**. Elles se sautent explicitement.

Deux détails de moindre portée : le texte du mot contient lui aussi un `/` —
`וְ/צִיר֙` — qui marque la frontière de morphème et doit être retiré à
l'affichage (146 757 mots concernés) ; et `morph` est parallèle au `lemma`,
un segment par morphème (`HC/Ncmsa` répond à `c/6735 a`), ce qui permettra plus
tard de gloser chaque morceau — mais suppose que les deux découpages soient
traités ensemble, jamais séparément.

### La mesure qui décide : tous les mots trouvent leur entrée

C'est la question qui commande la fonction entière, et elle a été posée
frontalement — les 8 640 numéros employés par le texte, croisés avec les
8 674 entrées du lexique hébreu :

| | |
|---|---|
| Numéros employés par l'OSHB | **8 640** |
| **Employés mais absents du lexique** | **0** |
| Présents au lexique, jamais employés | 34 |

**Aucun trou.** Tout mot hébreu porteur d'un numéro trouvera sa définition, et
les 34 entrées inemployées ne coûtent rien. C'est l'inverse exact de ce que la
conversion de Bost avait donné : là-bas la mesure disait de ne rien publier,
ici elle dit que la source tient.

### Les correspondances de livres se font par nom, et pas par position

L'OSHB nomme ses livres à la manière OSIS — `Gen`, `1Sam`, `Ps`, `Song`,
`Obad` — quand `readings.book` stocke des abréviations USFM (`GEN`, `1SA`,
`PSA`, `SNG`, `OBA`). Une table de correspondance est donc nécessaire, et
**elle se fait par nom**, contrairement à celle de `scrollmapper` qui se fait
par position (voir `AGENTS.md`) : les fichiers de `wlc/` sont rangés
**alphabétiquement**, pas dans l'ordre canonique, et ils ne couvrent que
l'Ancien Testament — 39 livres sur 66. Se fier à la position ici donnerait
Amos pour la Genèse.

## La forme exacte du MorphGNT — relevée et mesurée le 29 septembre 2026

Les 27 fichiers téléchargés et parcourus en entier. La forme est **tout autre**
que celle de l'hébreu, et une asymétrie de fond sépare les deux moitiés du
projet.

### Du texte tabulé, sept colonnes, aucun en-tête

```
010101 N- ----NSF- Βίβλος Βίβλος βίβλος βίβλος
010102 V- 3AAI-S-- ἐγέννησεν ἐγέννησεν ἐγέννησε(ν) γεννάω
```

Séparateur espace, sept colonnes exactement : référence, partie du discours,
code d'analyse, texte (ponctuation comprise), mot (ponctuation retirée), mot
normalisé, lemme. **Vérifié sur les 137 554 lignes : aucune n'en a un autre
nombre.** C'est la seule bonne nouvelle de forme — l'analyse ne demande pas de
parseur, un `split(' ')` suffit.

| Mesuré sur les 27 fichiers | |
|---|---|
| Octets | **8 936 874** (8,94 Mo — trois fois moins que l'hébreu) |
| Lignes, donc mots | **137 554** |
| Versets | **7 927** |
| Lemmes distincts | **5 461** |

**Piège de numérotation** : les fichiers s'appellent `61-Mt` … `87-Re`, mais
la référence *à l'intérieur* commence à `01` pour Matthieu. Le `010101` de la
première ligne se lit livre 01, chapitre 01, verset 01 — deux numérotations
pour la même Bible, dans le même dépôt. Se fier au nom de fichier pour lire la
colonne mènerait au mauvais livre.

### L'asymétrie qui commande tout : MorphGNT ne porte aucun numéro Strong

C'est le fait central de cette section, et il n'était pas prévisible :
**il n'y a pas de colonne Strong.** Là où l'OSHB inscrit le numéro dans la
donnée — d'où le « 0 absent » mesuré plus haut —, le grec ne donne qu'un
lemme. Le raccord au lexique doit donc se faire **texte contre texte**, du
lemme MorphGNT vers le champ `lemma` du lexique.

Ce raccord se mesure ; il ne se suppose pas. Voici la mesure.

| Raccord des 5 461 lemmes vers le lexique grec | Types | Occurrences |
|---|---|---|
| **Exact** | 4 840 (88,6 %) | 134 052 (**97,45 %**) |
| **Après pliage** (accents retirés, minuscules, sigma final unifié) | +132 (2,4 %) | +1 381 (1,00 %) |
| **Aucun raccord** | **489 (9,0 %)** | **2 121 (1,54 %)** |

Sur les 489 échecs, **5 types seulement sont mécaniques** : MorphGNT note les
finales facultatives entre parenthèses — `οὕτω(ς)`, `ἔξεστι(ν)`, `μέχρι(ς)` —
et retirer la parenthèse les récupère tous les cinq, soit 269 occurrences.
**Reste 484 types et 1 852 occurrences, soit 1,35 % du texte**, qu'aucune
normalisation ne rattrapera.

Onze lemmes, par ailleurs, se raccordent à **plusieurs** numéros Strong : le
raccord n'est pas une fonction, et il faudra choisir ou afficher les deux.

### Pourquoi ces 1,35 % ne se rattrapent pas : deux textes différents

La cause est **textuelle, pas technique**, et c'est ce qui la rend définitive.
MorphGNT suit le **SBLGNT**, texte critique moderne ; le lexique de Strong
suit le **Textus Receptus** de 1890. Ce ne sont pas deux orthographes du même
mot, ce sont deux éditions du Nouveau Testament. Vérifié entrée par entrée :

| MorphGNT (SBLGNT) | Lexique Strong | Nature de l'écart |
|---|---|---|
| `Δαυίδ` (59×) | `Δαβίδ` — G1138 | β contre υ |
| `Μωϋσῆς` (79×) | `Μωσεύς` — G3475 | forme du nom |
| `Καφαρναούμ` (16×) | `Καπερναούμ` — G2584 | φ contre π |
| `τεσσεράκοντα` (22×) | `τεσσαράκοντα` — G5062 | ε contre α |
| `οἶδα` (296×) | `εἴδω` — G1492 | forme attestée contre racine supposée |
| `φοβέομαι` (95×) | `φοβέω` — G5399 | déponent moyen contre vedette active |

Les deux dernières lignes ne sont même pas des variantes de texte : ce sont
deux **conventions de vedette** lexicographique. Strong range sous une racine
active ou hypothétique ce que MorphGNT range sous la forme réellement attestée.

**C'est la leçon de Bost, à l'envers.** Là-bas, un meilleur analyseur aurait
relevé la couverture sans corriger une faute. Ici, la couverture est déjà
bonne — 98,65 % après les correctifs mécaniques — et le reste ne demande ni un
meilleur analyseur ni un meilleur pliage, mais **une table de correspondance
écrite à la main**, 484 lignes, ou l'aveu que ces mots-là n'auront pas de
numéro.

### Ce que les deux moitiés donnent, côte à côte

| | Hébreu (OSHB) | Grec (MorphGNT) |
|---|---|---|
| Format | OSIS XML, 39 fichiers | texte tabulé, 27 fichiers |
| Poids | 28,5 Mo | 8,94 Mo |
| Mots | 306 785 | 137 554 |
| Numéro Strong dans la donnée | **oui** | **non** |
| Mots atteignant leur définition | **100 %** des mots numérotés, 0 absent | **98,65 %** après correctifs, sans table manuelle |
| Mots sans numéro possible | 5 977 (1,95 %), tous préposition + suffixe | 1 852 (1,35 %), écart de texte |
| Licence | CC BY 4.0, attribution imposée | texte SBLGNT CC BY 4.0, **morphologie CC BY-SA 3.0** |

**La morphologie grecque est le seul élément copyleft de l'ensemble**, avec la
mise en forme JSON des lexiques. À traiter ensemble le jour où la question des
licences sera tranchée, et non comme deux cas.

### Les champs des lexiques ne sont pas tous remplis

Mesuré, parce qu'un type TypeScript écrit sur un exemple rassurerait à tort :

| Champ | Hébreu (8 674 entrées) | Grec (5 523 entrées) |
|---|---|---|
| `lemma` | complet | complet |
| `xlit` / `translit` | complet | complet |
| `pron` | complet | *(absent du grec)* |
| `strongs_def` | complet | **manque dans 19** |
| `derivation` | manque dans 4 | manque dans 13 |
| `kjv_def` | manque dans 4 | manque dans 3 |

**`strongs_def` est la définition même** — celle que le lecteur vient chercher.
Elle manque dans 19 entrées grecques. Le type doit donc la déclarer optionnelle
et l'affichage prévoir son absence, faute de quoi 19 clics rendront
`undefined`. Le lexique grec compte par ailleurs **5 523 entrées**, et non les
5 624 que la dernière clé laisserait croire : la numérotation de Strong a des
trous.

### Ce qui reste avant d'écrire du code

Tout est relevé. Ce qui reste n'est plus de l'enquête mais des décisions :

1. ~~La CC BY-SA~~ — **acceptée par le propriétaire le 29 septembre 2026**,
   voir ci-dessous. Les 4,0 Mio de `public/strong/` sont versionnés.
2. ~~Les 484 lemmes grecs sans raccord~~ — **réglé le 29 septembre 2026** :
   les règles sûres en résolvent 177, la table manuelle 38 de plus. Restent
   **278 lemmes / 916 occurrences** dans `a_faire` de
   `scripts/strong-grec-manuel.json`, à confirmer au fil de l'eau. Ce n'est
   plus une décision mais un travail d'appoint, et il ne bloque rien.
3. ~~Les onze lemmes ambigus~~ — **six en réalité**, une fois les accents
   respectés : `ὦ`, `ἄπειμι`, `βάτος`, `σύνειμι`, `ῥέω`, `εἴκω`. Ce sont de
   vrais homographes que seul le contexte départagerait ; ils restent **sans
   numéro à dessein**, et c'est le comportement juste.

~~Ce qui reste, désormais, n'est plus une décision du tout : l'écran qui
affiche une définition au clic sur un mot.~~ **Livré le 29 septembre 2026.**
`LEXIQUES_VISIBLES` est allumé et la mention de licence s'affiche avec la
définition.

**Les trois demandes du propriétaire du 28 septembre sont donc closes** — le
composant unique, le dictionnaire (écarté sur mesure, voir Bost), les Strong
sur les originaux. Ce qui subsiste tient en trois lignes, et aucune n'est
bloquante :

| | |
|---|---|
| 130 lemmes grecs sans numéro | **0,13 %** du texte, à confirmer au fil de l'eau dans `a_faire` |
| Six homographes | resteront sans numéro : seul le contexte les départagerait |
| Dix lemmes écartés | examinés, sans correspondance honnête chez Strong — `ἀλλαχοῦ` n'y est pas, `εὖγε` y est deux mots |
| Définitions en anglais | l'œuvre de Strong l'est ; les traduire serait un chantier éditorial de 14 197 entrées |

### La CC BY-SA acceptée — 29 septembre 2026

Décision du propriétaire. Ce qu'elle engage, et ce qu'elle n'engage pas :

**Ce qui est redistribué, et par où.** Un seul chemin, vérifié avant de
versionner : les fichiers servis depuis `public/strong/`. `exportData()`
n'emporte **pas** les entrées — il sort lectures, contextes, versions et
réglages, jamais le magasin `strong_entries`, exactement comme il ne sort
jamais `bible_passages` (`spec/DROITS.md`). Et aucun code hors de
`strong-store`, `db` et `seed` ne touche ces magasins. L'obligation
d'attribution porte donc sur ce que le site sert, pas sur ce que l'utilisateur
emporte.

**Ce que le partage à l'identique atteint.** L'œuvre dérivée est la donnée, non
le code qui l'affiche : le dépôt n'est pas contaminé par la clause. C'est la
lecture ordinaire de la CC BY-SA, et elle vaut aussi pour la morphologie
MorphGNT quand elle arrivera — à traiter avec celle-ci, pas comme un second
cas.

**Ce qui reste dû.** La mention. Chaque fichier porte son champ `attribution` —
« Strong's Exhaustive Concordance (James Strong, 1890), domaine public. Mise en
forme JSON : Open Scriptures, CC BY-SA » —, transporté jusqu'au chargeur par
`FichierLexique`. **Elle n'est pas encore affichée**, faute d'écran qui montre
une définition. C'est la dette explicite de cette décision, et elle s'éteindra
dans le même commit que le clic sur un mot : c'est exactement ce que
`spec/DROITS.md` prévoit pour `copyrightStatus`, appliqué d'avance plutôt
qu'après coup.

## Journal

| Date | Fait |
|---|---|
| 29 sept. 2026 | **Les 278 lemmes grecs repris : couverture de 99,31 % à 99,84 %.** 176 lemmes confirmés contre 38, 226 occurrences sans numéro contre 952. Trois preuves : une **concordance sur la King James** pondérée par la fréquence de fond, la **morphologie** (`τετραάρχης` marqué `N-` donne le nom et non le verbe), et l'**élimination** (`τίς` accentué étant résolu, le `τις` nu est l'indéfini `G5100` — 530 occurrences d'un coup). La concordance se trompant dans **13 %** des cas, les 147 candidats ont été relus un par un : 19 écartés, 9 corrigés. Retiré aussi les **marques d'apparat** du SBLGNT, présentes sur un mot sur seize et illisibles sans l'apparat. |
| 29 sept. 2026 | **Le clic sur un mot rend sa définition — la chaîne est bouclée.** `TexteOriginal`, base en version 13, `LEXIQUES_VISIBLES` allumé. Une case commande le lexique **et** son texte (19 Mo hébreu, 11 Mo grec). **La mention de licence s'affiche avec la définition : la dette de la CC BY-SA est éteinte.** Trois défauts trouvés à l'écran et nulle part ailleurs : `textDirection` ignorait l'hébreu et rendait la Genèse à l'envers, un défaut de bidi désordonnait l'étymologie en arabe, et un sélecteur approximatif a activé une version biblique par erreur. Limite assumée : **les définitions restent en anglais**, le lexique étant une œuvre de 1890. |
| 29 sept. 2026 | **Textes originaux convertis et versionnés.** OSHB et SBLGNT dans `public/originaux/` — 306 785 + 137 554 mots, 16,5 + 9,1 Mo ; `public/` passe à 119 Mo. Couverture Strong **98,05 %** (hébreu) et **99,31 %** (grec). Deux mesures ont écarté mes raccourcis : le raccord par distance d'édition se trompe dans **20 %** des cas (Βόες → « bœuf », Καῦδα → « chaleur »), la substitution de lettre dans **4 %** (γαμίζω → γεμίζω). Et plier les accents **avant** la correspondance exacte perdait **6 010 occurrences**, `εἰς` et `εἷς` ne différant que par l'esprit. Table manuelle : **38 lemmes confirmés un par un contre la glose**, 885 occurrences ; 278 en attente, 6 homographes laissés sans numéro à dessein. |
| 29 sept. 2026 | **CC BY-SA acceptée par le propriétaire, données versionnées.** 4,0 Mio dans `public/strong/`, `public/` passe à 95 Mo. Vérifié avant de verser : l'export de données n'emporte pas les entrées, le seul chemin de redistribution est le fichier servi. Reste dû : **afficher la mention**, qui attend l'écran des définitions. |
| 29 sept. 2026 | **Les lexiques livrés en dessous, masqués au-dessus.** Script de conversion (8 674 + 5 523 entrées, 4,0 Mio, déterministe), les trois gestes de la règle 13 au complet, base en version 12, **deux cases séparées** hébreu/grec. `G1473` (`ἐγώ`, 2 572 occurrences) a décidé de garder les 19 entrées sans définition : `definition` est optionnelle. **Aucune migration SQL** — `bible_versions` n'est pas synchronisé, ces magasins non plus. Vu agir en base : 5 523 écrites, décocher l'hébreu laisse le grec intact. La vérification en arabe a trouvé deux défauts que les tests ne voyaient pas — noms non traduits, et « Activé » au lieu d'« Activée ». `LEXIQUES_VISIBLES` reste à `false` tant qu'aucun clic n'affiche de définition. |
| 29 sept. 2026 | **Forme du MorphGNT relevée et mesurée** sur les 27 fichiers : texte tabulé à sept colonnes, 8,94 Mo, 137 554 mots, 7 927 versets, 5 461 lemmes. **Asymétrie de fond : aucun numéro Strong dans la donnée**, contrairement à l'hébreu — le raccord se fait par le lemme. Mesuré : **97,45 % des occurrences en exact, 98,45 % après pliage, 98,65 % après retrait des parenthèses ; 1,35 % (1 852 mots, 484 lemmes) hors d'atteinte**. Cause **textuelle et non technique** — SBLGNT critique contre Textus Receptus de 1890 : `Δαυίδ`/`Δαβίδ`, `Καφαρναούμ`/`Καπερναούμ`, `οἶδα`/`εἴδω`. Onze lemmes ambigus. Relevé aussi : `strongs_def` **manque dans 19 entrées grecques** — le type doit la rendre optionnelle. |
| 29 sept. 2026 | **Forme de l'OSHB relevée et mesurée** sur les 39 livres téléchargés : OSIS, 28 527 617 o, 23 213 versets, **306 785 mots**, 8 640 Strong distincts. Quatre pièges : `lemma` n'est pas un numéro (préfixes agglutinés, `+` des noms composés, lettre d'homonyme), **5 977 mots (1,95 %) n'ont aucun numéro**, la ponctuation est en `<seg>` hors des mots, et 2 472 `<note>` anglaises sont au fil du verset. **Mesure décisive : 0 numéro employé absent du lexique** — la source tient. 40 fichiers pour 39 livres (`VerseMap.xml`), correspondance par **nom** et non par position. |
| 29 sept. 2026 | **Forme des lexiques Strong relevée à la source.** CommonJS (`var … = {…}; module.exports`), et non du JSON : découper entre accolades, ne jamais `require()`. Clés `H1`…`H8674` **triées**, `G1`…`G5624` **en désordre**. Les champs diffèrent : le grec dit `translit`, l'hébreu `xlit` + `pron` — un convertisseur écrit sur le grec perdrait 8 674 translittérations en silence. **Correction de licence** : le dépôt n'en déclare aucune, mais les deux fichiers portent « Copyright 2009/2010, Open Scriptures. CC-BY-SA » dans leur en-tête — du copyleft. |
| 29 sept. 2026 | **Décision du propriétaire : Bost est mis de côté, pas abandonné.** La mesure a tranché — 1 015 entrées sur plus de 4 000, texte OCR fautif qu'aucun analyseur ne corrigerait. `scripts/download-bost.mjs` reste au dépôt parce qu'il porte la mesure. L'effort va aux Strong. |
| 29 sept. 2026 | **Composant unique livré** (`TexteBiblique`) : sept rendus de texte biblique rassemblés, règle de numérotation sortie et testée, une exception documentée (la Mémorisation, mot à mot). **Conversion de Bost tentée** depuis l'édition 1865 d'archive.org (Public Domain Mark 1.0, licence lue à la source) : 1 015 entrées sur plus de 4 000, texte OCR fautif — **rien publié**, décision à prendre. |
| 29 sept. 2026 | **Décision du propriétaire : les Strong sur les originaux seulement.** Le balisage du français est écarté. Conséquence assumée : pas de clic sur un mot français pour en voir le Strong. |
| 29 sept. 2026 | **Enquête achevée.** SBLGNT : CC BY 4.0 **sans clause additionnelle**, page relue en entier. OSHB : **28,8 Mo utiles** sur 39 fichiers, et non 79. **Westphal écarté** — sa date de mort est contestée (IdRef 1951 / BnF 1961), mais surtout l'ouvrage est collectif et **André Parrot (1901-1980)** siégeait à son comité : 2051 et non 2022. **Aucun dictionnaire français structuré sous licence vérifiée** ; le seul candidat ne déclare aucune licence. Reste une décision, non une recherche. |
| 28 sept. 2026 | Enquête lancée. Vérifiés à la source : les deux lexiques Strong (3 Mo, dépôt **sans licence déclarée**), OSHB en CC BY 4.0 avec attribution imposée, MorphGNT en deux licences dont CC BY-**SA** pour la morphologie, la page SBLGNT servant une CC BY 4.0. Établi par la liste CrossWire qu'**aucun Segond 1910 balisé Strong fiable et autorisé n'existe**. Bost 1849 confirmé du domaine public, mais sans version structurée. Enquête **interrompue par la limite d'usage** ; cinq points restent ouverts. |
