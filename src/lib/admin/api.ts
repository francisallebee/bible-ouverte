/**
 * Le petit client HTTP des écrans d'administration.
 *
 * **Une réponse non lue est une panne invisible.** Les trois actions de
 * l'écran Administration — promouvoir, suspendre, changer le statut d'un
 * ticket — lançaient leur `fetch` sans jamais regarder ce qui revenait : un
 * 403 de `checkAdmin` ou un 504 de Vercel rendaient exactement le même écran
 * qu'un succès. C'est ce qui a rendu impossible le diagnostic du 18 août 2026.
 *
 * `cache: 'no-store'` pour la raison symétrique : une réponse servie par le
 * cache du navigateur affiche un état que le serveur n'a plus.
 *
 * Extrait de `app/admin/page.tsx` le 20 août 2026, quand la gestion des
 * utilisateurs a pris son écran : deux copies de cette fonction auraient
 * divergé, et c'est précisément celle qui rend les pannes visibles.
 */
export async function api(url: string, init?: RequestInit): Promise<{ data?: any; error?: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store', ...init })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { error: body?.error || `HTTP ${res.status}` }
    if (body?.error) return { error: body.error }
    return { data: body?.data }
  } catch (e: any) {
    // `String(e)` et non `e.message` : un rejet sans message rendrait une
    // erreur vide, que l'appelant prendrait pour un succès.
    return { error: e?.message || String(e) }
  }
}
