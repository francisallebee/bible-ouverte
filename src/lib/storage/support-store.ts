import type { SupportTicket, SupportReply } from './types';
import { getDB } from './db';
import { getCurrentUserId } from './user-id';

export async function getAllTickets(): Promise<SupportTicket[]> {
  const db = await getDB();
  const all = await db.getAll('support_tickets');
  return all.reverse();
}

export async function addTicket(data: { type: 'bug' | 'suggestion'; message: string; userName: string }): Promise<number> {
  const db = await getDB();
  const userId = await getCurrentUserId();
  return db.add('support_tickets', {
    userId,
    userName: data.userName,
    type: data.type,
    message: data.message,
    createdAt: new Date().toISOString(),
    replies: [],
  });
}

export async function addReply(ticketId: number, text: string, isAdmin: boolean, userName: string): Promise<void> {
  const db = await getDB();
  const ticket = await db.get('support_tickets', ticketId);
  if (!ticket) return;
  const userId = await getCurrentUserId();
  const reply: SupportReply = {
    id: crypto.randomUUID(),
    userId,
    userName,
    text,
    isAdmin,
    createdAt: new Date().toISOString(),
  };
  ticket.replies.push(reply);
  await db.put('support_tickets', ticket);
}
