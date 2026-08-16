import { describe, it, expect } from 'vitest';
import { VERSIONS } from './import';
import { TEXT_VERSIONS } from '@/lib/storage/seed';

/**
 * Le troisième chemin, celui qu'on oublie.
 *
 * Ajouter une version de la Bible demande trois gestes : une entrée dans
 * `scripts/download-bible-versions.mjs` pour produire le fichier, une ligne
 * dans `TEXT_VERSIONS` pour qu'elle apparaisse aux Réglages, et une dans
 * `VERSIONS` pour que `loadData` sache quel fichier aller chercher.
 *
 * Le 16 août 2026, les quatre versions non françaises ont été déployées en
 * production avec les deux premiers gestes et pas le troisième. Rien ne le
 * signalait : elles s'affichaient, se laissaient cocher, et l'activation levait
 * « Version inconnue » — l'utilisateur ne voyait qu'un échec de téléchargement.
 * Ni le typage ni les tests d'alors ne pouvaient l'attraper, les deux tables
 * étant indépendantes.
 *
 * C'est le même piège que `contextId` absent du payload de mise à jour, et que
 * la `date` des plans libres : deux endroits d'accord, un troisième oublié.
 */
describe('les tables de versions restent d’accord', () => {
  it('donne un fichier à chaque version proposée', () => {
    const avecFichier = new Set(VERSIONS.map((v) => v.id));
    const sansFichier = TEXT_VERSIONS
      .map((v) => v.id)
      .filter((id) => !avecFichier.has(id));

    expect(sansFichier, 'versions proposées sans fichier à charger').toEqual([]);
  });

  it('ne déclare aucun fichier pour une version qui n’existe pas', () => {
    // L'inverse compte aussi : un fichier resté dans la table après le retrait
    // d'une version encombre `public/bibles/` sans que rien ne le dise.
    const proposees = new Set(TEXT_VERSIONS.map((v) => v.id));
    const orphelins = VERSIONS
      .map((v) => v.id)
      .filter((id) => !proposees.has(id));

    expect(orphelins, 'fichiers déclarés sans version correspondante').toEqual([]);
  });

  it('ne nomme pas deux fois le même fichier', () => {
    const fichiers = VERSIONS.map((v) => v.file);
    expect(new Set(fichiers).size, 'fichiers en double').toBe(fichiers.length);
  });
});
