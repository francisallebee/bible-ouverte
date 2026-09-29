import { describe, it, expect } from 'vitest';
import { LEXIQUES, LEXIQUES_VISIBLES } from './strong';
import { LEXIQUES_STRONG } from '@/lib/storage/seed';

/**
 * Le troisième chemin, pour les lexiques Strong cette fois.
 *
 * Copie délibérée d'`import.test.ts`, qui garde les tables de versions
 * d'accord. Le piège est identique et il a déjà coûté une fois : le 16 août
 * 2026, quatre versions de la Bible ont été déployées en production avec deux
 * gestes sur trois. Elles s'affichaient aux Réglages, se laissaient cocher, et
 * l'activation levait « Version inconnue » — l'utilisateur ne voyait qu'un
 * échec de téléchargement, sans autre explication.
 *
 * Ni `tsc` ni `eslint` ne peuvent l'attraper : les deux tables sont
 * indépendantes et toutes deux bien typées. Seul ce croisement le peut.
 */
describe('les tables de lexiques Strong restent d’accord', () => {
  it('donne un fichier à chaque lexique proposé', () => {
    const avecFichier = new Set(LEXIQUES.map((l) => l.id));
    const sansFichier = LEXIQUES_STRONG
      .map((l) => l.id)
      .filter((id) => !avecFichier.has(id));

    expect(sansFichier, 'lexiques proposés sans fichier à charger').toEqual([]);
  });

  it('ne déclare aucun fichier pour un lexique qui n’existe pas', () => {
    // L'inverse compte aussi : un fichier resté dans la table après le retrait
    // d'un lexique encombre `public/strong/` sans que rien ne le dise.
    const proposes = new Set(LEXIQUES_STRONG.map((l) => l.id));
    const orphelins = LEXIQUES
      .map((l) => l.id)
      .filter((id) => !proposes.has(id));

    expect(orphelins, 'fichiers déclarés sans lexique correspondant').toEqual([]);
  });

  it('ne nomme pas deux fois le même fichier', () => {
    const fichiers = LEXIQUES.map((l) => l.file);
    expect(new Set(fichiers).size, 'fichiers en double').toBe(fichiers.length);
  });

  /**
   * Deux cases et non une, sur décision du propriétaire le 29 septembre 2026.
   *
   * Ce test ne protège pas d'un bogue : il fige un choix de produit, pour que
   * le fusionner en une seule case redevienne une décision plutôt qu'un
   * glissement. L'hébreu pèse 2,53 Mio et le grec 1,47 Mio ; qui ne lit que le
   * Nouveau Testament ne doit pas descendre les deux.
   */
  it('garde les deux langues séparément activables', () => {
    expect(LEXIQUES_STRONG.map((l) => l.language).sort()).toEqual(['el', 'he']);
  });

  /**
   * Rien n'arrive sans être demandé — la règle 4, appliquée aux lexiques.
   *
   * Les onze traductions non natives sont livrées désactivées pour la même
   * raison. Un lexique actif par défaut ferait descendre des mégaoctets à
   * quelqu'un qui n'ouvrira jamais un mot d'hébreu.
   */
  it('ne livre aucun lexique actif par défaut', () => {
    const actifs = LEXIQUES_STRONG.filter((l) => l.isEnabled).map((l) => l.id);
    expect(actifs, 'lexiques actifs à l’installation').toEqual([]);
  });

  /**
   * La section est montrée depuis que le clic sur un mot existe.
   *
   * Le test a été retourné le 29 septembre 2026, dans le même commit que
   * `TexteOriginal` — comme sa version précédente l'annonçait. Il ne protège
   * d'aucun bogue : il fait de chaque bascule une décision, dans un sens comme
   * dans l'autre. Le remettre à `false` reste la façon de rétracter la
   * fonctionnalité d'un seul geste.
   */
  it('montre la section, le clic sur un mot existant désormais', () => {
    expect(LEXIQUES_VISIBLES).toBe(true);
  });
});
