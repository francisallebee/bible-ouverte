import { describe, it, expect } from 'vitest';
import { ORIGINAUX, originalPourLexique } from './originaux';
import { LEXIQUES } from './strong';
import { LEXIQUES_STRONG } from '@/lib/storage/seed';

/**
 * Le troisième chemin, une fois de plus — et cette fois entre trois tables.
 *
 * Un texte original n'a pas de case à lui : il se coche avec le lexique de sa
 * langue. Cela ajoute un lien de plus à tenir, donc un oubli de plus possible.
 * Le défaut se présenterait à l'usage sans que rien ne le signale : la case
 * s'affiche, se coche, le lexique descend, et le bouton « Voir le texte
 * original » ne paraît jamais — parce que le texte n'a pas été téléchargé.
 * Ni `tsc` ni `eslint` ne peuvent l'attraper, les tables étant indépendantes.
 */
describe('les tables de textes originaux restent d’accord', () => {
  it('rattache chaque texte original à un lexique qui existe', () => {
    const lexiques = new Set(LEXIQUES_STRONG.map((l) => l.id));
    const orphelins = ORIGINAUX
      .filter((o) => !lexiques.has(o.lexiqueId))
      .map((o) => o.lexiqueId);

    expect(orphelins, 'textes originaux rattachés à un lexique inconnu').toEqual([]);
  });

  it('donne un texte original à chacun des deux lexiques', () => {
    // L'inverse compte : un lexique sans texte n'aurait rien à définir, et sa
    // case téléchargerait des mégaoctets sans qu'aucun clic ne rende jamais
    // quoi que ce soit.
    const avecTexte = new Set(ORIGINAUX.map((o) => o.lexiqueId));
    const sansTexte = LEXIQUES_STRONG
      .map((l) => l.id)
      .filter((id) => !avecTexte.has(id));

    expect(sansTexte, 'lexiques sans texte original à annoter').toEqual([]);
  });

  it('ne nomme pas deux fois le même fichier ni la même langue', () => {
    expect(new Set(ORIGINAUX.map((o) => o.file)).size).toBe(ORIGINAUX.length);
    expect(new Set(ORIGINAUX.map((o) => o.langue)).size).toBe(ORIGINAUX.length);
  });

  it('retrouve le texte d’un lexique, et rien pour un lexique inconnu', () => {
    expect(originalPourLexique('strong-hebreu')?.langue).toBe('he');
    expect(originalPourLexique('strong-grec')?.langue).toBe('el');
    expect(originalPourLexique('strong-copte')).toBeUndefined();
  });

  /**
   * Les trois tables décrivent la même paire de langues.
   *
   * `LEXIQUES_STRONG` la propose aux Réglages, `LEXIQUES` dit où prendre le
   * lexique, `ORIGINAUX` où prendre le texte. Ajouter une langue demande donc
   * **quatre** gestes et non trois — le script en plus —, et c'est le genre de
   * compte qu'on tient mal de tête.
   */
  it('décrit la même paire de langues dans les trois tables', () => {
    const registre = LEXIQUES_STRONG.map((l) => l.id).sort();
    expect(LEXIQUES.map((l) => l.id).sort()).toEqual(registre);
    expect(ORIGINAUX.map((o) => o.lexiqueId).sort()).toEqual(registre);
  });
});
