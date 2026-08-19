import type { BiblePassage } from '@/lib/storage/types';

/**
 * Fabrique les questions du quizz de révision.
 *
 * **Sur les lectures de l'utilisateur, et sur rien d'autre.** Un quizz qui
 * interrogerait toute la Bible ne serait pas une révision : il mesurerait ce
 * qu'on ignore, pas ce qu'on a lu. Les leurres sont donc pris eux aussi parmi
 * les livres déjà lus — se voir proposer Habacuc quand on n'a lu que les
 * Évangiles rend la bonne réponse évidente sans rien réviser.
 *
 * Le module ne connaît ni React ni IndexedDB : il reçoit des versets et rend
 * des questions. C'est ce qui le rend testable, et c'est là que se trouvent
 * les décisions qui comptent.
 */

export type QuestionKind = 'livre' | 'chapitre' | 'trou' | 'reference';

export interface QuizQuestion {
  kind: QuestionKind;
  /** Le verset d'où vient la question, pour l'afficher après la réponse. */
  source: BiblePassage;
  /** L'énoncé variable : le texte du verset, ou le verset à trous. */
  enonce: string;
  choix: string[];
  /** Index de la bonne réponse dans `choix`. */
  bonne: number;
}

/**
 * Un tirage reproductible.
 *
 * `Math.random` rendrait les tests dépendants du hasard, et un quizz
 * impossible à rejouer à l'identique quand on cherche pourquoi une question
 * est mal formée. Le générateur est donc fourni par l'appelant, qui l'ensemence
 * comme il veut.
 */
export type Alea = () => number;

function melange<T>(liste: T[], alea: Alea): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

function tire<T>(liste: T[], alea: Alea): T {
  return liste[Math.floor(alea() * liste.length)];
}

/**
 * Complète une bonne réponse avec des leurres, et rend le tout mélangé.
 *
 * Renvoie `null` s'il n'y a pas assez de leurres distincts : mieux vaut ne pas
 * poser la question que la poser avec deux choix dont l'un est absurde.
 */
function propositions(
  bonne: string,
  leurresPossibles: string[],
  combien: number,
  alea: Alea,
): { choix: string[]; bonne: number } | null {
  const distincts = Array.from(new Set(leurresPossibles)).filter((x) => x !== bonne);
  if (distincts.length < combien - 1) return null;
  const choix = melange([bonne, ...melange(distincts, alea).slice(0, combien - 1)], alea);
  return { choix, bonne: choix.indexOf(bonne) };
}

const PONCTUATION = /[.,;:!?()\[\]«»"'\u2019\u2018\u201c\u201d\u2014\u2013-]/g;

/** Les mots d'un verset, ponctuation comprise, pour le retrait d'un mot. */
function mots(texte: string): string[] {
  return texte.split(/\s+/).filter(Boolean);
}

/**
 * Un mot assez long pour que le retrouver ait du sens.
 *
 * Retirer « et » ou « la » ne demande aucune connaissance du texte : la
 * grammaire suffit. Le seuil de cinq lettres écarte l'essentiel des mots
 * outils sans avoir à en tenir la liste, qui varierait avec la langue.
 */
function motRetirable(liste: string[]): number[] {
  return liste
    .map((m, i) => ({ m: m.replace(PONCTUATION, ''), i }))
    .filter(({ m }) => m.length >= 5)
    .map(({ i }) => i);
}

export interface FabriqueOptions {
  /** Les versets lus, d'où viennent les questions. */
  versets: BiblePassage[];
  /** Le nom affichable d'un livre, dans la langue de l'utilisateur. */
  nomDuLivre: (abreviation: string) => string;
  alea: Alea;
  /** Nombre de propositions par question. */
  choix?: number;
}

/** Une question « de quel livre vient ce verset ? ». */
export function questionLivre(o: FabriqueOptions): QuizQuestion | null {
  const { versets, nomDuLivre, alea, choix = 4 } = o;
  if (versets.length === 0) return null;
  const source = tire(versets, alea);
  const p = propositions(
    nomDuLivre(source.book),
    versets.map((v) => nomDuLivre(v.book)),
    choix,
    alea,
  );
  if (!p) return null;
  return { kind: 'livre', source, enonce: source.text, ...p };
}

/** Une question « de quel chapitre ? », parmi les chapitres lus de ce livre. */
export function questionChapitre(o: FabriqueOptions): QuizQuestion | null {
  const { versets, alea, choix = 4 } = o;
  if (versets.length === 0) return null;
  const source = tire(versets, alea);
  const memeLivre = versets.filter((v) => v.book === source.book);
  const p = propositions(
    String(source.chapter),
    memeLivre.map((v) => String(v.chapter)),
    choix,
    alea,
  );
  if (!p) return null;
  return { kind: 'chapitre', source, enonce: source.text, ...p };
}

/** Une question à trou : un mot du verset est masqué. */
export function questionTrou(o: FabriqueOptions): QuizQuestion | null {
  const { versets, alea, choix = 4 } = o;
  const utilisables = versets.filter((v) => motRetirable(mots(v.text)).length > 0);
  if (utilisables.length === 0) return null;

  const source = tire(utilisables, alea);
  const liste = mots(source.text);
  const position = tire(motRetirable(liste), alea);
  const attendu = liste[position];

  // Les leurres viennent des autres versets lus : des mots du même registre,
  // là où un dictionnaire donnerait des intrus reconnaissables au premier coup.
  const ailleurs = versets
    .filter((v) => v !== source)
    .flatMap((v) => motRetirable(mots(v.text)).map((i) => mots(v.text)[i]));

  const p = propositions(attendu, ailleurs, choix, alea);
  if (!p) return null;

  const enonce = liste.map((m, i) => (i === position ? '……' : m)).join(' ');
  return { kind: 'trou', source, enonce, ...p };
}

/** Une question « quelle est la référence de ce verset ? ». */
export function questionReference(o: FabriqueOptions): QuizQuestion | null {
  const { versets, nomDuLivre, alea, choix = 4 } = o;
  if (versets.length === 0) return null;
  const source = tire(versets, alea);
  const reference = (v: BiblePassage) => `${nomDuLivre(v.book)} ${v.chapter}:${v.verse}`;
  const p = propositions(reference(source), versets.map(reference), choix, alea);
  if (!p) return null;
  return { kind: 'reference', source, enonce: source.text, ...p };
}

const FABRIQUES: Record<QuestionKind, (o: FabriqueOptions) => QuizQuestion | null> = {
  livre: questionLivre,
  chapitre: questionChapitre,
  trou: questionTrou,
  reference: questionReference,
};

/**
 * Un questionnaire complet.
 *
 * Les genres tournent plutôt que d'être tirés au sort : sur dix questions, un
 * tirage indépendant en donnerait volontiers sept du même genre, et le quizz
 * paraîtrait pauvre. On saute les genres qui ne peuvent rien produire — trop
 * peu de livres lus pour faire des leurres, aucun mot assez long — plutôt que
 * de rendre une question bancale.
 *
 * Rend moins de questions que demandé si la matière ne suffit pas. C'est à
 * l'écran de le dire, pas à ce module de le masquer.
 */
export function construireQuiz(o: FabriqueOptions & { nombre: number }): QuizQuestion[] {
  const genres: QuestionKind[] = ['livre', 'trou', 'reference', 'chapitre'];
  const questions: QuizQuestion[] = [];
  const vues = new Set<string>();

  for (let i = 0; questions.length < o.nombre && i < o.nombre * 4; i++) {
    const q = FABRIQUES[genres[i % genres.length]](o);
    if (!q) continue;
    // Deux fois le même verset dans le même genre lasse ; on tolère le même
    // verset sous deux angles différents, qui reste une révision utile.
    const cle = `${q.kind}:${q.source.book}:${q.source.chapter}:${q.source.verse}`;
    if (vues.has(cle)) continue;
    vues.add(cle);
    questions.push(q);
  }
  return questions;
}
