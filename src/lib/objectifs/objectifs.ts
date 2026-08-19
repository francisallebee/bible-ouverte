import type { Objectif, Portee, ReadingEntry, ReadingGoal } from '@/lib/storage/types';

/**
 * Les objectifs de lecture : périodes, progression et séries.
 *
 * Tout est ici, et rien dans les écrans — c'est ce qui permet de tester des
 * règles que l'affichage rendait invisibles. La version précédente calculait
 * les séries dans l'écran Progression, sans test, et **comparait une date UTC
 * à des dates locales** : une lecture enregistrée à 23 h dans un fuseau en
 * avance cassait la série du lendemain.
 */

export type UniteObjectif = Objectif['unite'];
export type PeriodeObjectif = Objectif['periode'];

export type { Objectif, Portee };

export const PORTEE_PAR_DEFAUT: Portee = { type: 'toutes' };

export const OBJECTIF_PAR_DEFAUT: Objectif = {
  unite: 'chapters', periode: 'day', cible: 1, portee: PORTEE_PAR_DEFAUT,
};

/**
 * Ramène un réglage enregistré à la forme actuelle.
 *
 * Les comptes existants portent `{ type: 'chapters-per-day' | 'verses-per-day',
 * target }`, forme qui ne connaissait que le jour. On ne réécrit pas leur
 * réglage en base : la conversion se fait à la lecture, comme pour les jours de
 * plan sans `passages`. Un objectif absent rend le défaut plutôt que `null`,
 * pour que l'appelant n'ait pas à distinguer les deux.
 */
export function normaliserObjectif(brut: ReadingGoal | Objectif | undefined | null): Objectif {
  if (!brut) return OBJECTIF_PAR_DEFAUT;
  if ('unite' in brut) return { ...brut, portee: brut.portee ?? PORTEE_PAR_DEFAUT };
  return {
    unite: brut.type === 'verses-per-day' ? 'verses' : 'chapters',
    periode: 'day',
    cible: brut.target,
    portee: PORTEE_PAR_DEFAUT,
  };
}

function aJour(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** Le jour civil courant, dans le fuseau du lecteur. */
export function aujourdhui(maintenant: Date = new Date()): string {
  return aJour(maintenant);
}

/**
 * Le premier jour de la période qui contient `jour`.
 *
 * La semaine commence le **lundi** : c'est la norme ISO, et celle des pays où
 * l'application est lue. Une semaine commençant le dimanche ferait basculer le
 * décompte un jour trop tôt pour tout le monde ici.
 */
export function debutDePeriode(jour: string, periode: PeriodeObjectif): string {
  const [a, m, j] = jour.split('-').map(Number);
  if (periode === 'day') return jour;
  if (periode === 'month') return `${a}-${String(m).padStart(2, '0')}-01`;
  if (periode === 'year') return `${a}-01-01`;

  const d = new Date(Date.UTC(a, m - 1, j));
  // `getUTCDay` rend 0 pour dimanche : on le ramène à 6 pour que lundi vaille 0.
  const recul = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - recul * 86400000).toISOString().slice(0, 10);
}

/** Ce qu'une lecture apporte, selon l'unité de l'objectif. */
export function apportDe(lecture: ReadingEntry, unite: UniteObjectif): number {
  if (unite === 'chapters') {
    return Math.max(1, lecture.chapterEnd - lecture.chapterStart + 1);
  }
  // Un passage qui court sur plusieurs chapitres n'a pas de compte de versets
  // exact sans consulter le texte : on retient au moins un verset par chapitre,
  // ce qui ne surestime jamais.
  if (lecture.chapterEnd !== lecture.chapterStart) {
    return Math.max(1, lecture.chapterEnd - lecture.chapterStart + 1);
  }
  return Math.max(1, lecture.verseEnd - lecture.verseStart + 1);
}

/**
 * Les lectures que la portée retient.
 *
 * Ce module ignore délibérément les plans : il ne sait pas les lire, et il
 * n'existe de toute façon aucune colonne qui relie une lecture à l'un d'eux.
 * L'appelant résout le plan en identifiants — `readingIdsOf` de
 * `storage/plan-passages.ts` le fait pour chaque jour coché — et les passe ici.
 *
 * **Un plan dont on ne connaît pas encore les lectures ne compte rien.** Rendre
 * la liste entière serait pire qu'un zéro : l'écran afficherait le total de
 * toutes les lectures sous le nom d'un plan, et rien ne le signalerait.
 *
 * Limite héritée, et mesurée : `readingId` porte l'identifiant **Supabase**,
 * `rowToEntry` reprenant `row.id` comme clé locale — la portée tient donc d'un
 * appareil à l'autre. Mais un jour coché **hors ligne** retient l'identifiant
 * temporaire de la lecture, que la synchronisation remplace ensuite sans
 * revenir sur `plan_days` : ce jour-là cesse d'être compté. Le défaut existe
 * déjà pour le décochage, qui supprime les lectures par ces mêmes
 * identifiants ; il n'est pas introduit ici.
 */
export function filtrerParPortee(
  lectures: ReadingEntry[],
  portee: Portee | undefined,
  idsDuPlan?: ReadonlySet<number>,
): ReadingEntry[] {
  if (!portee || portee.type === 'toutes') return lectures;
  if (portee.type === 'livre') return lectures.filter((l) => l.book === portee.livre);
  if (!idsDuPlan) return [];
  return lectures.filter((l) => typeof l.id === 'number' && idsDuPlan.has(l.id));
}

export interface Progression {
  fait: number;
  cible: number;
  /** Entier borné à 100 : une barre ne déborde pas. */
  pourcent: number;
  atteint: boolean;
  depuis: string;
}

/** L'avancement de la période en cours. */
export function progressionDe(
  lectures: ReadingEntry[], objectif: Objectif, jour: string,
): Progression {
  const depuis = debutDePeriode(jour, objectif.periode);
  const fait = lectures
    .filter((l) => l.date >= depuis && l.date <= jour)
    .reduce((n, l) => n + apportDe(l, objectif.unite), 0);
  const cible = Math.max(1, objectif.cible);
  return {
    fait,
    cible,
    pourcent: Math.min(100, Math.round((fait / cible) * 100)),
    atteint: fait >= cible,
    depuis,
  };
}

export interface Series {
  courante: number;
  meilleure: number;
  /** Jours de tolérance restants avant que la série ne casse. */
  tolerance: number;
}

/**
 * Les séries de jours lus, avec une tolérance.
 *
 * **Un jour manqué ne casse pas tout.** Une série qui tombe à zéro pour un
 * dimanche sans lecture décourage plus qu'elle n'encourage, et c'est
 * précisément ce qu'on demande à une série d'éviter. Un trou d'un jour est donc
 * franchi ; deux d'affilée coupent.
 *
 * Les dates comparées sont **locales** des deux côtés : `lecture.date` est un
 * jour civil chez le lecteur, et `jour` doit l'être aussi.
 */
export function calculerSeries(
  lectures: ReadingEntry[], jour: string, tolerance = 1,
): Series {
  const jours = Array.from(new Set(lectures.map((l) => l.date.slice(0, 10)))).sort();
  if (jours.length === 0) return { courante: 0, meilleure: 0, tolerance };

  const ecart = (a: string, b: string) =>
    Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

  let meilleure = 1;
  let suite = 1;
  for (let i = 1; i < jours.length; i++) {
    const d = ecart(jours[i - 1], jours[i]);
    if (d <= tolerance + 1) suite++;
    else suite = 1;
    meilleure = Math.max(meilleure, suite);
  }

  // La série courante ne vaut que si le dernier jour lu n'est pas trop ancien.
  const dernier = jours[jours.length - 1];
  const retard = ecart(dernier, jour);
  if (retard > tolerance + 1) return { courante: 0, meilleure, tolerance };

  let courante = 1;
  for (let i = jours.length - 1; i > 0; i--) {
    if (ecart(jours[i - 1], jours[i]) <= tolerance + 1) courante++;
    else break;
  }
  return { courante, meilleure, tolerance };
}

/**
 * Les paliers de série, et le prochain à viser.
 *
 * Sept, trente, cent, trois cent soixante-cinq : une semaine, un mois, cent
 * jours, une année. Des repères qu'on se donne soi-même, pas des nombres ronds
 * arbitraires.
 */
export const PALIERS = [7, 30, 100, 365] as const;

export function prochainPalier(serie: number): number | null {
  return PALIERS.find((p) => p > serie) ?? null;
}

export function paliersAtteints(serie: number): number[] {
  return PALIERS.filter((p) => p <= serie);
}
