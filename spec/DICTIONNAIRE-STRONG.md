# Dictionnaire biblique, codes Strong, interlinéaire — enquête sur les sources

Demandé par le propriétaire le 28 septembre 2026 : un dictionnaire biblique
libre de droits accessible d'un clic sur un mot, et les codes Strong avec les
interlinéaires. Enquête lancée le soir même, **interrompue par la limite
d'usage** — ce document dit ce qui est vérifié, ce qui ne l'est pas, et ce
qu'il reste à faire.

Règle de lecture, celle de `spec/DROITS.md` : **ce qui n'a pas été lu à la
source est signalé comme non vérifié.** La piste Biblica, restée en l'air
depuis le 2 septembre parce que sa page rend `403`, est là pour le rappeler.

## Ce qui est vérifié, et à quelle source

| Ressource | Licence relevée | Où | Poids |
|---|---|---|---|
| **Lexique Strong hébreu** (`openscriptures/strongs`) | **Aucune licence déclarée par le dépôt** — l'API GitHub rend `license: None`, il n'y a pas de fichier `LICENSE`. Le domaine public vient de l'œuvre de 1890, pas d'une déclaration | API GitHub, 28 sept. 2026 | `strongs-hebrew-dictionary.js` : **1,91 Mo** |
| **Lexique Strong grec** (même dépôt) | idem | idem | `strongs-greek-dictionary.js` : **1,15 Mo** |
| **Ancien Testament hébreu + morphologie** (`openscriptures/morphhb`, OSHB) | **CC BY 4.0**, sur la base du *Westminster Leningrad Codex*, domaine public. Attribution à la formule imposée : « Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb » | `LICENSE.md` lu à la source | dépôt **79 Mo** (le sous-ensemble utile reste à mesurer) |
| **Nouveau Testament grec + morphologie** (`morphgnt/sblgnt`) | Deux licences distinctes : le **texte SBLGNT** sous sa propre licence, l'**analyse morphologique** sous **CC BY-SA 3.0** — copyleft, à ne pas confondre avec BY | `README.md` lu à la source | dépôt **20,6 Mo** |
| **Licence du texte SBLGNT** | La page annoncée comme « EULA » sert en réalité une **Creative Commons Attribution 4.0 International** | `sblgnt.com/license`, lu à la source le 28 sept. 2026 | — |
| **Segond 1910** (le texte seul) | Domaine public — confirmé par les développeurs CrossWire | liste `sword-devel`, nov. 2024 | déjà au dépôt |

**Le lexique Strong tient donc en 3 Mo pour les deux langues** — dérisoire à
côté des 82 Mo de `public/bibles/`. Ce n'est pas lui qui pose problème.

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

**Non vérifié, à faire :** Westphal (*Dictionnaire encyclopédique de la
Bible*, 1932-1935) — l'auteur étant mort en 1951, l'œuvre serait dans le
domaine public en France depuis 2022, mais **cela n'a pas été contrôlé** et la
date de mort n'a pas été confirmée à une source primaire. Ce serait un
dictionnaire bien plus riche et moderne que Bost.

## Ce qui n'est pas une question de contenu mais d'architecture

« Accessible partout quand on clique sur un mot » est un **inventaire de
chemins**, du même genre que la mention de copyright de `spec/DROITS.md` :
l'aperçu, la recherche biblique, le verset du jour, la mémorisation, le détail
d'une lecture, le lecteur de document. Le rendre sûr par `tsc` suppose de faire
passer tout affichage de texte biblique par **un composant unique**, que le
produit n'a pas encore. Ce refactoring est le préalable, et il est
indépendant du choix du dictionnaire.

## Ce qu'il reste à faire

1. Vérifier la licence exacte du **texte** SBLGNT au-delà de l'en-tête CC BY 4.0
   relevé (lire la page en entier, les licences CC portant parfois des
   mentions additionnelles).
2. Vérifier la date de mort d'**Alexandre Westphal** à une source primaire, et
   l'existence d'un exemplaire numérisé exploitable.
3. Mesurer le **sous-ensemble utile** d'OSHB (les 79 Mo sont le dépôt entier,
   pas la donnée).
4. Chercher si un **dictionnaire français en données structurées** existe déjà
   sous licence libre, ce qui éviterait la conversion.
5. Trancher, avec le propriétaire, l'issue du point Strong (originaux seuls, ou
   chantier de balisage).

## Journal

| Date | Fait |
|---|---|
| 28 sept. 2026 | Enquête lancée. Vérifiés à la source : les deux lexiques Strong (3 Mo, dépôt **sans licence déclarée**), OSHB en CC BY 4.0 avec attribution imposée, MorphGNT en deux licences dont CC BY-**SA** pour la morphologie, la page SBLGNT servant une CC BY 4.0. Établi par la liste CrossWire qu'**aucun Segond 1910 balisé Strong fiable et autorisé n'existe**. Bost 1849 confirmé du domaine public, mais sans version structurée. Enquête **interrompue par la limite d'usage** ; cinq points restent ouverts. |
