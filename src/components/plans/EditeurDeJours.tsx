'use client'

import { useEffect, useState } from 'react'
import { Merge, Plus, Scissors, Trash2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import {
  ajouter, commencerA, deplacerDebut, deplacerDerniereFin, deplacerFin, finirA, fusionner, horsPlan, parPas, parReperes,
  repartir, reperesUtiles, retirer, scinder, titreDe, type Portion, type Repere,
} from '@/lib/plans/portions'

/**
 * L'éditeur des jours d'un document lu jour après jour.
 *
 * « Il faut vraiment que l'on puisse choisir d'une manière personnalisée ce
 * qui sera lu chaque jour » — le propriétaire, 17 septembre 2026. Trois gestes
 * rapides (répartir en N jours, N pages par jour, un chapitre par jour quand
 * le PDF a des signets), puis la main : chaque jour « de … à … » modifiable,
 * scinder, fusionner avec le suivant, retirer, ajouter ; et les deux marges du
 * plan, la première et la dernière page, pour laisser la couverture ou la
 * table dehors. Toute la règle est dans `lib/plans/portions.ts` ; ici, rien
 * que des boutons qui l'appellent.
 *
 * Le même composant sert à la création et à la révision d'un plan existant :
 * il ne connaît que des portions et leur total.
 */

interface Props {
  /** Le nombre d'unités du document — ses pages. */
  total: number
  reperes: readonly Repere[]
  premieresLignes: readonly string[]
  portions: Portion[]
  onChange: (portions: Portion[]) => void
}

/**
 * Un champ numérique qui ne valide qu'à la sortie ou sur Entrée : borner à la
 * frappe empêcherait de taper « 12 » quand le minimum est 5.
 */
function ChampNombre({ valeur, onCommit, label, className }: { valeur: number; onCommit: (v: number) => void; label: string; className?: string }) {
  const [brouillon, setBrouillon] = useState(String(valeur))
  useEffect(() => { setBrouillon(String(valeur)) }, [valeur])
  const valider = () => {
    const n = Number(brouillon)
    if (Number.isFinite(n) && n !== valeur) onCommit(n)
    else setBrouillon(String(valeur))
  }
  return (
    <input
      type="number"
      inputMode="numeric"
      value={brouillon}
      aria-label={label}
      onChange={(e) => setBrouillon(e.target.value)}
      onBlur={valider}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur() } }}
      className={`border border-gray-300 rounded-lg px-2 py-1 text-sm tabular-nums ${className ?? 'w-16'}`}
    />
  )
}

export default function EditeurDeJours({ total, reperes, premieresLignes, portions, onChange }: Props) {
  const { t } = useI18n()
  const [nJours, setNJours] = useState(Math.min(30, Math.max(1, portions.length || 1)))
  const [pas, setPas] = useState(1)
  const chapitres = reperesUtiles(reperes)
  const marges = horsPlan(portions, total)
  const premiere = portions[0]?.debut ?? 1
  const derniere = portions[portions.length - 1]?.fin ?? total
  const l = t.plans.lecture

  const bouton = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50'
  const icone = 'p-1.5 rounded text-gray-400 hover:text-[--primary] disabled:opacity-30 disabled:hover:text-gray-400'

  return (
    <div className="space-y-3">
      {/* Les gestes rapides : chacun repart du début et de la fin actuels du plan. */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <ChampNombre valeur={nJours} onCommit={(v) => setNJours(Math.max(1, Math.min(total, v)))} label={l.daysCount} className="w-16" />
          <button type="button" className={bouton} onClick={() => onChange(repartir(premiere, derniere, nJours))}>{l.spread}</button>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ChampNombre valeur={pas} onCommit={(v) => setPas(Math.max(1, Math.min(total, v)))} label={l.pagesPerDay} className="w-16" />
          <button type="button" className={bouton} onClick={() => onChange(parPas(premiere, derniere, pas))}>{l.perDay}</button>
        </span>
        <button type="button" className={bouton} disabled={chapitres.length < 2}
          onClick={() => onChange(parReperes(premiere, derniere, chapitres))}
          title={chapitres.length < 2 ? l.noChapters : undefined}>
          {l.byChapter(chapitres.length)}
        </button>
      </div>

      {/* Les marges : ce que le plan laisse dehors, avant et après. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[--text-secondary]">
        <label className="inline-flex items-center gap-1.5">
          {l.startAt}
          <ChampNombre valeur={premiere} onCommit={(v) => onChange(commencerA(portions, v, total))} label={l.startAt} />
        </label>
        <label className="inline-flex items-center gap-1.5">
          {l.endAt}
          <ChampNombre valeur={derniere} onCommit={(v) => onChange(finirA(portions, v, total))} label={l.endAt} />
        </label>
        <span>{l.ofPages(total)}</span>
        {(marges.avant > 0 || marges.apres > 0) && <span>{l.leftOut(marges.avant, marges.apres)}</span>}
      </div>

      {/* La main : un jour par ligne. */}
      <ol className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
        {portions.map((p, i) => {
          const titre = titreDe(p, chapitres.length ? chapitres : reperes, premieresLignes)
          const dernierJour = i === portions.length - 1
          return (
            <li key={i} className="flex flex-wrap items-center gap-2 px-3 py-2">
              <span className="text-xs text-gray-400 font-mono w-14 shrink-0">{t.planDetail.day(i + 1)}</span>
              <span className="inline-flex items-center gap-1 text-sm shrink-0">
                <ChampNombre valeur={p.debut} onCommit={(v) => onChange(deplacerDebut(portions, i, v))} label={l.from} />
                <span className="text-gray-400">–</span>
                <ChampNombre valeur={p.fin}
                  onCommit={(v) => onChange(dernierJour ? deplacerDerniereFin(portions, v, total) : deplacerFin(portions, i, v))}
                  label={l.to} />
              </span>
              <span className="flex-1 min-w-[8rem] text-sm truncate text-[--text]" title={titre}>
                {titre || <span className="text-gray-400">{t.planDetail.pages(p.debut, p.fin)}</span>}
              </span>
              <span className="inline-flex items-center shrink-0">
                <button type="button" className={icone} disabled={p.fin <= p.debut} aria-label={l.split} title={l.split}
                  onClick={() => onChange(scinder(portions, i))}><Scissors className="w-4 h-4" /></button>
                <button type="button" className={icone} disabled={dernierJour} aria-label={l.merge} title={l.merge}
                  onClick={() => onChange(fusionner(portions, i))}><Merge className="w-4 h-4" /></button>
                <button type="button" className={`${icone} hover:text-red-600`} disabled={portions.length <= 1} aria-label={l.remove} title={l.remove}
                  onClick={() => onChange(retirer(portions, i))}><Trash2 className="w-4 h-4" /></button>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" className={bouton} onClick={() => onChange(ajouter(portions, total))} disabled={total < 1}>
          <Plus className="w-4 h-4" /> {l.addDay}
        </button>
        <span className="text-[--text-secondary]">{t.plans.documentDays(portions.length)}</span>
      </div>
    </div>
  )
}
