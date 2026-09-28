/**
 * Cocher un jour de plan : **quelle date porte la lecture**, et si le jour de
 * plan bouge.
 *
 * Deux dates se ressemblent et ne sont pas la même : le jour **prévu** par le
 * calendrier du plan, et le jour où on a **lu**. Jusqu'au 28 septembre 2026,
 * un plan daté écrivait ses lectures à la date prévue — cocher le 28 septembre
 * un jour programmé le 9 enregistrait une lecture du 9. Statistiques, séries
 * et objectifs comptent tous par `readings.date` : la lecture partait dans une
 * semaine révolue, ou dans le futur pour un jour coché en avance, et l'écran
 * ne bougeait pas. Relevé sur la base ce jour-là : **242 des 362 lectures de
 * plan mal datées**, sur 8 comptes, dont 81 dans le futur. C'est le ticket 32.
 *
 * La règle retenue : **une lecture est datée du jour où on l'a lue.** C'est ce
 * que `readings.date` a toujours voulu dire partout ailleurs dans le produit,
 * et c'est ce qu'un lecteur attend en cochant.
 *
 * Le calendrier du plan, lui, ne bouge pas : un plan daté garde la date qu'il
 * a prévue pour ce jour, sans quoi cocher un jour en retard décalerait le
 * plan lui-même. Un plan **libre** n'a pas de calendrier — sa date est
 * précisément celle de la lecture, et elle s'y inscrit.
 */

export interface DatesDuCochage {
  /** La date des lectures créées. */
  lecture: string;
  /** La nouvelle date du jour de plan, ou `null` si elle ne bouge pas. */
  jour: string | null;
}

/**
 * @param estLibre    Un plan libre (`kind === 'free'`) n'a pas de date prévue.
 * @param aujourdHui  Le jour civil du lecteur (`aujourdhui()`), jamais UTC :
 *                    à 0 h 30 à Paris, UTC est encore la veille.
 * @param dateChoisie La date que le lecteur a saisie — un plan libre la
 *                    demande. Ignorée pour un plan daté, qui ne la demande pas.
 */
export function datesDuCochage(
  estLibre: boolean,
  aujourdHui: string,
  dateChoisie?: string,
): DatesDuCochage {
  if (estLibre) {
    const date = dateChoisie || aujourdHui;
    return { lecture: date, jour: date };
  }
  return { lecture: aujourdHui, jour: null };
}
