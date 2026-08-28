import Link from 'next/link'
import {
  ArrowRight, BarChart3, Bell, BookOpen, BookPlus, Brain, Camera, Check,
  CloudOff, Languages, RefreshCw, Search, ShieldCheck, Smartphone, Sparkles,
  Trophy, WifiOff,
} from 'lucide-react'
import AppPreview from './AppPreview'

/**
 * Page de présentation servie sur `/` aux visiteurs sans session.
 *
 * Entièrement rendue côté serveur : le formulaire d'inscription est un
 * formulaire GET qui pointe sur /auth/signup, il n'a donc besoin d'aucun
 * JavaScript. Les animations sont purement CSS (voir globals.css).
 *
 * La palette est celle de l'application — marine `#1e3a5f`, violet `#7b68ee` —
 * assombrie pour le hero, avec un doré en accent. Elle est écrite en dur plutôt
 * qu'avec les variables `--primary` : celles-ci suivent le thème choisi par
 * l'utilisateur dans ses réglages, ce qu'un visiteur n'a pas encore.
 */

const FEATURES = [
  {
    icon: BookPlus,
    title: 'Saisie en quelques secondes',
    body: "Un livre, des chapitres, des versets. Lis le texte, valide, et note ce que la lecture t'a laissé.",
  },
  {
    icon: BookOpen,
    title: 'Plans de lecture',
    body: "Génère un plan sur la durée de ton choix — la Bible entière, le Nouveau Testament, un seul livre — et avance jour par jour.",
  },
  {
    icon: Trophy,
    title: 'Progression visible',
    body: "Chaque livre se remplit à mesure que tu le parcours. Tu vois d'un coup d'œil ce qui reste à lire.",
  },
  {
    icon: Search,
    title: 'Recherche biblique',
    body: "Retrouve un mot ou un verset dans les douze traductions, sans jamais quitter l'application.",
  },
  {
    icon: BarChart3,
    title: 'Statistiques',
    body: 'Rythme, contextes, livres les plus fréquentés : de quoi comprendre tes habitudes de lecture.',
  },
  {
    icon: Camera,
    title: 'Photos, audio et liens',
    body: "Attache la photo de tes notes, un mémo vocal ou un lien à n'importe quelle lecture.",
  },
  {
    icon: Brain,
    title: 'Quizz et mémorisation',
    body: 'Teste ce que tu retiens, et apprends un verset par cœur — la révision revient quand il le faut, pas avant.',
  },
  {
    icon: Bell,
    title: 'Rappels et verset du jour',
    body: "Un rappel à l'heure que tu choisis, sur ton téléphone. Et un verset offert chaque jour à l'ouverture.",
  },
  {
    icon: Languages,
    title: 'Cinq langues',
    body: "L'application se lit en français, anglais, espagnol, italien et arabe — et le texte biblique aussi.",
  },
]

const VERSIONS = [
  { name: 'Louis Segond', year: '1910', langue: 'Français' },
  { name: 'Bible Annotée de Neuchâtel', year: '1900', langue: 'Français' },
  { name: 'Bible Darby', year: '1885', langue: 'Français' },
  { name: 'David Martin', year: '1744', langue: 'Français' },
  { name: 'Ostervald', year: '1996', langue: 'Français' },
  { name: 'Augustin Crampon', year: '1923', langue: 'Français' },
  { name: 'Lemaître de Sacy', year: '1667', langue: 'Français' },
  { name: 'Perret-Gentil et Rilliet', year: '1861', langue: 'Français' },
  { name: 'King James Version', year: '1611', langue: 'English' },
  { name: 'Reina-Valera', year: '1909', langue: 'Español' },
  { name: 'Giovanni Diodati', year: '1649', langue: 'Italiano' },
  { name: 'Smith & Van Dyck', year: '1865', langue: 'العربية' },
]

const CONTEXTS = [
  '🧘 Méditation', '⛪ Église', '🎤 Prédication', '📕 Livre', '🎧 Livre audio',
  '📰 Revue', '🎙️ Podcast', '📻 Radio', '📺 YouTube', '📌 Autre',
]

const FIGURES = [
  { value: '12', label: 'traductions, en 5 langues' },
  { value: '66', label: 'livres' },
  { value: '1 189', label: 'chapitres' },
  { value: '100 %', label: 'consultable hors ligne' },
]

function SignupForm({ tone }: { tone: 'dark' | 'light' }) {
  const dark = tone === 'dark'
  return (
    <form
      action="/auth/signup"
      method="get"
      className={`flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl sm:rounded-full max-w-lg ${
        dark
          ? 'bg-white/10 ring-1 ring-white/15 backdrop-blur-sm'
          : 'bg-white ring-1 ring-slate-900/10 shadow-[0_10px_30px_-12px_rgba(4,12,26,0.25)]'
      }`}
    >
      <label htmlFor={`email-${tone}`} className="sr-only">Adresse email</label>
      <input
        id={`email-${tone}`}
        type="email"
        name="email"
        required
        autoComplete="email"
        spellCheck={false}
        placeholder="ton.adresse@exemple.fr"
        className={`flex-1 min-w-0 bg-transparent rounded-full px-5 py-3 text-[15px] outline-none ${
          dark
            ? 'text-white placeholder:text-white/40'
            : 'text-slate-800 placeholder:text-slate-400'
        }`}
      />
      <button
        type="submit"
        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-white bg-[#1e3a5f] hover:bg-[#2a4f7a] ring-1 ring-white/10 transition-colors"
      >
        Créer mon compte
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-[#f8f9fb] text-slate-800">
      {/* ------------------------------------------------------------------ */}
      {/* En-tête                                                            */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1626]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
            {/* Le SVG porte un fond blanc pleine page : invisible sur la barre
                latérale de l'application, il forme un carré sur l'en-tête
                sombre. Le cadrer en tuile arrondie en fait une intention. */}
            <span className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/15 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" width="36" height="36" className="w-9 h-9" />
            </span>
            <span className="text-white font-bold text-[17px] tracking-tight">Bible Ouverte</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[14px] text-white/60">
            <a href="#fonctionnalites" className="hover:text-white transition-colors no-underline">Fonctionnalités</a>
            <a href="#traductions" className="hover:text-white transition-colors no-underline">Traductions</a>
            <a href="#hors-ligne" className="hover:text-white transition-colors no-underline">Hors ligne</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-[14px] text-white/75 hover:text-white transition-colors no-underline"
            >
              Se connecter
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#0a1626] hover:bg-white/90 transition-colors no-underline"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-[#0a1626]">
        {/* Halos colorés et trame : purement décoratifs. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 w-[46rem] h-[46rem] rounded-full bg-[#1e3a5f] opacity-60 blur-[130px] bo-aurora" />
          <div className="absolute -top-24 right-[-14rem] w-[40rem] h-[40rem] rounded-full bg-[#7b68ee] opacity-25 blur-[140px] bo-aurora" style={{ animationDelay: '-8s' }} />
          <div className="absolute bottom-[-18rem] left-1/3 w-[36rem] h-[36rem] rounded-full bg-[#e9b949] opacity-[0.12] blur-[150px] bo-aurora" style={{ animationDelay: '-15s' }} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bo-grid" />

        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-24 sm:pt-24 sm:pb-32 grid lg:grid-cols-[1.02fr_1fr] gap-14 lg:gap-10 items-center">
          <div>
            <p className="bo-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12.5px] text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-[#e9b949]" />
              Gratuit · sans publicité · fonctionne hors ligne
            </p>

            <h1
              className="bo-rise mt-6 text-[2.6rem] leading-[1.06] sm:text-6xl sm:leading-[1.05] font-bold tracking-tight text-white"
              style={{ animationDelay: '80ms' }}
            >
              Toutes tes lectures bibliques,{' '}
              <span className="bg-gradient-to-r from-[#e9b949] via-[#f0d089] to-[#9d8dff] bg-clip-text text-transparent">
                au même endroit
              </span>
              .
            </h1>

            <p
              className="bo-rise mt-6 text-[17px] sm:text-lg leading-relaxed text-white/65 max-w-xl"
              style={{ animationDelay: '160ms' }}
            >
              Bible Ouverte garde la trace de ce que tu lis, où que tu sois — même
              sans réseau. Douze traductions en cinq langues, tes plans de lecture
              et ta progression, synchronisés sur tous tes appareils.
            </p>

            <div className="bo-rise mt-9" style={{ animationDelay: '240ms' }}>
              <SignupForm tone="dark" />
              <p className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-white/45">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#2ecc71]" /> Aucune carte bancaire
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#2ecc71]" /> Compte supprimable en un clic
                </span>
              </p>
            </div>
          </div>

          <div className="bo-rise lg:pl-4" style={{ animationDelay: '320ms' }}>
            <AppPreview />
          </div>
        </div>

        {/* Bandeau de chiffres, à cheval sur la bordure du hero. */}
        <div className="relative mx-auto max-w-6xl px-5">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden bg-white/10 ring-1 ring-white/10 translate-y-px">
            {FIGURES.map(({ value, label }) => (
              <div key={label} className="bg-[#0d1c31] px-5 py-6 text-center">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</span>
                  <span className="mt-1 block text-[12.5px] text-white/45">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="h-10 bg-[#0a1626]" />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Fonctionnalités                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-5 py-24 sm:py-28 scroll-mt-20">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#7b68ee]">
            Ce que fait l&apos;application
          </p>
          <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-tight font-bold tracking-tight text-slate-900">
            Un carnet de lecture qui tient le compte à ta place.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-slate-500">
            Pensé pour la lecture personnelle comme pour la préparation d&apos;un
            message : chaque lecture porte son contexte, ses notes et son texte.
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl bg-white p-6 ring-1 ring-slate-900/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_18px_40px_-18px_rgba(4,12,26,0.28)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#e8eef5] flex items-center justify-center group-hover:bg-[#1e3a5f] transition-colors duration-300">
                <Icon className="w-5 h-5 text-[#1e3a5f] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="mt-5 text-[17px] font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </div>

        {/* Contextes de lecture */}
        <div className="mt-16 rounded-2xl bg-white p-7 sm:p-9 ring-1 ring-slate-900/[0.06]">
          <div className="flex flex-col lg:flex-row lg:items-center gap-7">
            <div className="lg:w-[38%] shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Chaque lecture a son contexte</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-slate-500">
                Distingue la méditation du matin de la préparation d&apos;une
                prédication ou du chapitre écouté en voiture. Dix contextes sont
                fournis, et tu peux créer les tiens.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-1">
              {CONTEXTS.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-[#f8f9fb] ring-1 ring-slate-900/[0.06] px-3.5 py-2 text-[13.5px] text-slate-600"
                >
                  {c}
                </span>
              ))}
              <span className="rounded-full bg-[#f0eeff] ring-1 ring-[#7b68ee]/20 px-3.5 py-2 text-[13.5px] font-medium text-[#5a49c9]">
                + le tien
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Hors ligne et synchronisation                                      */}
      {/* ------------------------------------------------------------------ */}
      <section id="hors-ligne" className="relative overflow-hidden bg-[#0a1626] scroll-mt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 -translate-y-1/2 -right-40 w-[38rem] h-[38rem] rounded-full bg-[#1e3a5f] opacity-70 blur-[130px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#e9b949]">
              Hors ligne d&apos;abord
            </p>
            <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-tight font-bold tracking-tight text-white">
              Le métro, l&apos;avion, une salle sans réseau.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/60">
              Les traductions que tu choisis sont stockées dans ton navigateur : le texte
              s&apos;ouvre et se lit sans connexion. Ce que tu saisis hors ligne
              rejoint ton compte dès que le réseau revient.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: WifiOff, text: "Le texte biblique reste lisible sans la moindre connexion." },
                { icon: RefreshCw, text: 'Tes lectures se synchronisent entre téléphone, tablette et ordinateur.' },
                { icon: Smartphone, text: "Installable comme une application, depuis le navigateur." },
                { icon: ShieldCheck, text: 'Chaque compte est cloisonné au niveau de la base de données.' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3.5">
                  <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-white/[0.07] ring-1 ring-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white/80" />
                  </span>
                  <span className="text-[15px] leading-relaxed text-white/70">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Illustration : la bascule en ligne / hors ligne */}
          <div className="space-y-3.5">
            <div className="rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#e74c3c]/15 flex items-center justify-center">
                  <CloudOff className="w-4 h-4 text-[#f0857c]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white">Hors connexion</p>
                  <p className="text-[12.5px] text-white/45">Tu lis Romains 8 dans le train.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 pl-[3.25rem]">
                <span className="block h-2 rounded-full bg-white/10 w-full" />
                <span className="block h-2 rounded-full bg-white/10 w-[86%]" />
                <span className="block h-2 rounded-full bg-white/10 w-[62%]" />
              </div>
            </div>

            <div className="flex justify-center">
              <span className="w-px h-6 bg-gradient-to-b from-white/10 to-[#2ecc71]/50" />
            </div>

            <div className="rounded-2xl bg-white/[0.06] ring-1 ring-[#2ecc71]/25 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#2ecc71]/15 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-[#5fe39b]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white">Le réseau revient</p>
                  <p className="text-[12.5px] text-white/45">La lecture est sur tous tes appareils.</p>
                </div>
              </div>
              <div className="mt-4 pl-[3.25rem] flex flex-wrap gap-2">
                {['Téléphone', 'Tablette', 'Ordinateur'].map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/70">
                    <Check className="w-3 h-3 text-[#5fe39b]" /> {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Traductions                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="traductions" className="mx-auto max-w-6xl px-5 py-24 sm:py-28 scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#7b68ee]">
              Le texte
            </p>
            <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-tight font-bold tracking-tight text-slate-900">
              Douze traductions, cinq langues, libres de droits.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-slate-500">
              Huit en français, et une par langue de l&apos;application. Toutes
              dans le domaine public, toutes consultables hors ligne, et
              comparables d&apos;un passage à l&apos;autre. Choisis ta version par
              défaut, change-en quand tu veux.
            </p>

            <figure className="mt-9 border-l-2 border-[#e9b949] pl-5">
              <blockquote className="font-serif text-[19px] leading-relaxed italic text-slate-700">
                « Ta parole est une lampe à mes pieds, et une lumière sur mon sentier. »
              </blockquote>
              <figcaption className="mt-2.5 text-[13px] text-slate-400">
                Psaumes 119.105 — Louis Segond 1910
              </figcaption>
            </figure>
          </div>

          <ul className="rounded-2xl bg-white ring-1 ring-slate-900/[0.06] overflow-hidden divide-y divide-slate-100">
            {VERSIONS.map(({ name, year, langue }) => (
              <li key={name} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="flex items-center gap-3 min-w-0">
                  <BookOpen className="w-4 h-4 shrink-0 text-[#1e3a5f]/40" />
                  <span className="text-[15px] font-medium text-slate-700 truncate">{name}</span>
                </span>
                <span className="shrink-0 flex items-center gap-3">
                  <span className="text-[12.5px] text-slate-400">{langue}</span>
                  <span className="text-[12.5px] tabular-nums text-slate-400">{year}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Appel à l'action final                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a5f] to-[#0a1626] px-6 py-16 sm:px-14 sm:py-20 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-[#7b68ee] opacity-20 blur-[120px]" />
          </div>

          <div className="relative">
            <h2 className="text-3xl sm:text-[2.7rem] leading-tight font-bold tracking-tight text-white max-w-2xl mx-auto">
              Commence à noter tes lectures dès aujourd&apos;hui.
            </h2>
            <p className="mt-5 text-[17px] text-white/60 max-w-lg mx-auto leading-relaxed">
              La création du compte prend moins d&apos;une minute. Tout est gratuit,
              et tes lectures restent exportables à tout moment.
            </p>

            <div className="mt-9 flex justify-center">
              <SignupForm tone="light" />
            </div>

            <p className="mt-5 text-[13.5px] text-white/40">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-white/75 underline underline-offset-4 hover:text-white transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pied de page                                                       */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width="24" height="24" className="w-6 h-6" />
            <span className="text-[15px] font-semibold text-[#1e3a5f]">Bible Ouverte</span>
          </div>

          <div className="flex items-center gap-6 text-[14px] text-slate-500">
            <Link href="/auth/login" className="hover:text-slate-800 transition-colors no-underline">Se connecter</Link>
            <Link href="/auth/signup" className="hover:text-slate-800 transition-colors no-underline">Créer un compte</Link>
          </div>

          <p className="text-[13px] text-slate-400 text-center sm:text-right">
            Textes bibliques dans le domaine public.
          </p>
        </div>
      </footer>
    </div>
  )
}
