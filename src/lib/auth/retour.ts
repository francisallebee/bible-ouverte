/**
 * La destination d'après-connexion, quand il y en a une.
 *
 * L'application pousse normalement vers `/`, et c'est le middleware qui sait
 * où ce compte veut arriver — la page d'accueil est un réglage. Une seule
 * chose justifie de contourner ce choix : un lien d'invitation. Sans ce
 * retour, quelqu'un qui reçoit une invitation, s'inscrit et arrive sur son
 * écran d'accueil ne retrouverait **jamais** l'invitation, et c'est exactement
 * ce que le propriétaire a demandé d'éviter le 30 septembre 2026.
 *
 * **La liste blanche est le point entier de ce module.** Rendre le `next`
 * d'une URL sans le filtrer est une redirection ouverte : n'importe qui peut
 * alors envoyer `…/auth/login?next=https://ailleurs.example` et faire passer
 * sa page pour la nôtre au sortir d'une connexion réussie. Seul un chemin
 * interne commençant par `/invitation/` est accepté — pas un chemin interne
 * quelconque, parce qu'aucun autre n'en a besoin.
 */
export function retourApresConnexion(next: string | null): string {
  if (!next) return '/'
  // `//ailleurs.example` et `/\ailleurs.example` sont des URL absolues pour le
  // navigateur bien qu'elles commencent par une barre : les écarter d'abord.
  if (next.startsWith('//') || next.startsWith('/\\')) return '/'
  if (!next.startsWith('/invitation/')) return '/'
  // Un jeton n'est fait que de chiffres hexadécimaux — deux UUID concaténés.
  return /^\/invitation\/[0-9a-f]{32,64}$/.test(next) ? next : '/'
}
