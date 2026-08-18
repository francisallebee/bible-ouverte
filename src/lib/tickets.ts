/**
 * Vocabulaire des statuts de ticket, partagé par Support et Administration.
 *
 * Les identifiants restent dans le code : ce sont les valeurs de la colonne
 * `tickets.status`, et le trigger `guard_ticket_update` s'appuie sur `closed`.
 * Les libellés, eux, vivent dans les dictionnaires sous `common.ticketStatuses`
 * — les deux écrans montrent donc le même mot pour le même état.
 */
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const

export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_STATUS_BADGE: Record<string, string> = {
  open: 'text-yellow-600 bg-yellow-50',
  in_progress: 'text-blue-600 bg-blue-50',
  resolved: 'text-green-600 bg-green-50',
  closed: 'text-gray-500 bg-gray-100',
}

/** Un ticket clos n'accepte plus de réponse : la base le refuse, l'écran le dit. */
export function isClosed(status: string | undefined): boolean {
  return status === 'closed'
}
