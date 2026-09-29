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
| **Lexique Strong hébreu** (`openscriptures/strongs`) | **Aucune licence déclarée par le dépôt** — l'API GitHub rend `license: None`, il n'y a pas de fichier `LICENSE`. Le domaine public vient de l'œuvre de 1890, pas d'une déclaration | API GitHub, 28 sept. 2026 | `strongs-hebrew-dictionary.js` : **1,91 Mo** |
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

Une fois tranché, l'ordre des travaux ne dépend plus d'aucune enquête :

1. Le **composant unique de rendu du texte biblique** — préalable indépendant
   du dictionnaire comme des Strong, et le seul moyen que `tsc` garantisse
   l'inventaire des chemins.
2. La **conversion de Bost** depuis HTML, par un script du dépôt.
3. Les **originaux balisés**, si le propriétaire retient cette issue.

## Journal

| Date | Fait |
|---|---|
| 29 sept. 2026 | **Enquête achevée.** SBLGNT : CC BY 4.0 **sans clause additionnelle**, page relue en entier. OSHB : **28,8 Mo utiles** sur 39 fichiers, et non 79. **Westphal écarté** — sa date de mort est contestée (IdRef 1951 / BnF 1961), mais surtout l'ouvrage est collectif et **André Parrot (1901-1980)** siégeait à son comité : 2051 et non 2022. **Aucun dictionnaire français structuré sous licence vérifiée** ; le seul candidat ne déclare aucune licence. Reste une décision, non une recherche. |
| 28 sept. 2026 | Enquête lancée. Vérifiés à la source : les deux lexiques Strong (3 Mo, dépôt **sans licence déclarée**), OSHB en CC BY 4.0 avec attribution imposée, MorphGNT en deux licences dont CC BY-**SA** pour la morphologie, la page SBLGNT servant une CC BY 4.0. Établi par la liste CrossWire qu'**aucun Segond 1910 balisé Strong fiable et autorisé n'existe**. Bost 1849 confirmé du domaine public, mais sans version structurée. Enquête **interrompue par la limite d'usage** ; cinq points restent ouverts. |
