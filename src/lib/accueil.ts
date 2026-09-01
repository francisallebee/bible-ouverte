/**
 * La page où l'on arrive en ouvrant l'application.
 *
 * Jusqu'au 1er septembre 2026, c'était `/new-reading` pour tout le monde, écrit
 * en dur dans le middleware. Le choix est désormais un réglage — et il vit dans
 * la colonne `jsonb`, l'exception documentée d'`AGENTS.md` : ni migration, ni
 * piège des trois chemins.
 *
 * **Pourquoi une liste de chemins ici, alors que `NAV_LINKS` existe.** Le
 * middleware s'exécute sur le serveur, et `NAV_LINKS` vit dans `Sidebar.tsx`
 * avec ses icônes React et ses fonctions de libellé : l'importer ferait entrer
 * un composant client dans le middleware. Les deux listes sont donc
 * indépendantes — exactement la situation qui a fait payer la règle 13, où
 * `TEXT_VERSIONS` et `VERSIONS` avaient divergé sans que rien ne le signale.
 * `accueil.test.ts` les compare dans les deux sens, comme `import.test.ts` le
 * fait pour les versions bibliques.
 */

/** Là où l'on arrive quand rien n'est choisi, ou quand le choix ne tient plus. */
export const ACCUEIL_DEFAUT = '/new-reading'

/**
 * Les pages qu'on peut désigner comme accueil.
 *
 * **Toutes les pages ordinaires**, et pas seulement celles du menu principal.
 * Feuille de route, Support et Soutenir sont descendues sous Réglages le
 * 2 septembre 2026, mais elles restent des écrans comme les autres : rien ne
 * justifie d'interdire d'arriver sur la Feuille de route.
 *
 * Ce qui en est exclu, ce sont les écrans de **configuration** — arriver sur
 * Réglages ou sur son Profil en ouvrant l'application n'aurait pas de sens — et
 * les écrans **réservés**, qui laisseraient un compte ordinaire devant un refus
 * d'accès à chaque ouverture.
 */
export const PAGES_ACCUEIL: readonly string[] = [
  '/new-reading',
  '/plans',
  '/search',
  '/progress',
  '/history',
  '/stats',
  '/quiz',
  '/verset-du-jour',
  '/memorisation',
  '/messages',
  // Sous Réglages depuis le 2 septembre 2026, et toujours choisissables.
  '/roadmap',
  '/support',
  '/soutenir',
]

/**
 * La page d'accueil effective d'un compte.
 *
 * Trois raisons de revenir au défaut, et la troisième est la moins évidente :
 *
 * 1. **Rien n'est choisi** — le cas de tous les comptes existants.
 * 2. **Le choix ne désigne plus rien.** Une page retirée du produit laisserait
 *    sinon son ancien lecteur sur un 404 à chaque ouverture, sans qu'il
 *    comprenne pourquoi ni où le corriger.
 * 3. **La page choisie a été masquée.** `hiddenPages` retire une entrée du
 *    menu ; y atterrir quand même donnerait un écran qu'on a explicitement
 *    caché, et qu'on ne pourrait plus quitter par la barre latérale. Les deux
 *    réglages vivent dans le même `jsonb`, rien n'empêche donc de se
 *    contredire — sauf ici.
 */
export function pageAccueil(
  choix: string | undefined | null,
  masquees: readonly string[] = [],
): string {
  if (!choix) return ACCUEIL_DEFAUT
  if (!PAGES_ACCUEIL.includes(choix)) return ACCUEIL_DEFAUT
  if (masquees.includes(choix)) return ACCUEIL_DEFAUT
  return choix
}
