import { describe, it, expect, vi } from 'vitest';
import { abonnerAuRetour, estDeRetourSur, type CiblesDeRetour } from './retour-ecran';

/**
 * Une cible d'événements en mémoire.
 *
 * Elle compte les retraits autant que les poses : c'est la propriété la plus
 * facile à casser — retirer un écouteur recréé sur place ne retire rien, et
 * rien ne le signale.
 */
function cible() {
  const ecouteurs = new Map<string, Set<() => void>>();
  return {
    addEventListener(type: string, e: () => void) {
      if (!ecouteurs.has(type)) ecouteurs.set(type, new Set());
      ecouteurs.get(type)!.add(e);
    },
    removeEventListener(type: string, e: () => void) {
      ecouteurs.get(type)?.delete(e);
    },
    /** Déclenche l'événement, comme le ferait le navigateur. */
    emettre(type: string) {
      // Une copie : un écouteur qui se retirerait pendant l'émission
      // modifierait l'ensemble qu'on parcourt.
      Array.from(ecouteurs.get(type) ?? []).forEach((e) => e());
    },
    combien(type: string) {
      return ecouteurs.get(type)?.size ?? 0;
    },
  };
}

function monter(visibilite = 'visible') {
  const fenetre = cible();
  const doc = cible();
  // Un vrai getter, et non `Object.assign` : celui-ci **invoque** le getter de
  // la source et en copie la valeur, ce qui figeait la visibilité au montage —
  // le faux document ne pouvait alors plus jamais devenir caché, et deux tests
  // passaient au vert sans rien éprouver. Trouvé en les voyant échouer.
  Object.defineProperty(doc, 'visibilityState', { get: () => visibilite });
  const cibles: CiblesDeRetour = { fenetre, document: doc as typeof doc & { visibilityState: string } };
  const recharger = vi.fn();
  const retirer = abonnerAuRetour(cibles, recharger);
  return {
    fenetre,
    doc,
    recharger,
    retirer,
    cacher: () => {
      visibilite = 'hidden';
    },
    montrer: () => {
      visibilite = 'visible';
    },
  };
}

describe('abonnerAuRetour', () => {
  it('pose un écouteur sur chacune des deux cibles', () => {
    const { fenetre, doc } = monter();
    expect(fenetre.combien('focus')).toBe(1);
    expect(doc.combien('visibilitychange')).toBe(1);
  });

  it('recharge au retour de la fenêtre', () => {
    const { fenetre, recharger } = monter();
    fenetre.emettre('focus');
    expect(recharger).toHaveBeenCalledTimes(1);
  });

  it("recharge au retour de l'onglet", () => {
    const { doc, recharger } = monter();
    doc.emettre('visibilitychange');
    expect(recharger).toHaveBeenCalledTimes(1);
  });

  /**
   * `visibilitychange` part **aussi** quand l'onglet devient caché. Sans le
   * filtre, on rechargerait au moment précis où plus personne ne regarde.
   */
  it("ne recharge pas quand l'onglet devient caché", () => {
    const { doc, recharger, cacher } = monter();
    cacher();
    doc.emettre('visibilitychange');
    expect(recharger).not.toHaveBeenCalled();
  });

  it('la visibilité est lue à l\'événement, pas à l\'abonnement', () => {
    const { doc, recharger, cacher, montrer } = monter();
    cacher();
    doc.emettre('visibilitychange');
    montrer();
    doc.emettre('visibilitychange');
    expect(recharger).toHaveBeenCalledTimes(1);
  });

  /**
   * Le point qui justifie ce test à lui seul : un écouteur laissé derrière soi
   * rappelle les données d'un écran qu'on a quitté, et pour toujours.
   */
  it('retire ses deux écouteurs au démontage', () => {
    const { fenetre, doc, retirer } = monter();
    retirer();
    expect(fenetre.combien('focus')).toBe(0);
    expect(doc.combien('visibilitychange')).toBe(0);
  });

  it('ne recharge plus rien après le démontage', () => {
    const { fenetre, doc, recharger, retirer } = monter();
    retirer();
    fenetre.emettre('focus');
    doc.emettre('visibilitychange');
    expect(recharger).not.toHaveBeenCalled();
  });

  it('deux abonnements successifs ne laissent rien derrière eux', () => {
    const { fenetre, doc, retirer } = monter();
    const second = monter();
    retirer();
    second.retirer();
    expect(fenetre.combien('focus')).toBe(0);
    expect(doc.combien('visibilitychange')).toBe(0);
    expect(second.fenetre.combien('focus')).toBe(0);
  });
});

describe('estDeRetourSur', () => {
  it('reconnaît la route surveillée', () => {
    expect(estDeRetourSur('/admin/utilisateurs', '/admin/utilisateurs')).toBe(true);
  });

  it('ignore une autre route', () => {
    expect(estDeRetourSur('/admin/utilisateurs/42', '/admin/utilisateurs')).toBe(false);
  });

  /** `usePathname` peut rendre `null` avant que le routeur soit prêt. */
  it('ignore une route inconnue', () => {
    expect(estDeRetourSur(null, '/admin')).toBe(false);
  });

  /** Une fiche a une route calculée : elle ne doit pas se confondre avec la liste. */
  it('distingue la liste de la fiche', () => {
    expect(estDeRetourSur('/admin/utilisateurs', '/admin/utilisateurs/42')).toBe(false);
  });
});
