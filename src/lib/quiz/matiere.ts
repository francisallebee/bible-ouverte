import type { BiblePassage, ReadingEntry } from '@/lib/storage/types';
import { getPassagesForRange } from '@/lib/storage/passage-store';

/**
 * Rassemble les versets sur lesquels interroger l'utilisateur.
 *
 * Charger tout ce qu'il a lu serait absurde : cent lectures de trois chapitres
 * font plusieurs milliers de versets pour en poser dix. On échantillonne donc
 * les lectures, puis on plafonne les versets.
 *
 * **L'échantillon est tiré sur les lectures et non sur les versets**, et c'est
 * délibéré : tirer parmi les versets ferait gagner les longs passages, si bien
 * qu'un quizz porterait presque toujours sur le même chapitre de Psaumes lu en
 * entier, et jamais sur le verset isolé noté un matin.
 */

const LECTURES_MAX = 40;
const VERSETS_MAX = 240;

export interface MatiereOptions {
  lectures: ReadingEntry[];
  versionId: string;
  alea: () => number;
}

function melange<T>(liste: T[], alea: () => number): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Les versets tirés des lectures, dans la version demandée.
 *
 * Une lecture dont le texte n'est pas en cache — version non importée, livre
 * absent — ne rend rien et n'interrompt pas la collecte : mieux vaut un quizz
 * sur ce qui est disponible qu'un écran d'erreur.
 */
export async function rassemblerVersets(o: MatiereOptions): Promise<BiblePassage[]> {
  const echantillon = melange(o.lectures, o.alea).slice(0, LECTURES_MAX);
  const versets: BiblePassage[] = [];

  for (const lecture of echantillon) {
    if (versets.length >= VERSETS_MAX) break;
    try {
      const trouves = await getPassagesForRange(o.versionId, lecture.book, {
        chapterStart: lecture.chapterStart,
        chapterEnd: lecture.chapterEnd,
        verseStart: lecture.verseStart,
        verseEnd: lecture.verseEnd,
      });
      versets.push(...trouves);
    } catch {
      // Version non importée sur cet appareil : on passe à la lecture suivante.
    }
  }

  // Les versets très courts ne font ni bonne question ni bon leurre : « Jésus
  // pleura » ne se devine pas, il se reconnaît.
  return melange(versets.filter((v) => v.text.trim().split(/\s+/).length >= 6), o.alea)
    .slice(0, VERSETS_MAX);
}
