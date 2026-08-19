"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Trophy, Flame, BookOpen, Target, BarChart3, Star, Award,
  ScrollText, BookMarked, Sparkles, Gem, Layers,
} from "lucide-react";
import {
  seedIfNeeded, getAllReadings, getSettings, getAllContexts,
} from "@/lib/storage";
import type { ReadingEntry, AppSettings, ReadingContext } from "@/lib/storage";
import { BOOKS } from "@/features/bible";
import {
  normaliserObjectif, progressionDe, aujourdhui,
  calculerSeries, prochainPalier, paliersAtteints,
} from "@/lib/objectifs/objectifs";
import { useI18n, useBookName, useContextName } from "@/contexts/I18nContext";
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
  readChapters: number;
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
  const { t } = useI18n();
  const getBookName = useBookName();
  const contextName = useContextName();
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  const chapterCount = useMemo(() => {
    const chapters = new Set<string>();
    for (const r of readings) {
      for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) {
        chapters.add(`${r.book}:${ch}`);
      }
    }
    return chapters.size;
  }, [readings]);

  const uniqueBooks = useMemo(() => {
    return new Set(readings.map((r) => r.book)).size;
  }, [readings]);

  const totalBibleChapters = BOOKS.reduce((s, b) => s + b.chapters, 0);
  const booksReadList = useMemo(() => {
    const chaptersPerBook: Record<string, Set<number>> = {};
    for (const r of readings) {
      if (!chaptersPerBook[r.book]) chaptersPerBook[r.book] = new Set();
      for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) {
        chaptersPerBook[r.book].add(ch);
      }
    }
    return Object.entries(chaptersPerBook).map(([book, chapters]) => {
      const bookInfo = BOOKS.find((b) => b.abbreviation === book);
      return { book, name: getBookName(book), readChapters: chapters.size, totalChapters: bookInfo?.chapters ?? 0 };
    }).sort((a, b) => b.readChapters / Math.max(b.totalChapters, 1) - a.readChapters / Math.max(a.totalChapters, 1));
    // `getBookName` change avec la langue : sans lui ici, la liste garderait
    // les noms de la langue précédente jusqu'à la prochaine lecture.
  }, [readings, getBookName]);

  const otChapters = useMemo(() => {
    const s = new Set<string>();
    for (const r of readings) {
      if (OLD_TESTAMENT.includes(r.book)) {
        for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) s.add(`${r.book}:${ch}`);
      }
    }
    return s.size;
  }, [readings]);

  const ntChapters = useMemo(() => {
    const s = new Set<string>();
    for (const r of readings) {
      if (NEW_TESTAMENT.includes(r.book)) {
        for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) s.add(`${r.book}:${ch}`);
      }
    }
    return s.size;
  }, [readings]);

  const otTotal = useMemo(() => getCategoryChapters(OLD_TESTAMENT), []);
  const ntTotal = useMemo(() => getCategoryChapters(NEW_TESTAMENT), []);

  const categories: CategoryProgress[] = useMemo(() => {
    return BIBLE_CATEGORIES.map((cat) => {
      const s = new Set<string>();
      for (const r of readings) {
        if (cat.books.includes(r.book)) {
          for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) s.add(`${r.book}:${ch}`);
        }
      }
      return {
        id: cat.id,
        name: cat.name,
        books: cat.books,
        totalChapters: getCategoryChapters(cat.books),
        readChapters: s.size,
      };
    });
  }, [readings]);

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
  const goalProgress = useMemo(
    () => progressionDe(readings, objectif, aujourdhui()),
    [readings, objectif],
  );

  if (!loaded) return <p className="text-gray-500">{t.common.loading}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[--primary]" />
        {t.progress.title}
      </h1>

      {/* Level + Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <p className="text-xs mt-1 opacity-70">{t.progress.chaptersOf(chapterCount, level.next)}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xs uppercase tracking-wider text-gray-500">{t.progress.currentStreak}</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">{series.courante}<span className="text-lg font-normal text-gray-400 ms-1">{t.progress.days}</span></p>
          <p className="text-xs text-gray-400 mt-1">{t.progress.bestStreak(series.meilleure)}</p>

          {/* Paliers de série. La barre vise le prochain depuis la série
              courante ; les pastilles récompensent la meilleure, qu'une
              coupure ne doit pas effacer. */}
          <div className="mt-3">
            {palierSuivant !== null ? (
              <>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-[width] duration-700"
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
          <p className="text-3xl font-bold text-[--primary]">{chapterCount}<span className="text-lg font-normal text-gray-400 ml-1">/ {totalBibleChapters}</span></p>
          <p className="text-xs text-gray-400 mt-1">{t.progress.booksStarted(uniqueBooks)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-xs uppercase tracking-wider text-gray-500">{t.progress.dailyGoal}</span>
          </div>
          {goalProgress.cible > 0 ? (
            <>
              <p className="text-3xl font-bold text-green-600">{goalProgress.fait}<span className="text-lg font-normal text-gray-400 ml-1">/ {goalProgress.cible}</span></p>
              <p className="text-xs text-gray-400 mt-1">{t.progress.goalUnitPeriod(t.settings.goalUnits[objectif.unite], t.settings.goalPeriods[objectif.periode])}</p>
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
                {t.progress.goalToday(goalProgress.fait, goalProgress.cible, objectif.unite === "chapters")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Testaments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="w-5 h-5 text-amber-700" />
            <h2 className="font-semibold">{t.progress.oldTestament}</h2>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600 rounded-full transition-[width]" style={{ width: `${otTotal > 0 ? (otChapters / otTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{t.progress.chaptersOfTotal(otChapters, otTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">{t.progress.newTestament}</h2>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-[width]" style={{ width: `${ntTotal > 0 ? (ntChapters / ntTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{t.progress.chaptersOfTotal(ntChapters, ntTotal)}</p>
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
                  <span className="text-gray-500">{t.progress.chapterCount(c.chapters)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${c.share}%`, backgroundColor: c.color }} />
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
                <span className="text-gray-500">{cat.readChapters} / {cat.totalChapters}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-[width] duration-500" style={{
                  width: `${cat.totalChapters > 0 ? (cat.readChapters / cat.totalChapters) * 100 : 0}%`,
                  backgroundColor: cat.readChapters >= cat.totalChapters ? "#16a34a" : "#4a90d9",
                }} />
              </div>
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
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.id} className={`rounded-xl border p-3 text-center transition-colors ${badge.unlocked ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50 opacity-50"}`}>
                <div className={`flex justify-center mb-1 ${badge.unlocked ? "" : "grayscale"}`}>
                  <Icon className={`w-7 h-7 ${badge.unlocked ? "text-yellow-500" : "text-gray-400"}`} />
                </div>
                <p className="text-xs font-semibold">{t.progress.badges[badge.id].name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.progress.badges[badge.id].description}</p>
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
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-[width] ${b.readChapters >= b.totalChapters ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${b.totalChapters > 0 ? (b.readChapters / b.totalChapters) * 100 : 0}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right shrink-0">{b.readChapters}/{b.totalChapters}</span>
            </div>
          ))}
          {booksReadList.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune lecture pour le moment.</p>}
        </div>
      </div>
    </div>
  );
}
