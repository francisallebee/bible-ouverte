import { addDays } from '@/lib/storage/plan-generator';
import { toDayColumns, type PlanPassage } from '@/lib/storage/plan-passages';
import { templateDays, templateDaysPassages, type PlanTemplate } from './catalog';

export interface TemplateDay {
  day: number;
  date: string;
  passages: PlanPassage[];
}

/**
 * Les jours d'un plan bâti sur un modèle du catalogue.
 *
 * **Les journées vides sont écartées, et les jours renumérotés.** Un flux plus
 * court que la durée en produit — les quatre Évangiles ne fournissent que 89
 * chapitres, une durée de 120 jours laisserait donc des journées sans rien à
 * lire. Les garder aurait donné des lignes qu'on ne peut ni lire ni cocher, et
 * un compteur de progression qui ne peut jamais atteindre son total.
 *
 * La conséquence est assumée : le plan est alors **plus court** que la durée
 * demandée. C'est aussi ce que fait déjà `generatePlanDays`, dont le
 * commentaire explique que `totalDays` doit refléter les jours réellement
 * produits et non la durée souhaitée.
 */
export function templatePlanDays(
  template: PlanTemplate,
  startDate: string,
  duration?: number,
): TemplateDay[] {
  const parJour = templateDaysPassages(template, duration);
  return parJour
    .filter((passages) => passages.length > 0)
    .map((passages, i) => ({
      day: i + 1,
      date: addDays(startDate, i),
      passages,
    }));
}

/** La durée réellement produite, jours vides déduits. */
export function templateRealDays(template: PlanTemplate, duration?: number): number {
  return templateDaysPassages(template, duration).filter((p) => p.length > 0).length;
}

/** Les colonnes à écrire pour chaque jour, `passages` compris s'il y en a plusieurs. */
export function templateDayRows(days: TemplateDay[]) {
  return days.map((d) => ({
    day: d.day,
    date: d.date,
    isRead: false,
    ...toDayColumns(d.passages),
  }));
}

export { templateDays };
