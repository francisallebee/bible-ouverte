/**
 * Version affichée dans l'interface.
 *
 * Injectée depuis `package.json` par `next.config.mjs`, pour qu'un seul
 * fichier fasse foi. La valeur de repli ne sert qu'aux contextes qui n'ont pas
 * traversé la compilation Next (tests unitaires, outillage).
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
