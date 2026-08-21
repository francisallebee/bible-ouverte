/**
 * L'abonnement au « retour à l'écran », sorti de React pour être testable.
 *
 * **Pourquoi ce fichier existe.** `use-fraicheur.ts` est la parade à un défaut
 * coûteux — le cache de segments de l'App Router, qui sert un écran périmé sans
 * rien dire — et il n'avait aucun test : l'environnement vitest du dépôt est
 * `node`, sans DOM, et couvrir un crochet React y demanderait `jsdom`, donc une
 * dépendance de plus (règle 6).
 *
 * C'est la méthode déjà employée par `lib/auto-logout.ts` : quand la mesure
 * directe coûte trop cher, on **sort la règle** du composant et on la teste
 * seule. Ce qui reste dans le crochet — appeler cette fonction dans un
 * `useEffect` — est trop mince pour se tromper.
 *
 * Les cibles sont injectées plutôt que lues sur `globalThis` : c'est ce qui
 * permet au test de tourner sans DOM, et c'est aussi ce qui rend visible le
 * fait que **le retrait des écouteurs compte autant que leur pose**. Un
 * abonnement laissé derrière soi rappelle les données d'un écran qu'on a
 * quitté, indéfiniment.
 */

/** Le strict nécessaire d'une cible d'événements — `window` et `document` en sont. */
export interface Ecoutable {
  addEventListener(type: string, ecouteur: () => void): void;
  removeEventListener(type: string, ecouteur: () => void): void;
}

export interface CiblesDeRetour {
  fenetre: Ecoutable;
  /** Lu **au moment de l'événement**, jamais capturé à l'abonnement. */
  document: Ecoutable & { readonly visibilityState: string };
}

/**
 * Pose les deux écouteurs qui signalent un retour à l'écran, et rend de quoi
 * les retirer.
 *
 * **Deux événements, parce qu'ils n'attrapent pas la même chose.** `focus` suit
 * la fenêtre du navigateur, `visibilitychange` suit l'onglet : passer d'un
 * onglet à l'autre sans quitter la fenêtre ne produit que le second, et
 * revenir d'une autre application ne produit parfois que le premier.
 *
 * Le filtre sur `visibilityState` n'est pas décoratif : `visibilitychange` se
 * déclenche **aussi** quand l'onglet devient caché. Sans lui, on rechargerait
 * les données au moment précis où plus personne ne les regarde.
 */
export function abonnerAuRetour(cibles: CiblesDeRetour, recharger: () => void): () => void {
  const auRetour = () => {
    if (cibles.document.visibilityState === 'visible') recharger();
  };

  cibles.fenetre.addEventListener('focus', auRetour);
  cibles.document.addEventListener('visibilitychange', auRetour);

  // La même référence des deux côtés : `removeEventListener` compare par
  // identité, et une fonction recréée ici ne retirerait rien du tout.
  return () => {
    cibles.fenetre.removeEventListener('focus', auRetour);
    cibles.document.removeEventListener('visibilitychange', auRetour);
  };
}

/**
 * Faut-il recharger, sachant la route affichée et celle que l'écran surveille ?
 *
 * Le crochet est monté par un écran qui reste en vie pendant qu'on visite une
 * fiche : sans ce test, il rechargerait ses données à chaque navigation de
 * l'application, y compris vers des écrans qui ne le concernent pas.
 */
export function estDeRetourSur(pathname: string | null, route: string): boolean {
  return pathname === route;
}
