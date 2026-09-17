import { extraireReferences, type ReferenceExtraite, type RejetExtraction } from '@/lib/import/references'
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

/**
 * `ligne` et `passage` regardent les lignes à références ; `titre` regarde la
 * structure : chaque titre (`# `) ouvre une section, et une section fait un
 * jour — la forme d'un recueil de méditations ou d'un cahier d'étude sorti
 * d'un Word ou d'un EPUB, où les références sont dans la prose. Les pages
 * d'un PDF passent par `joursDepuisPages`, avec la même règle.
 */
export type Decoupage = 'ligne' | 'passage' | 'titre'

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
  /** Les pages du document à lire ce jour, quand le plan porte un PDF (à partir de 1, bornes incluses). */
  pageDebut?: number
  pageFin?: number
}

export interface PlanDepuisDocument {
  jours: JourDocument[]
  rejets: RejetExtraction[]
  /** Les lignes non vides sans référence — titres, consignes, bruit d'OCR. */
  lignesIgnorees: number
  /**
   * Par titre ou par page : les sections sans aucune référence, qui n'ont pas
   * pu faire un jour et ont rejoint le suivant. Zéro pour les autres découpages.
   */
  sectionsJointes: number
}

/** Un morceau de document candidat à faire un jour : une page, ou ce qui va d'un titre au suivant. */
export interface Section {
  texte: string
  pageDebut?: number
  pageFin?: number
}

/** Les passages d'un texte, sans doublon — un cahier cite volontiers deux fois le même verset. */
function passagesDe(texte: string): { passages: PlanPassage[]; references: ReferenceExtraite[]; rejets: RejetExtraction[] } {
  const references: ReferenceExtraite[] = []
  const rejets: RejetExtraction[] = []
  for (const ligne of texte.split(/\r?\n/)) {
    const lu = extraireReferences(ligne)
    references.push(...lu.references)
    rejets.push(...lu.rejets)
  }
  const vus = new Set<string>()
  const passages: PlanPassage[] = []
  for (const r of references) {
    const cle = [r.book, r.chapterStart, r.chapterEnd, r.verseStart, r.verseEnd].join(':')
    if (vus.has(cle)) continue
    vus.add(cle)
    passages.push({ book: r.book, chapterStart: r.chapterStart, chapterEnd: r.chapterEnd, verseStart: r.verseStart, verseEnd: r.verseEnd })
  }
  return { passages, references, rejets }
}

/** La première ligne qui dit quelque chose, sans sa marque de titre ou de liste — pour l'aperçu. */
function premiereLigne(texte: string): string {
  for (const brute of texte.split(/\r?\n/)) {
    const ligne = brute.replace(/^(?:#{1,3}|-)\s+/, '').trim()
    if (ligne) return ligne
  }
  return ''
}

/**
 * Les jours depuis des sections, dans l'ordre.
 *
 * **Une section qui porte au moins une référence est un jour.** Un jour de
 * plan compte au moins un passage — `toDayColumns` le refuse sinon, et tout le
 * cochage repose dessus —, donc une section sans référence (couverture,
 * licence, avant-propos, table) ne peut pas faire un jour seule : elle
 * **rejoint la section suivante**, et les dernières rejoignent le dernier
 * jour. Rien ne disparaît ; « une page par jour » veut dire une page à
 * références par jour, et l'aperçu montre les pages réelles de chaque jour.
 *
 * En contenu intégral, le jour porte le texte de ses sections — pour les
 * documents sans page à dessiner ; un PDF gardé n'en a pas besoin.
 */
export function joursDepuisSections(sections: readonly Section[], contenu: Contenu = 'references'): PlanDepuisDocument {
  const jours: JourDocument[] = []
  const rejets: RejetExtraction[] = []
  let sectionsJointes = 0
  let enAttente: Section[] = []

  const texteDe = (parts: Section[]) => parts.map((p) => p.texte).filter(Boolean).join('\n')
  const bornes = (parts: Section[]) => {
    const debut = parts.find((p) => p.pageDebut !== undefined)?.pageDebut
    const fins = parts.map((p) => p.pageFin ?? p.pageDebut).filter((n): n is number => n !== undefined)
    return debut === undefined ? {} : { pageDebut: debut, pageFin: fins.length ? Math.max(...fins) : debut }
  }

  for (const section of sections) {
    const lu = passagesDe(section.texte)
    rejets.push(...lu.rejets)
    if (lu.passages.length === 0) {
      if (section.texte.trim()) sectionsJointes++
      enAttente.push(section)
      continue
    }
    const parts = [...enAttente, section]
    enAttente = []
    jours.push({
      day: jours.length + 1,
      passages: lu.passages,
      source: premiereLigne(section.texte),
      ...(contenu === 'integral' ? { texte: texteDe(parts) } : {}),
      ...bornes(parts),
    })
  }
  if (enAttente.length > 0 && jours.length > 0) {
    const dernier = jours[jours.length - 1]
    const parts = [dernier, ...enAttente] as Section[]
    if (dernier.texte !== undefined) dernier.texte = texteDe([{ texte: dernier.texte }, ...enAttente])
    Object.assign(dernier, bornes(parts))
  }
  return { jours, rejets, lignesIgnorees: 0, sectionsJointes }
}

/**
 * Les jours d'un PDF gardé : `pagesParJour` pages à la suite font une section,
 * et `joursDepuisSections` fait le reste. Le texte n'est pas retenu — le
 * lecteur dessine les pages elles-mêmes.
 */
export function joursDepuisPages(pages: readonly string[], pagesParJour = 1): PlanDepuisDocument {
  const pas = Math.max(1, Math.floor(pagesParJour))
  const sections: Section[] = []
  for (let i = 0; i < pages.length; i += pas) {
    const lot = pages.slice(i, i + pas)
    sections.push({ texte: lot.join('\n'), pageDebut: i + 1, pageFin: i + lot.length })
  }
  return joursDepuisSections(sections, 'references')
}

/** Les sections d'un texte à marques : chaque titre `# ` en ouvre une ; ce qui précède le premier en est une aussi. */
export function sectionsParTitre(texte: string): Section[] {
  const sections: Section[] = []
  let courante: string[] = []
  for (const ligne of texte.split(/\r?\n/)) {
    if (/^#{1,3}\s+/.test(ligne) && courante.some((l) => l.trim())) {
      sections.push({ texte: courante.join('\n') })
      courante = []
    }
    courante.push(ligne)
  }
  if (courante.some((l) => l.trim())) sections.push({ texte: courante.join('\n') })
  return sections
}

export function joursDepuisTexte(
  texte: string,
  decoupage: Decoupage = 'ligne',
  contenu: Contenu = 'references',
): PlanDepuisDocument {
  if (decoupage === 'titre') return joursDepuisSections(sectionsParTitre(texte), contenu)
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
  return { jours, rejets, lignesIgnorees, sectionsJointes: 0 }
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
    ...(j.pageDebut !== undefined ? { pageDebut: j.pageDebut, pageFin: j.pageFin ?? j.pageDebut } : {}),
  }))
}

/** Le nom de plan proposé : celui du fichier, sans son extension. */
export function nomDePlanPour(nomDeFichier: string): string {
  return nomDeFichier.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_-]+/g, ' ').trim()
}
