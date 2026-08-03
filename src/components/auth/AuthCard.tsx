/**
 * Carte et champs partagés par les écrans d'authentification.
 *
 * Les trois écrans (connexion, inscription, confirmation) répétaient chacun
 * leurs classes ; la moindre retouche demandait de les modifier un par un. Les
 * styles vivent maintenant ici, dans le même vocabulaire que la page de
 * présentation : surface blanche, coins arrondis généreux, marine `#1e3a5f` en
 * couleur d'action.
 *
 * Les couleurs sont écrites en dur plutôt qu'avec les variables `--primary` :
 * celles-ci suivent le thème choisi dans les réglages, que quelqu'un en train
 * de se connecter n'a pas encore chargé.
 */

export const authLabel = 'block text-[13px] font-medium text-slate-600 mb-1.5'

export const authInput =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-800 ' +
  'placeholder:text-slate-400 outline-none transition ' +
  'focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15'

export const authButton =
  'w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3 ' +
  'text-[15px] font-semibold text-white transition-colors hover:bg-[#2a4f7a] ' +
  'disabled:opacity-50 disabled:hover:bg-[#1e3a5f]'

export const authLink =
  'font-semibold text-[#1e3a5f] underline-offset-4 hover:underline'

export const authHint = 'mt-1.5 text-[12.5px] leading-relaxed text-slate-400'

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-7 sm:p-8 ring-1 ring-slate-900/[0.06] shadow-[0_30px_70px_-20px_rgba(4,12,26,0.55)]">
      <h1 className="text-[22px] font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">{subtitle}</p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  )
}

/** Message d'erreur d'un formulaire d'authentification. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="rounded-xl bg-[#fdecea] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#b3271a]"
    >
      {children}
    </p>
  )
}
