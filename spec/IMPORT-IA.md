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
