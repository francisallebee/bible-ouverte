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

### L'étape suivante, et ce qu'elle suppose

L'OSHB — 28,8 Mo utiles sur 39 fichiers XML, CC BY 4.0 avec formule
d'attribution imposée — n'a **pas** encore été ouvert. Sa forme reste à
relever comme celle-ci vient de l'être, et rien ne dit qu'elle se devine
mieux.

## Journal

| Date | Fait |
|---|---|
| 29 sept. 2026 | **Forme des lexiques Strong relevée à la source.** CommonJS (`var … = {…}; module.exports`), et non du JSON : découper entre accolades, ne jamais `require()`. Clés `H1`…`H8674` **triées**, `G1`…`G5624` **en désordre**. Les champs diffèrent : le grec dit `translit`, l'hébreu `xlit` + `pron` — un convertisseur écrit sur le grec perdrait 8 674 translittérations en silence. **Correction de licence** : le dépôt n'en déclare aucune, mais les deux fichiers portent « Copyright 2009/2010, Open Scriptures. CC-BY-SA » dans leur en-tête — du copyleft. |
| 29 sept. 2026 | **Décision du propriétaire : Bost est mis de côté, pas abandonné.** La mesure a tranché — 1 015 entrées sur plus de 4 000, texte OCR fautif qu'aucun analyseur ne corrigerait. `scripts/download-bost.mjs` reste au dépôt parce qu'il porte la mesure. L'effort va aux Strong. |
| 29 sept. 2026 | **Composant unique livré** (`TexteBiblique`) : sept rendus de texte biblique rassemblés, règle de numérotation sortie et testée, une exception documentée (la Mémorisation, mot à mot). **Conversion de Bost tentée** depuis l'édition 1865 d'archive.org (Public Domain Mark 1.0, licence lue à la source) : 1 015 entrées sur plus de 4 000, texte OCR fautif — **rien publié**, décision à prendre. |
| 29 sept. 2026 | **Décision du propriétaire : les Strong sur les originaux seulement.** Le balisage du français est écarté. Conséquence assumée : pas de clic sur un mot français pour en voir le Strong. |
| 29 sept. 2026 | **Enquête achevée.** SBLGNT : CC BY 4.0 **sans clause additionnelle**, page relue en entier. OSHB : **28,8 Mo utiles** sur 39 fichiers, et non 79. **Westphal écarté** — sa date de mort est contestée (IdRef 1951 / BnF 1961), mais surtout l'ouvrage est collectif et **André Parrot (1901-1980)** siégeait à son comité : 2051 et non 2022. **Aucun dictionnaire français structuré sous licence vérifiée** ; le seul candidat ne déclare aucune licence. Reste une décision, non une recherche. |
| 28 sept. 2026 | Enquête lancée. Vérifiés à la source : les deux lexiques Strong (3 Mo, dépôt **sans licence déclarée**), OSHB en CC BY 4.0 avec attribution imposée, MorphGNT en deux licences dont CC BY-**SA** pour la morphologie, la page SBLGNT servant une CC BY 4.0. Établi par la liste CrossWire qu'**aucun Segond 1910 balisé Strong fiable et autorisé n'existe**. Bost 1849 confirmé du domaine public, mais sans version structurée. Enquête **interrompue par la limite d'usage** ; cinq points restent ouverts. |
