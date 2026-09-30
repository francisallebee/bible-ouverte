"use client";

import { useEffect, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import {
  Trophy, Flame, BookOpen, Target, BarChart3, Star, Award,
  ScrollText, BookMarked, Sparkles, Gem, Layers,
} from "lucide-react";
import {
  seedIfNeeded, getAllReadings, getSettings, getAllContexts,
  getAllPlans, getPlanDays,
} from "@/lib/storage";
import type { ReadingEntry, AppSettings, ReadingContext } from "@/lib/storage";
import { BOOKS } from "@/features/bible";
import { readingIdsOf } from "@/lib/storage/plan-passages";
import {
  normaliserObjectif, progressionDe, aujourdhui,
  calculerSeries, prochainPalier, paliersAtteints, filtrerParPortee,
} from "@/lib/objectifs/objectifs";
import { useI18n, useBookName, useContextName } from "@/contexts/I18nContext";
import { formatPart } from "@/lib/progression/rapport";
import { compterChapitres, statutsParChapitre } from "@/lib/progression/chapitres";
import BarreLecture from "@/components/BarreLecture";
import { teintesDe } from "@/lib/themes";
import { localeInfo } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/ui/fr";
import {
  BIBLE_CATEGORIES, OLD_TESTAMENT, NEW_TESTAMENT,
  getCategoryChapters, getBookCategory,
} from "@/features/bible";

interface CategoryProgress {
  id: string;
  name: string;
  books: string[];
  totalChapters: number;
  /** Chapitres touchés, entiers compris. */
  readChapters: number;
  /** Ceux dont tous les versets ont été lus. */
  entiers: number;
}

interface Badge {
  id: keyof Dictionary["progress"]["badges"];
  icon: typeof Star;
  unlocked: boolean;
}

/**
 * Les badges, par identifiant et condition. Leurs noms et descriptions vivent
 * dans les dictionnaires, sous `progress.badges` : ce sont des libellés, pas
 * de la logique.
 */
function getBadges(totalChapters: number, streak: number, categoriesDone: number, totalCategories: number): Badge[] {
  return [
    { id: "first", icon: Star, unlocked: totalChapters >= 1 },
    { id: "ten", icon: Star, unlocked: totalChapters >= 10 },
    { id: "fifty", icon: Star, unlocked: totalChapters >= 50 },
    { id: "hundred", icon: Award, unlocked: totalChapters >= 100 },
    { id: "two-fifty", icon: Award, unlocked: totalChapters >= 250 },
    { id: "five-hundred", icon: Trophy, unlocked: totalChapters >= 500 },
    { id: "thousand", icon: Trophy, unlocked: totalChapters >= 1000 },
    { id: "streak-3", icon: Flame, unlocked: streak >= 3 },
    { id: "streak-7", icon: Flame, unlocked: streak >= 7 },
    { id: "streak-30", icon: Flame, unlocked: streak >= 30 },
    { id: "streak-100", icon: Flame, unlocked: streak >= 100 },
    { id: "category-all", icon: Gem, unlocked: categoriesDone >= totalCategories },
    { id: "category-half", icon: Gem, unlocked: categoriesDone >= Math.ceil(totalCategories / 2) },
  ];
}

/** Le palier atteint. Son titre vit dans les dictionnaires. */
function getLevel(totalChapters: number): { level: number; next: number } {
  if (totalChapters < 10) return { level: 1, next: 10 };
  if (totalChapters < 50) return { level: 2, next: 50 };
  if (totalChapters < 100) return { level: 3, next: 100 };
  if (totalChapters < 250) return { level: 4, next: 250 };
  if (totalChapters < 500) return { level: 5, next: 500 };
  if (totalChapters < 1000) return { level: 6, next: 1000 };
  return { level: 7, next: -1 };
}

export default function ProgressPage() {
  const { t, locale } = useI18n();
  const getBookName = useBookName();
  const contextName = useContextName();
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);
  /** Non persisté : c'est une façon de regarder, pas un réglage de compte. */
  const [enPourcentage, setEnPourcentage] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [r, s, ctxs] = await Promise.all([getAllReadings(), getSettings(), getAllContexts()]);
      setReadings(r);
      setSettings(s ?? null);
      setContexts(ctxs);
      setLoaded(true);
    })();
  }, []);

  /**
   * Les chapitres entamés et ceux lus en entier.
   *
   * Le `Set<`livre:chapitre`>` qui vivait ici ne regardait jamais les versets :
   * Jean 3:16-18, trois versets sur trente-six, comptait tout Jean 3 comme lu.
   * Mesuré le 9 septembre 2026 sur le compte du propriétaire : **129 de ses
   * 169 chapitres étaient partiels**, soit 76 %.
   *
   * La règle est sortie dans `lib/progression/chapitres.ts`, et le calcul local
   * est **retiré** et non doublé — le piège 5 du dépôt, quatre fois rencontré.
   * `entames` rend exactement ce que rendait ce `Set`, ce qu'un test vérifie :
   * le niveau et les badges ne bougent donc pour personne.
   */
  const comptage = useMemo(() => compterChapitres(readings), [readings]);
  const chapterCount = comptage.entames;

  const uniqueBooks = useMemo(() => {
    return new Set(readings.map((r) => r.book)).size;
  }, [readings]);

  const totalBibleChapters = BOOKS.reduce((s, b) => s + b.chapters, 0);
  /*
    Les statuts sont calculés **une fois** et regroupés ensuite, plutôt qu'un
    appel par catégorie : `statutsParChapitre` parcourt toutes les lectures, et
    le refaire dix fois multiplierait ce parcours par dix pour le même
    résultat. Le piège du comptage dans une boucle, à une autre échelle que
    celui de l'écran Administration, mais le même.
  */
  const statuts = useMemo(() => statutsParChapitre(readings), [readings]);

  const booksReadList = useMemo(() => {
    const parLivre: Record<string, { entames: number; entiers: number }> = {};
    for (const c of statuts) {
      const compte = (parLivre[c.livre] ??= { entames: 0, entiers: 0 });
      compte.entames += 1;
      if (c.entier) compte.entiers += 1;
    }
    return Object.entries(parLivre).map(([book, compte]) => {
      const bookInfo = BOOKS.find((b) => b.abbreviation === book);
      return {
        book, name: getBookName(book),
        readChapters: compte.entames, entiers: compte.entiers,
        totalChapters: bookInfo?.chapters ?? 0,
      };
    })
      /*
        Le tri suit les chapitres **entiers** d'abord, les entamés ensuite.
        Un livre lu en entier doit passer devant un livre effleuré partout :
        trier sur les seuls entamés remontait en tête des livres dont aucun
        chapitre n'était achevé.
      */
      .sort((a, b) => {
        const part = (x: typeof a, n: number) => n / Math.max(x.totalChapters, 1);
        return (part(b, b.entiers) - part(a, a.entiers))
          || (part(b, b.readChapters) - part(a, a.readChapters));
      });
    // `getBookName` change avec la langue : sans lui ici, la liste garderait
    // les noms de la langue précédente jusqu'à la prochaine lecture.
  }, [statuts, getBookName]);

  /*
    Les deux testaments passent par la même règle que le compteur du haut.
    Le `Set<livre:ch>` qui vivait ici ignorait les versets : il annonçait Jean 3
    lu pour trois versets sur trente-six, alors que la carte « Chapitres lus »
    du même écran faisait la différence depuis le 9 septembre 2026. Deux
    définitions sur un écran finissent par se contredire, et celles-ci le
    faisaient déjà.
  */
  const ancienTestament = useMemo(() => compterChapitres(readings, OLD_TESTAMENT), [readings]);
  const nouveauTestament = useMemo(() => compterChapitres(readings, NEW_TESTAMENT), [readings]);

  const otTotal = useMemo(() => getCategoryChapters(OLD_TESTAMENT), []);
  const ntTotal = useMemo(() => getCategoryChapters(NEW_TESTAMENT), []);

  const categories: CategoryProgress[] = useMemo(() => {
    return BIBLE_CATEGORIES.map((cat) => {
      const dedans = new Set(cat.books);
      const siens = statuts.filter((c) => dedans.has(c.livre));
      return {
        id: cat.id,
        name: cat.name,
        books: cat.books,
        totalChapters: getCategoryChapters(cat.books),
        readChapters: siens.length,
        entiers: siens.filter((c) => c.entier).length,
      };
    });
  }, [statuts]);

  const categoriesWithReads = categories.filter((c) => c.readChapters > 0).length;

  /**
   * Les séries viennent de `lib/objectifs`, testées, et non plus d'un calcul
   * local. Celui qu'elles remplacent comparait `toISOString().slice(0, 10)` —
   * une date **UTC** — aux dates civiles locales des lectures : passé minuit
   * dans un fuseau en avance, la série courante retombait à zéro alors que la
   * lecture du jour était bien enregistrée.
   *
   * Elles portent aussi la tolérance d'un jour, que le calcul local n'avait
   * pas. C'est la même série qui nourrit l'affichage, les paliers **et** les
   * badges : deux définitions sur un même écran finiraient par se contredire.
   */
  const series = useMemo(() => calculerSeries(readings, aujourdhui()), [readings]);
  const palierSuivant = useMemo(() => prochainPalier(series.courante), [series.courante]);
  const paliers = useMemo(() => paliersAtteints(series.meilleure), [series.meilleure]);
  const badges = useMemo(() => getBadges(chapterCount, series.meilleure, categoriesWithReads, categories.length), [chapterCount, series.meilleure, categoriesWithReads, categories.length]);
  const level = useMemo(() => getLevel(chapterCount), [chapterCount]);
  const goal = settings?.readingGoal;

  /**
   * Chapitres lus par contexte. On compte les chapitres et non les lectures :
   * c'est l'unité qu'emploient déjà le niveau, les testaments et les objectifs,
   * et une lecture de dix chapitres ne pèse pas comme une lecture d'un seul.
   */
  const byContext = useMemo(() => {
    const byId: Record<string, ReadingContext> = {};
    for (const c of contexts) byId[c.id] = c;

    const counts: Record<string, number> = {};
    for (const r of readings) {
      const key = r.contextId || "";
      counts[key] = (counts[key] || 0) + (r.chapterEnd - r.chapterStart + 1);
    }

    const rows = Object.entries(counts).map(([id, chapters]) => {
      const ctx = byId[id];
      return {
        id,
        name: id === "" ? t.progress.noContext : (ctx ? contextName(ctx) : id),
        emoji: id === "" ? "—" : ctx?.emoji ?? "",
        color: ctx?.color ?? "#95a5a6",
        chapters,
      };
    });

    const max = rows.reduce((m, r) => Math.max(m, r.chapters), 0);
    return rows
      .sort((a, b) => b.chapters - a.chapters)
      .map((r) => ({ ...r, share: max > 0 ? (r.chapters / max) * 100 : 0 }));
  }, [readings, contexts, contextName, t.progress.noContext]);

  /**
   * L'avancement de la période en cours.
   *
   * Le calcul vit dans `lib/objectifs`, testé : il portait ici une comparaison
   * de date **UTC** contre des dates locales, si bien qu'une lecture
   * enregistrée en soirée pouvait être comptée le mauvais jour.
   */
  const objectif = useMemo(() => normaliserObjectif(goal), [goal]);

  /**
   * La portée « par plan » demande une résolution asynchrone, et c'est le
   * point à comprendre : **aucune colonne ne relie une lecture à un plan**, et
   * le contexte « Plan de lecture » est le même pour tous. Le seul lien est
   * `plan_days.readingId`, posé au cochage — d'où cette lecture des jours du
   * plan pour en tirer l'ensemble des identifiants.
   */
  const planId = objectif.portee?.type === "plan" ? objectif.portee.planId : null;
  const [idsDuPlan, setIdsDuPlan] = useState<ReadonlySet<number> | undefined>(undefined);
  const [nomDuPlan, setNomDuPlan] = useState("");

  useEffect(() => {
    if (planId === null) {
      setIdsDuPlan(undefined);
      setNomDuPlan("");
      return;
    }
    let vivant = true;
    (async () => {
      const [jours, plans] = await Promise.all([getPlanDays(planId), getAllPlans()]);
      if (!vivant) return;
      setIdsDuPlan(new Set(jours.flatMap((j) => readingIdsOf(j))));
      setNomDuPlan(plans.find((p) => p.id === planId)?.name ?? "");
    })();
    return () => { vivant = false; };
  }, [planId]);

  const lecturesDeLObjectif = useMemo(
    () => filtrerParPortee(readings, objectif.portee, idsDuPlan),
    [readings, objectif.portee, idsDuPlan],
  );
  const goalProgress = useMemo(
    () => progressionDe(lecturesDeLObjectif, objectif, aujourdhui()),
    [lecturesDeLObjectif, objectif],
  );

  /** Ce que l'objectif vise, nommé — vide quand il porte sur tout. */
  const nomDeLaPortee = useMemo(() => {
    const portee = objectif.portee;
    if (portee?.type === "livre") return getBookName(portee.livre);
    if (portee?.type === "plan") return nomDuPlan;
    return "";
  }, [objectif.portee, getBookName, nomDuPlan]);

  /**
   * Les nombres disent ce qui a été fait, le pourcentage dit où l'on en est.
   * Aucun ne remplace l'autre — item 32 de la feuille de route.
   */
  const rapport = (lu: number, total: number) => {
    if (!enPourcentage) return `${lu} / ${total}`;
    return formatPart(localeInfo(locale).tag, lu, total) ?? `${lu} / ${total}`;
  };

  if (!loaded) return <p className="text-gray-500">{t.common.loading}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[--primary]" />
        {t.progress.title}
        <button
          type="button"
          role="switch"
          aria-checked={enPourcentage}
          onClick={() => setEnPourcentage((v) => !v)}
          title={t.progress.enPourcentage}
          className={`ms-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            enPourcentage
              ? "border-[--primary] bg-[--primary] text-white"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          <span
            aria-hidden
            className={`h-3.5 w-6 rounded-full p-0.5 transition-colors ${enPourcentage ? "bg-white/30" : "bg-gray-300"}`}
          >
            <span className={`block h-2.5 w-2.5 rounded-full bg-white transition-transform ${enPourcentage ? "translate-x-2.5" : ""}`} />
          </span>
          %
        </button>
      </h1>

      {/*
        Deux colonnes dès le téléphone, et non plus une.

        Ces quatre cartes ne portent qu'une valeur courte chacune ; leur donner
        toute la largeur coûtait 625 px sur 375 de large, quand deux par ligne
        en demandent 333. La hauteur d'une ligne est celle de sa carte la plus
        haute — Série, à 194 px, qui porte une barre **et** ses pastilles de
        palier. L'audit du 2 septembre disait la carte Niveau seule à porter une
        barre de progression ; elles sont deux, et c'est Série la plus haute.

        Réserve à connaître, mesurée le 2 septembre 2026 : ce correctif ne rend
        pas la promesse de l'audit, « Progression passe sous trois écrans ». Les
        cartes ne pèsent que 16 % des 3 820 px de l'écran ; 84 % sont dans cinq
        sections de liste — Succès 836 px, par contexte 598, par catégorie 550,
        Détail par livre 466. Raccourcir vraiment cet écran suppose de traiter
        celles-là, ce qui est une décision de produit et non une disposition.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-[--primary] to-[--primary-hover] text-white rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-300" />
            <span className="text-xs uppercase tracking-wider opacity-80">{t.progress.level(level.level)}</span>
          </div>
          <p className="text-lg font-bold">{t.progress.levels[level.level]}</p>
          {level.next > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-300 rounded-full" style={{ width: `${Math.min(100, (chapterCount / level.next) * 100)}%` }} />
              </div>
              <p className="text-xs mt-1 opacity-70">
                {enPourcentage ? rapport(chapterCount, level.next) : t.progress.chaptersOf(chapterCount, level.next)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="text-xs uppercase tracking-wider text-gray-500">{t.progress.currentStreak}</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{series.courante}<span className="text-lg font-normal text-gray-400 ms-1">{t.progress.days}</span></p>
          <p className="text-xs text-gray-400 mt-1">{t.progress.bestStreak(series.meilleure)}</p>

          {/* Paliers de série. La barre vise le prochain depuis la série
              courante ; les pastilles récompensent la meilleure, qu'une
              coupure ne doit pas effacer. */}
          <div className="mt-3">
            {palierSuivant !== null ? (
              <>
                <div className="h-1.5 bg-[--piste] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 rounded-full transition-[width] duration-700"
                    style={{ width: `${Math.min(100, (series.courante / palierSuivant) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{t.progress.nextMilestone(palierSuivant)}</p>
              </>
            ) : (
              <p className="text-xs text-gray-400">{t.progress.allMilestones}</p>
            )}
            {paliers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {paliers.map((palier) => (
                  <span
                    key={palier}
                    className="text-[10px] font-semibold rounded-full border border-orange-200 bg-orange-50 text-orange-700 px-2 py-0.5"
                  >
                    {t.progress.milestoneReached(palier)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-[--primary]" />
            <span className="text-xs uppercase tracking-wider text-gray-500">{t.progress.chaptersRead}</span>
          </div>
          <p className="text-3xl font-bold text-[--primary]">
            {enPourcentage
              ? rapport(chapterCount, totalBibleChapters)
              : <>{chapterCount}<span className="text-lg font-normal text-gray-400 ms-1">/ {totalBibleChapters}</span></>}
          </p>
          {/* Le second chiffre, qui est tout l'objet du correctif : le grand
              nombre dit ce qu'on a touché, celui-ci ce qu'on a fini. */}
          <p className="text-xs text-gray-400 mt-1">
            {t.progress.chaptersWhole} : {comptage.entiers}
          </p>
          <p className="text-xs text-gray-400">{t.progress.booksStarted(uniqueBooks)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-xs uppercase tracking-wider text-gray-500">{t.progress.dailyGoal}</span>
          </div>
          {goalProgress.cible > 0 ? (
            <>
              <p className="text-3xl font-bold text-green-600">
                {enPourcentage
                  ? rapport(goalProgress.fait, goalProgress.cible)
                  : <>{goalProgress.fait}<span className="text-lg font-normal text-gray-400 ms-1">/ {goalProgress.cible}</span></>}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t.progress.goalUnitPeriod(t.settings.goalUnits[objectif.unite], t.settings.goalPeriods[objectif.periode])}</p>
              {nomDeLaPortee && (
                <p className="text-xs text-gray-400">{t.progress.goalScope(nomDeLaPortee)}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">{t.progress.noGoal}</p>
          )}
        </div>
      </div>

      {/* Goal progress ring */}
      {goalProgress.cible > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="#16a34a" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - Math.min(1, goalProgress.fait / goalProgress.cible))}`}
                  strokeLinecap="round" className="transition-[stroke-dashoffset] duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {goalProgress.fait >= goalProgress.cible ? <Sparkles className="w-6 h-6 text-yellow-500" /> : <Target className="w-6 h-6 text-green-600" />}
              </div>
            </div>
            <div>
              <p className="font-semibold">
                {goalProgress.fait >= goalProgress.cible ? t.progress.goalReached : t.progress.goalAlmost}
              </p>
              <p className="text-sm text-gray-500">
                {enPourcentage
                  ? rapport(goalProgress.fait, goalProgress.cible)
                  : t.progress.goalToday(goalProgress.fait, goalProgress.cible, objectif.unite, t.settings.goalPeriods[objectif.periode])}
              </p>
              {/* Sans cette mention, un objectif restreint à un livre affiche
                  un compte plus bas que l'écran voisin, et rien ne le dit. */}
              {nomDeLaPortee && (
                <p className="text-xs text-gray-400 mt-0.5">{t.progress.goalScope(nomDeLaPortee)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/*
        La légende, une fois et en tête : sans elle, la rayure serait un motif
        décoratif que rien n'explique. Elle porte des pastilles et non du
        texte coloré — c'est la distinction elle-même qu'il faut montrer, et
        `--teinte` y est posée à la main puisque ces deux pastilles ne sont pas
        des barres.
      */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[--text-secondary] mb-3">
        {/*
          Les pastilles portent `barre-lecture` pour hériter de `--teinte`, et
          la paire claire/sombre est posée à la main : `--primary` ne tient que
          1,27 sur la piste en mode sombre, et la légende aurait disparu là où
          les barres, elles, restent visibles.
        */}
        <span
          className="barre-lecture inline-flex items-center gap-1.5"
          style={{ '--teinte-claire': 'var(--primary)', '--teinte-sombre': 'var(--primary-clair)' } as CSSProperties}
        >
          <span className="w-4 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--teinte)' }} />
          {t.progress.legendeEntiers}
        </span>
        <span
          className="barre-lecture inline-flex items-center gap-1.5"
          style={{ '--teinte-claire': 'var(--primary)', '--teinte-sombre': 'var(--primary-clair)' } as CSSProperties}
        >
          <span
            className="w-4 h-2.5 rounded-sm"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--teinte) 0 4px, '
                + 'color-mix(in srgb, var(--teinte) 28%, transparent) 4px 8px)',
            }}
          />
          {t.progress.legendeEntames}
        </span>
      </div>

      {/* Testaments — deux cartes courtes, même raison que la grille du haut. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-5 h-5 text-amber-700" />
            <h2 className="font-semibold">{t.progress.oldTestament}</h2>
          </div>
          <BarreLecture
            entames={ancienTestament.entames} entiers={ancienTestament.entiers}
            total={otTotal} couleur="#d97706" hauteur="h-4"
            libelle={t.progress.oldTestament}
          />
          <p className="text-xs text-gray-500 mt-1">
            {enPourcentage
              ? rapport(ancienTestament.entames, otTotal)
              : t.progress.chaptersOfTotal(ancienTestament.entames, otTotal)}
          </p>
          <p className="text-xs text-[--text-secondary]">{t.progress.dontEntiers(ancienTestament.entiers)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">{t.progress.newTestament}</h2>
          </div>
          <BarreLecture
            entames={nouveauTestament.entames} entiers={nouveauTestament.entiers}
            total={ntTotal} couleur="#2563eb" hauteur="h-4"
            libelle={t.progress.newTestament}
          />
          <p className="text-xs text-gray-500 mt-1">
            {enPourcentage
              ? rapport(nouveauTestament.entames, ntTotal)
              : t.progress.chaptersOfTotal(nouveauTestament.entames, ntTotal)}
          </p>
          <p className="text-xs text-[--text-secondary]">{t.progress.dontEntiers(nouveauTestament.entiers)}</p>
        </div>
      </div>

      {/* Contextes */}
      {byContext.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[--primary]" />
            {t.progress.byContext}
          </h2>
          <div className="space-y-3">
            {byContext.map((c) => (
              <div key={c.id || "none"}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">
                    <span aria-hidden="true">{c.emoji} </span>{c.name}
                  </span>
                  {/*
                    Un contexte n'a pas de total à lui : sa part se rapporte donc
                    à l'ensemble des chapitres lus, et non à la Bible entière.
                    « 62 sur 111 lus » se lit ; « 62 sur 1 189 » dirait autre chose.
                  */}
                  <span className="text-gray-500">
                    {enPourcentage ? rapport(c.chapters, chapterCount) : t.progress.chapterCount(c.chapters)}
                  </span>
                </div>
                <div className="h-3 bg-[--piste] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-500 remplissage-teinte"
                    style={{ width: `${c.share}%`, ...teintesDe(c.color) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[--primary]" />
          {t.progress.byCategory}
        </h2>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{t.bibleCategories[cat.id] ?? cat.name}</span>
                <span className="text-gray-500">{rapport(cat.readChapters, cat.totalChapters)}</span>
              </div>
              {/*
                Le vert ne vient plus des chapitres entamés mais des entiers :
                une catégorie « finie » dont aucun chapitre n'est achevé serait
                un mensonge, et c'est ce que la barre disait jusqu'ici.
              */}
              <BarreLecture
                entames={cat.readChapters} entiers={cat.entiers}
                total={cat.totalChapters}
                couleur={cat.entiers >= cat.totalChapters ? "#16a34a" : "#4a90d9"}
                libelle={t.bibleCategories[cat.id] ?? cat.name}
              />
              {cat.entiers > 0 && (
                <p className="text-xs text-[--text-secondary] mt-0.5">{t.progress.dontEntiers(cat.entiers)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          {t.progress.achievements}
          <span className="text-xs text-gray-400 font-normal ml-auto">{badges.filter((b) => b.unlocked).length}/{badges.length}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/*
            `bg-yellow-50` n'est pas remappé en mode sombre — le bloc `html.dark`
            ne réécrit que les gris (règle 15). Le nom héritait donc de `--text`,
            presque blanc : contraste 1,06. La description, elle, était illisible
            dans les *deux* thèmes, `text-gray-400` sur ce fond ne donnant que
            2,45. Les deux couleurs sont désormais posées explicitement.
          */}
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.id} className={`rounded-xl border p-3 text-center transition-colors ${badge.unlocked ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50 opacity-50"}`}>
                <div className={`flex justify-center mb-1 ${badge.unlocked ? "" : "grayscale"}`}>
                  <Icon className={`w-7 h-7 ${badge.unlocked ? "text-yellow-500" : "text-gray-400"}`} />
                </div>
                <p className={`text-xs font-semibold ${badge.unlocked ? "text-yellow-900" : ""}`}>{t.progress.badges[badge.id].name}</p>
                <p className={`text-[10px] mt-0.5 ${badge.unlocked ? "text-yellow-800" : "text-gray-400"}`}>{t.progress.badges[badge.id].description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Books */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[--primary]" />
          {t.progress.byBook}
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {booksReadList.map((b) => (
            <div key={b.book} className="flex items-center gap-3">
              <span className="text-sm w-32 shrink-0 truncate font-medium">{b.name}</span>
              <BarreLecture
                entames={b.readChapters} entiers={b.entiers} total={b.totalChapters}
                couleur={b.entiers >= b.totalChapters ? "#22c55e" : "#3b82f6"}
                className="flex-1"
                libelle={`${b.name} — ${t.progress.dontEntiers(b.entiers)}`}
              />
              {/* `text-end` et non `text-right` : l'arabe renverse la ligne. */}
              <span className="text-xs text-gray-500 w-16 text-end shrink-0">{rapport(b.readChapters, b.totalChapters)}</span>
            </div>
          ))}
          {/* Était une chaîne française en dur, restée telle dans les quatre
                  autres langues — règle 10, trouvée en reprenant ce bloc. */}
              {booksReadList.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{t.progress.noReadings}</p>}
        </div>
      </div>
    </div>
  );
}
