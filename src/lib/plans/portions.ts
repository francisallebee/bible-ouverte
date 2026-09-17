/**
 * Les portions d'un document lu jour après jour.
 *
 * Demandé par le propriétaire le 17 septembre 2026, après le plan « une page
 * par jour » : « il faut vraiment que l'on puisse choisir d'une manière
 * personnalisée ce qui sera lu chaque jour ». Ce module est la partie pure de
 * l'éditeur de jours : des unités numérotées de 1 à `total` — les pages d'un
 * PDF aujourd'hui, les chapitres d'un EPUB demain —, et une suite de portions
 * **contiguës et ordonnées** qui les couvrent d'un début à une fin.
 *
 * Contiguës, parce que c'est le modèle qu'on tient en tête en découpant un
 * livre : déplacer une borne déplace **la même** borne pour le jour voisin, il
 * n'y a jamais de trou ni de chevauchement entre deux jours. Les seules pages
 * qu'on peut laisser hors du plan sont celles d'avant le premier jour et
 * d'après le dernier — la couverture, la licence, la table, l'achevé
 * d'imprimer.
 *
 * Aucune portion n'est vide : un jour lit au moins une unité. Toute opération
 * qui l'exigerait est refusée en rendant la suite inchangée.
 */

export interface Portion {
  /** Première unité, incluse, à partir de 1. */
  debut: number
  /** Dernière unité, incluse. */
  fin: number
}

export interface Repere {
  /** L'unité où le repère mène. */
  page: number
  titre: string
  niveau?: 1 | 2
}

/** `n` parts aussi égales que possible, les restes répartis sur les premières — comme les jours d'un plan daté. */
export function repartir(premiere: number, derniere: number, nJours: number): Portion[] {
  const total = derniere - premiere + 1
  if (total <= 0) return []
  const parts = Math.max(1, Math.min(Math.floor(nJours), total))
  const base = Math.floor(total / parts)
  let reste = total % parts
  const portions: Portion[] = []
  let debut = premiere
  for (let i = 0; i < parts; i++) {
    const taille = base + (reste > 0 ? 1 : 0)
    if (reste > 0) reste--
    portions.push({ debut, fin: debut + taille - 1 })
    debut += taille
  }
  return portions
}

/** `pas` unités par jour, la dernière portion prenant ce qui reste. */
export function parPas(premiere: number, derniere: number, pas: number): Portion[] {
  const p = Math.max(1, Math.floor(pas))
  const portions: Portion[] = []
  for (let debut = premiere; debut <= derniere; debut += p) {
    portions.push({ debut, fin: Math.min(derniere, debut + p - 1) })
  }
  return portions
}

/**
 * Une portion par repère — un chapitre par jour. Les unités d'avant le
 * premier repère (couverture, préface) rejoignent la première portion ; deux
 * repères sur la même unité ne font qu'une portion.
 */
export function parReperes(premiere: number, derniere: number, reperes: readonly Repere[]): Portion[] {
  const debuts = Array.from(new Set(
    reperes.map((r) => r.page).filter((p) => p >= premiere && p <= derniere),
  )).sort((a, b) => a - b)
  if (debuts.length === 0) return [{ debut: premiere, fin: derniere }]
  if (debuts[0] !== premiere) debuts.unshift(premiere)
  return debuts.map((debut, i) => ({ debut, fin: i + 1 < debuts.length ? debuts[i + 1] - 1 : derniere }))
}

/** Les repères d'un niveau : le premier rang s'il en a au moins deux, sinon le second, sinon tous. */
export function reperesUtiles(reperes: readonly Repere[]): Repere[] {
  const rang1 = reperes.filter((r) => (r.niveau ?? 1) === 1)
  if (rang1.length >= 2) return rang1
  const rang2 = reperes.filter((r) => r.niveau === 2)
  if (rang2.length >= 2) return rang2
  return [...reperes]
}

function valides(portions: readonly Portion[]): boolean {
  return portions.every((p, i) => p.debut <= p.fin && (i === 0 || p.debut === portions[i - 1].fin + 1))
}

/**
 * Déplace la fin de la portion `i` : la portion suivante commence juste
 * après. Bornée pour que ni l'une ni l'autre ne se vide. La fin de la
 * dernière portion est la fin du plan : c'est `deplacerDerniereFin`, qui
 * connaît le total.
 */
export function deplacerFin(portions: readonly Portion[], i: number, fin: number): Portion[] {
  const courante = portions[i]
  const suivante = portions[i + 1]
  if (!courante || !suivante) return [...portions]
  const bornee = Math.min(suivante.fin - 1, Math.max(courante.debut, Math.floor(fin)))
  return portions.map((p, j) =>
    j === i ? { ...p, fin: bornee } : j === i + 1 ? { ...p, debut: bornee + 1 } : p)
}

/**
 * Déplace le début de la portion `i` : la précédente finit juste avant. Sur la
 * première portion, c'est le début du plan qui bouge — les unités d'avant
 * sont laissées hors du plan.
 */
export function deplacerDebut(portions: readonly Portion[], i: number, debut: number): Portion[] {
  const courante = portions[i]
  if (!courante) return [...portions]
  const precedente = portions[i - 1]
  const min = precedente ? precedente.debut + 1 : 1
  const max = courante.fin
  const bornee = Math.min(max, Math.max(min, Math.floor(debut)))
  return portions.map((p, j) =>
    j === i ? { ...p, debut: bornee } : j === i - 1 ? { ...p, fin: bornee - 1 } : p)
}

/** La dernière fin du plan : au-delà, les unités restent hors du plan. */
export function deplacerDerniereFin(portions: readonly Portion[], fin: number, total: number): Portion[] {
  const i = portions.length - 1
  if (i < 0) return []
  const bornee = Math.min(total, Math.max(portions[i].debut, Math.floor(fin)))
  return portions.map((p, j) => (j === i ? { ...p, fin: bornee } : p))
}

/**
 * Le début du plan : les portions entièrement avant `debut` disparaissent,
 * la première qui reste commence là. « Commencer à la page 12 » quand les
 * jours 1 et 2 lisent 1-4 et 5-11 laisse un plan qui commence au jour qui
 * lisait 12 — c'est ce qu'on demande, pas un jour 1 réduit à une page.
 */
export function commencerA(portions: readonly Portion[], debut: number, total: number): Portion[] {
  const d = Math.max(1, Math.min(total, Math.floor(debut)))
  const restantes = portions.filter((p) => p.fin >= d)
  if (restantes.length === 0) return [{ debut: d, fin: Math.max(d, portions[portions.length - 1]?.fin ?? total) }]
  return restantes.map((p, i) => (i === 0 ? { debut: d, fin: p.fin } : p))
}

/** La fin du plan, symétrique de `commencerA` : les portions entièrement après `fin` disparaissent. */
export function finirA(portions: readonly Portion[], fin: number, total: number): Portion[] {
  const f = Math.max(1, Math.min(total, Math.floor(fin)))
  const restantes = portions.filter((p) => p.debut <= f)
  if (restantes.length === 0) return [{ debut: Math.min(f, portions[0]?.debut ?? 1), fin: f }]
  return restantes.map((p, i) => (i === restantes.length - 1 ? { debut: p.debut, fin: f } : p))
}

/** Fond la portion `i` avec la suivante. */
export function fusionner(portions: readonly Portion[], i: number): Portion[] {
  if (i < 0 || i + 1 >= portions.length) return [...portions]
  return portions.flatMap((p, j) =>
    j === i ? [{ debut: p.debut, fin: portions[i + 1].fin }] : j === i + 1 ? [] : [p])
}

/** Coupe la portion `i` en deux au milieu. Refusé si elle n'a qu'une unité. */
export function scinder(portions: readonly Portion[], i: number): Portion[] {
  const p = portions[i]
  if (!p || p.fin <= p.debut) return [...portions]
  const milieu = p.debut + Math.floor((p.fin - p.debut) / 2)
  return portions.flatMap((q, j) => (j === i ? [{ debut: q.debut, fin: milieu }, { debut: milieu + 1, fin: q.fin }] : [q]))
}

/**
 * Un jour de plus à la fin : les unités encore hors du plan après la dernière
 * portion, s'il en reste ; sinon la dernière portion se coupe en deux.
 */
export function ajouter(portions: readonly Portion[], total: number): Portion[] {
  if (portions.length === 0) return total >= 1 ? [{ debut: 1, fin: total }] : []
  const derniere = portions[portions.length - 1]
  if (derniere.fin < total) return [...portions, { debut: derniere.fin + 1, fin: total }]
  return scinder(portions, portions.length - 1)
}

/** Retire la portion `i` : ses unités vont à la précédente, ou à la suivante pour la première. */
export function retirer(portions: readonly Portion[], i: number): Portion[] {
  if (i < 0 || i >= portions.length) return [...portions]
  if (portions.length === 1) return [...portions]
  if (i === 0) return portions.slice(1).map((p, j) => (j === 0 ? { debut: portions[0].debut, fin: p.fin } : p))
  return fusionner(portions, i - 1)
}

/**
 * Le nom d'une portion : le premier repère qu'elle contient, sinon la
 * première ligne de sa première unité, sinon rien — l'écran dira les pages.
 */
export function titreDe(portion: Portion, reperes: readonly Repere[], premieresLignes: readonly string[]): string {
  const repere = reperes.find((r) => r.page >= portion.debut && r.page <= portion.fin)
  if (repere) return repere.titre
  return (premieresLignes[portion.debut - 1] ?? '').trim().slice(0, 120)
}

/** Les unités laissées hors du plan, avant et après. */
export function horsPlan(portions: readonly Portion[], total: number): { avant: number; apres: number } {
  if (portions.length === 0) return { avant: 0, apres: total }
  return { avant: portions[0].debut - 1, apres: total - portions[portions.length - 1].fin }
}

export { valides as portionsValides }
