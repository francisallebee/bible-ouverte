import type { SupportTicket, SupportReply } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';
import {
  fetchTickets,
  insertTicket as supabaseInsert,
  updateTicketRemote as supabaseUpdate,
  deleteTicketRemote as supabaseDelete,
} from '@/lib/supabase/store';
import type { TicketRow } from '@/lib/supabase/store';

function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

function rowToTicket(r: TicketRow): SupportTicket {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.userName,
    type: (r.type === 'suggestion' ? 'suggestion' : 'bug'),
    message: r.message,
    status: r.status,
    createdAt: r.createdAt,
    replies: Array.isArray(r.replies) ? r.replies : [],
    synced: true,
  };
}

/**
 * Les tickets sont partagés entre tous les utilisateurs connectés :
 * le cloud fait foi. Les tickets locaux jamais synchronisés (créés hors
 * ligne ou avant la sync) sont poussés puis le cache est remplacé.
 */
async function syncTickets(): Promise<void> {
  const db = await getDB();

  // 1. Pousse les tickets locaux jamais synchronisés
  const local = await db.getAll('support_tickets');
  for (const t of local.filter(t => !t.synced)) {
    const created = await supabaseInsert({
      userName: t.userName,
      type: t.type,
      message: t.message,
      replies: t.replies ?? [],
    });
    if (created && t.id !== undefined) {
      await db.delete('support_tickets', t.id);
      await db.put('support_tickets', rowToTicket(created));
    }
  }

  // 2. Le cloud fait foi : remplace le cache par l'état distant
  const rows = await fetchTickets();
  if (rows === null) return;
  const remaining = await db.getAll('support_tickets');
  const stillUnsynced = remaining.filter(t => !t.synced);
  const tx = db.transaction('support_tickets', 'readwrite');
  await tx.store.clear();
  for (const r of rows) {
    await tx.store.put(rowToTicket(r));
  }
  // Conserve les tickets locaux qui n'ont pas pu être poussés
  for (const t of stillUnsynced) {
    await tx.store.put(t);
  }
  await tx.done;
}

export async function getAllTickets(): Promise<SupportTicket[]> {
  const userId = await getCurrentUserId();
  if (isOnline() && userId !== 'local') {
    try { await syncTickets(); } catch { /* cache local en secours */ }
  }
  const db = await getDB();
  const all = await db.getAll('support_tickets');
  return all.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function addTicket(data: { type: 'bug' | 'suggestion'; message: string; userName: string }): Promise<number> {
  const db = await getDB();
  const userId = await getCurrentUserId();

  if (isOnline() && userId !== 'local') {
    const created = await supabaseInsert({
      userName: data.userName,
      type: data.type,
      message: data.message,
      replies: [],
    });
    if (created) {
      await db.put('support_tickets', rowToTicket(created));
      return created.id;
    }
  }

  return db.add('support_tickets', {
    userId,
    userName: data.userName,
    type: data.type,
    message: data.message,
    createdAt: new Date().toISOString(),
    replies: [],
  });
}

/**
 * Supprime un ticket, réponses comprises. Réservé aux administrateurs.
 *
 * Contrairement aux lectures ou aux plans, le cache n'est pas vidé d'abord :
 * les tickets sont un contenu partagé dont le cloud fait foi, et `syncTickets`
 * remplace le cache par l'état distant à chaque lecture. Une suppression
 * seulement locale serait donc annulée au chargement suivant. Le cache n'est
 * effacé qu'une fois le distant confirmé.
 *
 * Renvoie faux si l'opération n'a pas abouti — hors ligne, ou compte non
 * administrateur écarté par la RLS.
 */
export async function deleteTicket(id: number): Promise<boolean> {
  if (!isOnline()) return false;
  const deleted = await supabaseDelete(id);
  if (!deleted) return false;
  const db = await getDB();
  await db.delete('support_tickets', id);
  return true;
}

/**
 * Ajoute une réponse à un ticket. Renvoie faux si elle n'a pas été écrite.
 *
 * Le distant passe **avant** le cache, contrairement au reste de
 * `src/lib/storage/` : pour les tickets, c'est le cloud qui fait foi, et
 * `syncTickets` remplace le cache par l'état distant à chaque lecture. Une
 * réponse écrite localement avant l'aller-retour resterait donc affichée
 * jusqu'à la synchronisation suivante, qui la ferait disparaître sans un mot.
 *
 * Le cas n'est plus théorique depuis la migration
 * `20260818200000_tickets_closed_lock` : `guard_ticket_update` refuse par une
 * exception toute réponse sur un ticket clos. C'est ce refus que le booléen
 * fait remonter jusqu'à l'écran.
 *
 * Hors ligne, ou pour un ticket jamais poussé, on retombe sur l'écriture locale
 * seule — `syncTickets` la poussera à la prochaine occasion.
 */
export async function addReply(ticketId: number, text: string, isAdmin: boolean, userName: string): Promise<boolean> {
  const db = await getDB();
  const ticket = await db.get('support_tickets', ticketId);
  if (!ticket) return false;
  const userId = await getCurrentUserId();
  const reply: SupportReply = {
    id: crypto.randomUUID(),
    userId,
    userName,
    text,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  const replies = [...(ticket.replies ?? []), reply];

  if (isOnline() && ticket.synced) {
    const ecrit = await supabaseUpdate(ticketId, { replies, updatedAt: new Date().toISOString() });
    if (!ecrit) return false;
  }

  await db.put('support_tickets', { ...ticket, replies });
  return true;
}
