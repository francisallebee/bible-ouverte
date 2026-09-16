/**
 * La palette des graphiques sans couleur propre — livres, versions, jours.
 *
 * Aucune de ces sept couleurs n'a été choisie pour un mode : posées à même la
 * carte, `#2ecc71`, `#f39c12` et `#95a5a6` tiennent moins de 3,0 sur le blanc,
 * et `#1e3a5f` — le bleu nuit de la charte par défaut — rend **1,27** sur
 * `--surface`, mesuré le 16 septembre 2026. Comme la couleur d'un contexte,
 * chacune passe par `teintesDe` : poussée du minimum nécessaire dans le mode
 * où elle ne se voit pas, intacte dans l'autre.
 *
 * Sortie de `stats/page.tsx` pour être lue par le test plutôt que recopiée —
 * un fichier de page ne peut rien exporter d'autre que sa page.
 */
export const PALETTE = ['#1e3a5f', '#4a90d9', '#7b68ee', '#2ecc71', '#e74c3c', '#f39c12', '#95a5a6']
