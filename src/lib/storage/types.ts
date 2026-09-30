import type { PlanPassage } from './plan-passages';

import type { Locale } from "@/lib/i18n/locales";

export type DisplayPreset = "smartphone" | "tablet" | "desktop";
export type PlanDuration = "1-year" | "6-months" | "3-months" | "1-month" | "custom";

/**
 * `scheduled` : les jours sont produits à partir d'une durée et d'une date de
 * début. `free` : une liste de passages sans date, cochés un à un à la date de
 * son choix. Absent sur les plans créés avant la migration `free_plans`, qui
 * sont tous datés — d'où le repli sur `scheduled` partout où on le lit.
 */
export type PlanKind = "scheduled" | "free";

export interface ReadingLink {
  url: string;
  title: string;
  thumbnail?: string;
}

export interface ReadingEntry {
  id?: number;
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
  passageText: string;
  translationId: string;
  tags: string[];
  /** Identifiant du ReadingContext. Chaîne vide = aucun contexte renseigné. */
  contextId: string;
  /**
   * Titre de la séance, répété sur chaque lecture d'un même enregistrement.
   *
   * Chaîne vide = séance non nommée, ce qui est un cas normal : le nommage est
   * facultatif, et aucune des lignes antérieures au 31 août 2026 n'en porte.
   */
  sessionTitle: string;
  notes: string;
  userId: string;
  links?: ReadingLink[];
  photos?: string[];
  audio?: string;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

/**
 * Un thème créé par le lecteur, à côté des quinze thèmes du code.
 *
 * Les thèmes de `features/bible/themes.ts` n'ont pas de `name` : leur libellé
 * vit dans les cinq dictionnaires, indexé par leur `slug`. Ceux-ci gardent le
 * texte de celui qui les écrit — on ne traduit pas ce qu'un lecteur a nommé,
 * c'est déjà la règle des contextes.
 */
export interface ThemeUtilisateur {
  /** Engendré par le client : un thème doit pouvoir naître hors ligne. */
  id: string;
  name: string;
  emoji?: string;
  passages: { book: string; chapter: number; verseStart: number; verseEnd: number }[];
  createdAt?: string;
  updatedAt?: string;
  /** true si la ligne existe dans Supabase (drapeau local seulement) */
  synced?: boolean;
}

export interface ReadingContext {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  emoji?: string;
  parentId?: string;
  isSystemDefault: boolean;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface BibleVersion {
  id: string;
  name: string;
  language: string;
  copyrightStatus: string;
  source: string;
  isEnabled: boolean;
}

/**
 * Un lexique Strong, tel que les Réglages le proposent.
 *
 * Deux entrées seulement — l'hébreu et le grec — et **deux cases séparées**,
 * non une seule. Le choix est mesuré : l'hébreu pèse 2,53 Mio et le grec
 * 1,47 Mio, et qui ne lit que le Nouveau Testament n'a aucune raison de
 * descendre les deux tiers du poids pour rien. C'est la même logique que les
 * douze traductions, où rien n'arrive sans être demandé (règle 4).
 *
 * Volontairement **distinct de `BibleVersion`** : un lexique n'est pas une
 * version et n'a rien à faire dans le sélecteur de version, ni dans
 * l'Historique, ni dans les Statistiques. Les mêlanger aurait fait apparaître
 * « Lexique Strong grec » au moment de choisir dans quelle Bible on lit.
 */
export interface LexiqueStrong {
  id: string;
  name: string;
  /**
   * La mention imposée par la licence, recopiée du fichier à l'import.
   *
   * Elle vit dans le fichier servi — seule source — mais doit rester lisible
   * **hors ligne**, quand plus rien ne se télécharge. La recopier ici à
   * l'import est ce qui l'y rend disponible sans la dupliquer dans le code.
   * C'est la contrepartie de la CC BY-SA acceptée le 29 septembre 2026.
   */
  attribution?: string;
  /** `he` ou `el` — la langue **du lexique**, jamais celle de l'interface. */
  language: string;
  copyrightStatus: string;
  source: string;
  isEnabled: boolean;
}

/**
 * Une entrée de lexique, telle que `scripts/download-strong.mjs` la produit.
 *
 * `definition` est **optionnelle**, et ce n'est pas une précaution de style :
 * elle manque dans 19 des 5 523 entrées grecques, mesuré le 29 septembre 2026.
 * Parmi elles `G1473` — `ἐγώ`, « je » —, qui paraît 2 572 fois dans le
 * Nouveau Testament. La déclarer obligatoire ferait mentir `tsc` sur le
 * pronom le plus courant du texte. `derivation` et `kjvDef` manquent aussi,
 * plus rarement ; `pron` n'existe qu'en hébreu.
 */
export interface EntreeStrong {
  /** `H1` … `H8674`, `G1` … `G5624`. Le préfixe dit le lexique. */
  number: string;
  lexiqueId: string;
  /** Le mot original : `אָב`, `ἐκτελέω`. */
  word: string;
  /** Translittération. La source la nomme `xlit` en hébreu, `translit` en grec. */
  translit?: string;
  /** Prononciation — hébreu seulement. */
  pron?: string;
  definition?: string;
  derivation?: string;
  kjvDef?: string;
}

/**
 * Un mot du texte original, tel que `scripts/download-originaux.mjs` l'écrit.
 *
 * Les clés sont **d'une lettre**, et ce n'est pas de la coquetterie : 444 339
 * mots portent chacun les leurs, et des noms lisibles coûtaient 4 Mio mesurés.
 * Le fichier n'est pas lu par un humain ; ce type l'est.
 */
export interface MotOriginal {
  /** Le mot tel qu'il s'écrit. */
  t: string
  /**
   * Le numéro Strong — **absent pour 2 % de l'hébreu et 0,7 % du grec**.
   *
   * Côté hébreu ce sont les formes préposition + suffixe, qui n'en ont pas ;
   * côté grec, les lemmes en attente dans `scripts/strong-grec-manuel.json` et
   * six homographes laissés sans numéro à dessein. L'affichage doit donc
   * prévoir le mot qu'on clique et qui n'a rien à montrer.
   */
  s?: string
  /** Le code morphologique. OSHB et MorphGNT ne le notent pas pareil. */
  m?: string
  /** Le lemme — grec seulement : c'est par lui que le raccord Strong se fait. */
  l?: string
  /**
   * Ce qui se colle au mot : maqqef `־`, sof-pasuq `׃`, paseq `׀`.
   *
   * Hébreu seulement. Ces signes sont des `<seg>` **entre** les mots dans la
   * source, jamais dedans — 42 577 et 23 192 d'entre eux. Les oublier
   * recollerait les mots et retirerait les fins de verset.
   */
  a?: string
}

/** Un verset du texte original, tel qu'il est mis en cache. */
export interface VersetOriginal {
  /** `GEN.1.1` — la clé du magasin, et l'ordre canonique n'y est pas. */
  ref: string
  /** `he` ou `el` : ce qui permet d'effacer une langue sans toucher l'autre. */
  langue: string
  book: string
  chapter: number
  verse: number
  mots: MotOriginal[]
}

export interface BiblePassage {
  id?: number;
  versionId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ReadingPlan {
  id?: number;
  userId: string;
  name: string;
  versionId: string;
  kind?: PlanKind;
  duration: PlanDuration;
  customDays?: number;
  books?: string[];
  startDate: string;
  totalDays: number;
  /**
   * Le chemin, dans le seau `documents`, du PDF dont le plan est tiré —
   * `{user_id}/{uuid}.pdf`. Chaque jour porte alors ses pages (`pageDebut`,
   * `pageFin`) et se lit dans le document lui-même. Absent sur tout autre plan.
   */
  document?: string;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
  /**
   * L'identifiant du compte **à qui ce plan est partagé**, quand ce n'est pas
   * le sien. Champ local uniquement, absent de la base.
   *
   * Il porte un identifiant plutôt qu'un booléen, et ce n'est pas du zèle : un
   * `partage: true` survivrait à un changement de compte sur le même appareil,
   * et l'ancien lecteur verrait les plans du nouveau dans son cache. C'est
   * exactement ce que le filtre `p.userId === userId` protégeait jusqu'ici, et
   * qu'ouvrir la liste aux plans d'autrui aurait supprimé sans le dire.
   */
  partageA?: string;
}

/** Un membre d'un plan partagé, tel que `membres_du_plan()` le rend. */
export interface PlanMembre {
  userId: string;
  nom: string;
  role: 'proprietaire' | 'membre';
  joinedAt: string;
}

/** Une invitation émise, telle que son auteur la voit. */
export interface PlanInvitation {
  id: number;
  planId: number;
  jeton: string;
  /** Renseignée pour une invitation nominative, absente pour un lien ouvert. */
  email?: string;
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'revoquee';
  createdAt: string;
  expiresAt: string;
}

/**
 * Ce qu'un invité voit **avant** de décider — et rien de plus.
 *
 * Pas les jours, pas les autres membres, pas le document : juste de quoi
 * répondre. C'est ce que rend `invitation_par_jeton()`, qui est ouverte à
 * `anon` pour qu'une personne sans compte sache qui l'invite et à quoi.
 */
export interface InvitationVue {
  planNom: string;
  invitePar: string;
  statut: PlanInvitation['statut'];
  expiree: boolean;
  dejaMembre: boolean;
  /**
   * `true` si l'invitation porte un destinataire.
   *
   * L'écran en a besoin pour ne proposer « Refuser » que là où c'est possible :
   * un lien ouvert ne se refuse pas — le refuser le fermerait pour tous ceux
   * qui l'ont reçu —, et la fonction en base lève. Un bouton qui échoue est
   * pire que pas de bouton.
   */
  nominative: boolean;
}

/**
 * Un verset en cours d'apprentissage, et son échéance.
 *
 * L'état, pas la trace : il change à chaque séance. Les séances elles-mêmes
 * sont journalisées dans `GameSession`.
 */
export interface MemorisedVerse {
  id?: number;
  userId: string;
  book: string;
  /** Début de l'intervalle. Un verset seul a sa fin égale à son début. */
  chapter: number;
  verse: number;
  /**
   * Fin de l'intervalle, depuis le 15 septembre 2026 : un groupe de versets
   * est un seul texte appris, donc une seule ligne — pas une par verset.
   */
  chapterEnd: number;
  verseEnd: number;
  versionId: string;
  niveau: number;
  /** Jour civil de la prochaine révision, `AAAA-MM-JJ`. */
  prochain: string;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

/** Le genre d'une partie. Non contraint côté base : ajouter un jeu ne doit rien migrer. */
export type GameKind = 'quiz' | 'memorisation' | 'verset-du-jour';

/**
 * Une partie jouée, quel que soit le jeu.
 *
 * `details` porte ce qui est propre à chaque jeu — le genre des questions
 * ratées, le nombre d'indices demandés — de sorte qu'ajouter un jeu ne demande
 * ni migration ni colonne. Voir `20260819160000_game_sessions.sql`.
 */
export interface GameSession {
  id?: number;
  userId: string;
  kind: GameKind | string;
  score: number;
  total: number;
  /** Le passage travaillé, quand il y en a un. Absent pour un quizz, qui en couvre plusieurs. */
  book?: string;
  chapter?: number;
  verse?: number;
  details?: Record<string, unknown>;
  createdAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface PlanDay {
  id?: number;
  planId: number;
  userId: string;
  day: number;
  /**
   * Plan daté : le jour prévu. Plan libre : chaîne vide tant que l'entrée n'est
   * pas cochée, puis la date de lecture choisie.
   */
  date: string;
  /**
   * Le livre du premier passage — ou **la chaîne vide** quand le jour ne lit
   * pas la Bible mais une portion du document du plan (`pageDebut`/`pageFin`,
   * `titre`) : `dayPassages` rend alors une liste vide, et cocher le jour ne
   * crée aucune lecture. En base, c'est `null` (migration `20260917220000`).
   */
  book: string;
  chapterStart: number;
  chapterEnd: number;
  /** 1 sur les plans datés, qui raisonnent au chapitre. */
  verseStart: number;
  verseEnd: number;
  /**
   * Les passages du jour, quand il y en a plusieurs.
   *
   * Absente, la journée n'en compte qu'un, décrit par les colonnes ci-dessus —
   * qui portent de toute façon le premier passage. Voir `dayPassages` dans
   * `plan-passages.ts` : c'est lui qui lit les deux formes, et rien d'autre ne
   * doit connaître cette distinction.
   */
  passages?: PlanPassage[];
  /**
   * Le texte à lire ce jour, en plus des passages : la page d'un document dont
   * le plan est tiré, quand le lecteur a choisi de lire le document en entier
   * et non ses seules références. Absent sur tout autre plan.
   */
  texte?: string;
  /** Les pages du document du plan à lire ce jour, à partir de 1, bornes incluses. Absentes sans document. */
  pageDebut?: number;
  pageFin?: number;
  /** Le nom de la portion lue ce jour — signet du PDF ou première ligne de la page. */
  titre?: string;
  isRead: boolean;
  readingId?: number;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

/**
 * L'ancienne forme de l'objectif, qui ne connaissait que le jour.
 *
 * Conservée parce que les comptes existants la portent en base : la conversion
 * se fait à la lecture, par `normaliserObjectif`, et non par une réécriture.
 */
export interface ReadingGoal {
  type: "chapters-per-day" | "verses-per-day";
  target: number;
}

/**
 * Ce qu'un objectif compte.
 *
 * `toutes` est le défaut et l'unique forme d'avant le 19 août 2026 : un
 * objectif sans portée en base se relit ainsi, sans réécriture, comme
 * l'ancienne forme `ReadingGoal`.
 *
 * Les deux autres ne se mesurent pas de la même façon, et c'est le point à
 * connaître avant d'y toucher :
 *
 * - **Par livre**, le filtre porte sur `readings.book`, qui stocke
 *   l'abréviation USFM (`GEN`, `JHN`). Aucune ligne n'est concernée par une
 *   traduction, et le libellé se retrouve par `i18n/books.ts`.
 * - **Par plan**, il n'existe **aucune** colonne reliant une lecture à un
 *   plan, et le contexte « Plan de lecture » est le même pour tous. Le seul
 *   lien est `plan_days.readingId`, posé au cochage. C'est donc l'appelant qui
 *   résout le plan en identifiants de lectures ; l'objectif ne connaît pas les
 *   plans.
 */
export type Portee =
  | { type: "toutes" }
  | { type: "livre"; livre: string }
  | { type: "plan"; planId: number };

/** La forme actuelle : une unité, une période, une cible, et ce qu'on compte. */
export interface Objectif {
  /**
   * `minutes` n'est pas chronométré : il est **estimé** d'après ce qui a été
   * lu, à partir du poids en mots du livre. Voir `objectifs/mots.ts`.
   */
  unite: "chapters" | "verses" | "minutes";
  periode: "day" | "week" | "month" | "year";
  cible: number;
  /** Absente sur les objectifs enregistrés avant le 19 août 2026. */
  portee?: Portee;
}

export interface RoadmapItem {
  id?: number;
  title: string;
  description: string;
  /**
   * `suspendu` plutôt que `suspended` : ce champ suit `projet`, déjà en
   * français, et évite l'homonymie avec `profiles.suspended`, qui désigne
   * tout autre chose — un compte, pas un chantier.
   */
  status: 'planned' | 'projet' | 'in-progress' | 'suspendu' | 'done' | 'cancelled';
  reactions?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface SupportTicket {
  id?: number;
  userId: string;
  userName: string;
  type: 'bug' | 'suggestion';
  message: string;
  status?: string;
  createdAt: string;
  replies: SupportReply[];
  /** true si la ligne existe dans Supabase (flag local uniquement) */
  synced?: boolean;
}

export interface SupportReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  defaultVersionId: string;
  theme: string;
  colorTheme: string;
  displayPreset: DisplayPreset;
  offlineModeEnabled: boolean;
  firstLaunchCompleted: boolean;

  readingGoal?: ReadingGoal | Objectif;
  audioSpeed?: number;
  /**
   * Minutes d'inactivité avant déconnexion. 0 ou absent : jamais — c'est la
   * valeur des comptes qui n'ont rien réglé, dont le comportement ne doit pas
   * changer du jour au lendemain.
   */
  autoLogoutMinutes?: number;
  /**
   * Choix de l'utilisateur pour son compte. Ne dit rien de l'appareil : la
   * permission du navigateur peut avoir été révoquée depuis, et c'est elle qui
   * tranche (voir `notificationStatus` dans `lib/notifications.ts`).
   */
  notificationsEnabled?: boolean;
  /**
   * Un interrupteur par déclencheur, par identifiant. Une clé absente prend sa
   * valeur par défaut : voir `resolveTriggers` dans `lib/notifications.ts`, sans
   * quoi un déclencheur ajouté plus tard serait lu comme refusé.
   */
  notificationTriggers?: Record<string, boolean>;
  /** Heure du rappel quotidien, au format `HH:MM`. */
  dailyReminderTime?: string;
  /**
   * La page où l'on arrive en ouvrant l'application.
   *
   * Absente = `/new-reading`, le comportement de tous les comptes jusqu'au
   * 1er septembre 2026. C'est le **middleware** qui la lit, donc le serveur :
   * elle doit rester un chemin de `PAGES_ACCUEIL` (`lib/accueil.ts`), qui
   * arbitre aussi le cas d'une page masquée entre-temps.
   */
  homePage?: string;
  /**
   * Le verset du jour déjà tiré, et le jour local pour lequel il l'a été.
   *
   * Sans cette mémoire, le tirage se refaisait à chaque ouverture — et il
   * changeait, parce qu'il vaut `condense(jour) % matiere.length` et que la
   * matière vient des lectures de l'utilisateur. Marquer le verset « lu »
   * enregistre une lecture : le verset se déplaçait donc lui-même, ce qu'un
   * « verset du jour » ne peut pas faire.
   *
   * Vit dans les réglages parce qu'ils sont une colonne `jsonb` poussée en
   * bloc : ni migration, ni piège des trois chemins — et la mémoire se
   * synchronise entre appareils, ce qui donne le même verset partout.
   */
  versetDuJour?: { jour: string; book: string; chapter: number; verse: number };
  /**
   * Fuseau de l'appareil, en identifiant IANA. Sans lui, « à 7 h » n'a pas de
   * sens côté serveur : les dates de l'application sont des `YYYY-MM-DD` nus.
   */
  timeZone?: string;
  /**
   * Date à laquelle le parcours découverte a été vu, terminé ou passé.
   *
   * Absente : il se déclenchera à la prochaine ouverture. Distincte de
   * `firstLaunchCompleted`, qui appartient à `seedIfNeeded` et dit tout autre
   * chose — qu'un compte a reçu ses données de départ. Les confondre relancerait
   * l'amorçage ou le parcours l'un pour l'autre.
   *
   * Une date plutôt qu'un booléen : elle s'affiche dans les réglages, et elle
   * permettra de reproposer le parcours si son contenu change un jour.
   */
  tourCompletedAt?: string;
  /**
   * Pages retirées du menu par l'utilisateur, par `href`. Une page absente de
   * cette liste est visible : le défaut est « tout visible », y compris pour
   * une page ajoutée après que l'utilisateur a enregistré sa liste.
   */
  hiddenPages?: string[];
  /**
   * L'ordre des entrées du menu, par `href`.
   *
   * Une liste partielle suffit : ce qui y figure passe devant, dans cet ordre,
   * et le reste suit à sa place d'origine. Une page ajoutée plus tard apparaît
   * donc toujours, comme pour `hiddenPages` — voir `ordonnerPages`.
   */
  pageOrder?: string[];
  /**
   * Quand l'utilisateur a validé sa personnalisation. Voir `lib/setup.ts` :
   * seuls les comptes créés après la livraison y sont conduits.
   */
  setupCompletedAt?: string;
  /**
   * Les deux couleurs de la charte personnalisée. Les trois autres nuances
   * s'en déduisent — voir `derivedColors` dans `lib/themes.ts`.
   */
  customColors?: { primary: string; accent: string };
  /** Police de l'interface, par identifiant — voir `lib/fonts.ts`. */
  uiFont?: string;
  /** Police du texte biblique, réglée séparément de celle de l'interface. */
  readingFont?: string;
  /** Échelle de l'interface — voir `UI_SCALES` dans `lib/fonts.ts`. */
  uiScale?: string;
  /** Taille du texte biblique, indépendante de celle de l'interface. */
  readingSize?: string;
  /** Style du texte biblique : normal, italique, gras, gras italique. */
  readingStyle?: string;
  /**
   * Langue de l'interface, en code court : `fr`, `en`, `es`, `it`, `ar`.
   *
   * Absente : la langue du navigateur décide, et le français en dernier
   * recours (`resolveLocale`). Ne jamais l'écrire par défaut à l'amorçage —
   * une valeur posée d'office empêcherait le navigateur de s'exprimer, et un
   * compte créé sur un appareil anglophone démarrerait en français.
   *
   * Le texte biblique ne suit pas : `public/bibles/` ne porte que des versions
   * françaises.
   */
  language?: Locale;
  /**
   * Date de la dernière modification, posée par `updateSettings`.
   *
   * Elle sert à arbitrer entre ce cache et le cloud quand les deux ont bougé
   * chacun de leur côté. Sans elle, un appareil dont la poussée avait échoué
   * réécrivait sa valeur par-dessus une plus récente à sa session suivante —
   * c'est ainsi qu'une langue remise en français repartait en anglais.
   *
   * Poussée dans le `jsonb` avec le reste : le distant porte donc la date de
   * la modification, là où la colonne `updatedAt` de la table porte celle de
   * la poussée. Les deux diffèrent dès qu'un appareil a travaillé hors ligne.
   */
  updatedAt?: string;
  /** true si une modification locale n'a pas encore été poussée vers le cloud */
  _dirty?: boolean;
}
