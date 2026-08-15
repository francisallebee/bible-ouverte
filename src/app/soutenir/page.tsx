import SoutenirContent from './SoutenirContent'

/**
 * Page statique : aucune donnée utilisateur, aucun appel réseau. Elle reste
 * derrière l'authentification comme le reste de l'application — la feuille de
 * route la décrit comme une page du menu, pas comme une page d'accueil
 * publique.
 *
 * Le contenu vit dans `SoutenirContent`, côté client, parce qu'il lit le
 * dictionnaire de la langue. Cette page-ci reste serveur pour porter
 * `metadata` : un composant client n'a pas le droit de l'exporter.
 */

export const metadata = {
  title: 'Soutenir le projet — Bible Ouverte',
}

export default function SoutenirPage() {
  return <SoutenirContent />
}
