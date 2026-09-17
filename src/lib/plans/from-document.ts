import { extraireReferences, type RejetExtraction } from '@/lib/import/references'
import { addDays } from '@/lib/storage/plan-generator'
import { toDayColumns, type PlanPassage } from '@/lib/storage/plan-passages'

/**
 * Les jours d'un plan de lecture bâtis depuis un document.
 *
 * Demandé par le propriétaire le 17 septembre 2026 : créer un plan depuis un
 * texte, un Word, un PowerPoint, un OpenDocument, un EPUB ou un PDF « avec
 * autant de facilité que les autres plans ». Le texte sort du fichier par
 * `texteDuFichier` — la voie de l'import —, et ce module le découpe en jours.
 *
 * **La règle : une ligne qui porte au moins une référence est un jour**, et
 * tous les passages de la ligne sont ceux de ce jour. C'est la forme des plans
 * qu'on imprime — « Jour 12 : Genèse 25-26, Psaume 9 » —, et une ligne sans
 * référence (un titre, un « Semaine 3 », une consigne) est simplement passée.
 * Le découpage « un passage par jour » est offert en second choix, pour les
 * documents qui alignent les références sans les grouper.
 *
 * Les rejets de l'analyseur remontent tels quels, avec leur fragment : rien ne
 * disparaît en silence, le formulaire les montre avant la création.
 */

export type Decoupage = 'ligne' | 'passage'

/**
 * Ce que le plan retient du document : ses seules références, ou le document
 * en entier — chaque jour porte alors sa page, du texte qui va de sa ligne à
 * références jusqu'à la suivante. Demandé par le propriétaire le 17 septembre
 * 2026 : « choisir entre juste les références ou lire le document dans son
 * intégralité ».
 */
export type Contenu = 'references' | 'integral'

export interface JourDocument {
  day: number
  passages: PlanPassage[]
  /** La ligne d'où le jour vient, telle qu'écrite — pour l'aperçu. */
  source: string
  /** La page du jour, en mode intégral : sa ligne et celles qui la suivent jusqu'au jour suivant. */
  texte?: string
}

export interface PlanDepuisDocument {
  jours: JourDocument[]
  rejets: RejetExtraction[]
  /** Les lignes non vides sans référence — titres, consignes, bruit d'OCR. */
  lignesIgnorees: number
}

export function joursDepuisTexte(
  texte: string,
  decoupage: Decoupage = 'ligne',
  contenu: Contenu = 'references',
): PlanDepuisDocument {
  const jours: JourDocument[] = []
  const rejets: RejetExtraction[] = []
  let lignesIgnorees = 0
  // En mode intégral, les lignes s'accumulent sur la page du jour ouvert — le
  // premier jour né de la dernière ligne à références ; ce qui précède le
  // premier jour — un titre, un avant-propos — lui revient.
  const pages = new Map<number, string[]>()
  let pageCourante: number | null = null
  const preambule: string[] = []

  for (const brute of texte.split(/\r?\n/)) {
    const ligne = brute.trim()
    if (!ligne) continue
    const { references, rejets: refuses } = extraireReferences(ligne)
    rejets.push(...refuses)
    if (references.length === 0) {
      lignesIgnorees++
      if (contenu === 'integral') (pageCourante === null ? preambule : pages.get(pageCourante)!).push(ligne)
      continue
    }
    const passages: PlanPassage[] = references.map((r) => ({
      book: r.book,
      chapterStart: r.chapterStart,
      chapterEnd: r.chapterEnd,
      verseStart: r.verseStart,
      verseEnd: r.verseEnd,
    }))
    const premierJour = jours.length
    if (decoupage === 'ligne') {
      jours.push({ day: jours.length + 1, passages, source: ligne })
    } else {
      for (const [i, p] of Array.from(passages.entries())) {
        jours.push({ day: jours.length + 1, passages: [p], source: references[i].source })
      }
    }
    if (contenu === 'integral') {
      // La page appartient au premier jour né de la ligne — en découpage par
      // passage, les autres jours de la même ligne n'ont pas de texte.
      pageCourante = premierJour
      pages.set(premierJour, [...preambule.splice(0), ligne])
    }
  }
  for (const [i, page] of Array.from(pages.entries())) {
    jours[i].texte = page.join('\n')
  }
  return { jours, rejets, lignesIgnorees }
}

/**
 * Les colonnes à écrire pour chaque jour. Daté : une date par jour à partir du
 * début, consécutives, comme `generatePlanDays`. Libre : la date vide jusqu'au
 * cochage, comme une entrée ajoutée à la main.
 */
export function documentDayRows(jours: JourDocument[], startDate: string | null) {
  return jours.map((j, i) => ({
    day: j.day,
    date: startDate ? addDays(startDate, i) : '',
    isRead: false,
    ...toDayColumns(j.passages),
    ...(j.texte ? { texte: j.texte } : {}),
  }))
}

/** Le nom de plan proposé : celui du fichier, sans son extension. */
export function nomDePlanPour(nomDeFichier: string): string {
  return nomDeFichier.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_-]+/g, ' ').trim()
}
