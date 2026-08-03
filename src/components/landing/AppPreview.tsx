import {
  BarChart3, BookOpen, BookPlus, Flame, History, Search, Trophy,
} from 'lucide-react'

/**
 * Reproduction statique de l'écran « Nouvelle lecture ».
 *
 * Volontairement en HTML plutôt qu'en capture d'écran : la maquette reste nette
 * sur tous les écrans, s'adapte au responsive et ne coûte pas une image de plus
 * à charger. Elle suit les libellés réels de `src/app/new-reading/page.tsx`.
 */

const NAV = [
  { icon: BookPlus, label: 'Nouvelle lecture', active: true },
  { icon: BookOpen, label: 'Plans de lecture' },
  { icon: Search, label: 'Recherche biblique' },
  { icon: Trophy, label: 'Progression' },
  { icon: History, label: 'Historique' },
  { icon: BarChart3, label: 'Statistiques' },
]

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-medium text-slate-500 mb-1">{label}</p>
      <div className="h-7 rounded-md border border-slate-200 bg-white px-2 flex items-center">
        <span className="text-[10px] text-slate-700 truncate">{value}</span>
      </div>
    </div>
  )
}

export default function AppPreview() {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white shadow-[0_30px_70px_-20px_rgba(4,12,26,0.55)] ring-1 ring-white/15 overflow-hidden">
        {/* Barre de fenêtre */}
        <div className="flex items-center gap-2 px-3.5 h-9 bg-slate-100 border-b border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="flex-1 flex justify-center">
            <span className="text-[10px] text-slate-400 bg-white rounded px-3 py-0.5 border border-slate-200">
              bible-ouverte.vercel.app
            </span>
          </div>
        </div>

        <div className="flex bg-[#f8f9fb]">
          {/* Barre latérale */}
          <div className="hidden sm:flex w-[148px] shrink-0 flex-col gap-0.5 border-r border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-1.5 px-1.5 pb-3 pt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" width="16" height="16" className="w-4 h-4" />
              <span className="text-[11px] font-bold text-[#1e3a5f]">Bible Ouverte</span>
            </div>
            {NAV.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[10px] ${
                  active ? 'bg-[#1e3a5f] text-white' : 'text-slate-500'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BookPlus className="w-4 h-4 text-[#1e3a5f]" />
              <span className="text-[13px] font-bold text-slate-800">Nouvelle lecture</span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Date" value="3 août 2026" />
                <Field label="Contexte" value="🧘 Méditation" />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Field label="Livre" value="Romains" />
                <Field label="Chapitre début" value="8" />
                <Field label="Chapitre fin" value="8" />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="rounded-full bg-[#e8eef5] text-[#1e3a5f] text-[10px] font-medium px-2.5 py-1">
                  Romains 8
                </span>
                <span className="rounded-full bg-[#e8eef5] text-[#1e3a5f] text-[10px] font-medium px-2.5 py-1">
                  Psaumes 119.105
                </span>
                <span className="rounded-full bg-[#f0eeff] text-[#5a49c9] text-[10px] font-medium px-2.5 py-1">
                  + ajouter un passage
                </span>
              </div>

              <div>
                <p className="text-[9px] font-medium text-slate-500 mb-1">Notes</p>
                <div className="rounded-md border border-slate-200 bg-white p-2 space-y-1.5">
                  <span className="block h-1.5 rounded-full bg-slate-100 w-[92%]" />
                  <span className="block h-1.5 rounded-full bg-slate-100 w-[78%]" />
                  <span className="block h-1.5 rounded-full bg-slate-100 w-[45%]" />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#1e3a5f] px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-white/70">Résumé de la saisie</span>
              <span className="text-[10px] font-semibold text-white">2 passages · 32 versets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carte flottante : la série de jours consécutifs. */}
      <div className="hidden md:block absolute -bottom-7 -left-7 lg:-left-10 rounded-xl bg-white shadow-[0_18px_40px_-12px_rgba(4,12,26,0.45)] ring-1 ring-slate-900/5 px-4 py-3 bo-float">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#fef9e7] flex items-center justify-center">
            <Flame className="w-[18px] h-[18px] text-[#f39c12]" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none text-slate-800">28 jours</p>
            <p className="text-[11px] text-slate-500 mt-1">de lecture d&apos;affilée</p>
          </div>
        </div>
      </div>
    </div>
  )
}
