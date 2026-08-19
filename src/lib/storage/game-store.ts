import type { GameSession } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import { insertGameSession, fetchGameSessions } from '@/lib/supabase/store';
import type { GameSessionRow } from '@/lib/supabase/store';

/**
 * Les parties jouées : quizz, mémorisation, verset du jour.
 *
 * Même discipline que le reste de `storage/` : Supabase fait foi, IndexedDB
 * met en cache. Une partie s'écrit d'abord au nuage, puis localement.
 *
 * Une différence assumée avec les lectures : **une partie non poussée n'est pas
 * rejouée plus tard**. Une lecture manquante est une perte pour l'utilisateur ;
 * une partie de quizz manquante ne l'est pas, et une file d'attente à
 * resynchroniser coûterait plus qu'elle ne rapporte. Hors ligne, la partie est
 * conservée localement et comptée dans les statistiques de l'appareil — elle ne
 * remontera simplement pas.
 */

/** La ligne distante emploie `user_id` ; l'objet local, `userId`. */
function ligneVersPartie(r: GameSessionRow): GameSession {
  return {
    id: r.id,
    userId: r.user_id,
    kind: r.kind,
    score: r.score,
    total: r.total,
    book: r.book ?? undefined,
    chapter: r.chapter ?? undefined,
    verse: r.verse ?? undefined,
    details: r.details ?? undefined,
    createdAt: r.createdAt,
    synced: true,
  };
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Enregistre une partie. Rend la partie telle qu'elle a été retenue.
 *
 * N'échoue jamais : un jeu ne doit pas perdre son écran de résultat parce que
 * le réseau a manqué. Le drapeau `synced` dit ce qui est monté.
 */
export async function recordSession(
  partie: Omit<GameSession, 'id' | 'userId' | 'createdAt' | 'synced'>,
): Promise<GameSession> {
  const userId = await getCurrentUserId();
  const complete: GameSession = {
    ...partie,
    userId,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  if (isOnline() && userId !== 'local') {
    const distante = await insertGameSession(complete);
    if (distante) {
      complete.id = distante.id;
      complete.synced = true;
    }
  }

  const db = await getDB();
  // `put` et non `add` : la ligne distante impose son identifiant, et rejouer
  // la même partie après une reprise ne doit pas lever sur une clé déjà prise.
  await db.put('game_sessions', complete);
  return complete;
}

/**
 * Les parties d'un genre, de la plus récente à la plus ancienne.
 *
 * Le distant est relu quand il est joignable, et remplace le cache : c'est lui
 * qui fait foi, et les parties jouées sur un autre appareil doivent apparaître.
 * Hors ligne, le cache sert seul.
 */
export async function getSessions(kind?: string): Promise<GameSession[]> {
  const userId = await getCurrentUserId();

  if (isOnline() && userId !== 'local') {
    const distantes = await fetchGameSessions(kind);
    if (distantes) {
      const db = await getDB();
      const tx = db.transaction('game_sessions', 'readwrite');
      // On ne vide que ce qu'on vient de relire : purger tout le magasin
      // effacerait les parties d'un autre genre, non demandées ici.
      const anciennes = await tx.store.getAll();
      for (const a of anciennes) {
        if ((!kind || a.kind === kind) && a.synced) await tx.store.delete(a.id as number);
      }
      for (const d of distantes) await tx.store.put(ligneVersPartie(d));
      await tx.done;
    }
  }

  const db = await getDB();
  const toutes = await db.getAll('game_sessions');
  return toutes
    .filter((p) => !kind || p.kind === kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface GameStats {
  parties: number;
  /** Somme des bonnes réponses sur somme des questions, en pourcentage entier. */
  reussite: number;
  meilleur: number;
  /** Jours distincts où l'on a joué, ce qui mesure l'habitude mieux que le total. */
  jours: number;
}

/**
 * Les statistiques d'un jeu, à partir de ses parties.
 *
 * Fonction pure, testée : c'est elle qui décide de ce qu'on montre, et les
 * moyennes se trompent facilement. La réussite est calculée sur les **totaux**
 * et non comme une moyenne de pourcentages — dix parties de 1/1 et une de 0/20
 * ne font pas 91 % de réussite mais 33 %.
 */
export function computeStats(parties: GameSession[]): GameStats {
  if (parties.length === 0) return { parties: 0, reussite: 0, meilleur: 0, jours: 0 };

  const score = parties.reduce((n, p) => n + p.score, 0);
  const total = parties.reduce((n, p) => n + p.total, 0);
  const meilleur = parties.reduce(
    (max, p) => (p.total > 0 ? Math.max(max, Math.round((p.score / p.total) * 100)) : max),
    0,
  );
  const jours = new Set(parties.map((p) => p.createdAt.slice(0, 10))).size;

  return {
    parties: parties.length,
    reussite: total > 0 ? Math.round((score / total) * 100) : 0,
    meilleur,
    jours,
  };
}
