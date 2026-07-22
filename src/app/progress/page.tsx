"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Trophy, Flame, BookOpen, Target, BarChart3, Star, Award,
  ScrollText, BookMarked, Sparkles, Gem,
} from "lucide-react";
import {
  seedIfNeeded, getAllReadings, getSettings,
} from "@/lib/storage";
import type { ReadingEntry, AppSettings } from "@/lib/storage";
import { BOOKS, getBookName } from "@/features/bible";
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

interface StreakInfo {
  current: number;
  longest: number;
}

function calcStreaks(readings: ReadingEntry[]): StreakInfo {
  const dates = Array.from(new Set(readings.map((r) => r.date))).sort();
  if (dates.length === 0) return { current: 0, longest: 0 };
  let current = 1;
  let longest = 1;
  let streak = 1;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastDate = dates[dates.length - 1];

  if (lastDate !== today && lastDate !== yesterday) current = 0;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  if (lastDate === today || lastDate === yesterday) {
    const revDates = [...dates].reverse();
    current = 1;
    for (let i = 1; i < revDates.length; i++) {
      const prev = new Date(revDates[i - 1]);
      const curr = new Date(revDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: typeof Star;
  unlocked: boolean;
}

function getBadges(totalChapters: number, streak: number, categoriesDone: number, totalCategories: number): Badge[] {
  return [
    { id: "first", name: "Premiers pas", description: "Lire son premier chapitre", icon: Star, unlocked: totalChapters >= 1 },
    { id: "ten", name: "Découvreur", description: "Lire 10 chapitres", icon: Star, unlocked: totalChapters >= 10 },
    { id: "fifty", name: "Explorateur", description: "Lire 50 chapitres", icon: Star, unlocked: totalChapters >= 50 },
    { id: "hundred", name: "Lecteur assidu", description: "Lire 100 chapitres", icon: Award, unlocked: totalChapters >= 100 },
    { id: "two-fifty", name: "Scribe", description: "Lire 250 chapitres", icon: Award, unlocked: totalChapters >= 250 },
    { id: "five-hundred", name: "Docteur de la Loi", description: "Lire 500 chapitres", icon: Trophy, unlocked: totalChapters >= 500 },
    { id: "thousand", name: "Prophète", description: "Lire 1000 chapitres", icon: Trophy, unlocked: totalChapters >= 1000 },
    { id: "streak-3", name: "Régulier", description: "3 jours d'affilée", icon: Flame, unlocked: streak >= 3 },
    { id: "streak-7", name: "Persévérant", description: "7 jours d'affilée", icon: Flame, unlocked: streak >= 7 },
    { id: "streak-30", name: "Inarrêtable", description: "30 jours d'affilée", icon: Flame, unlocked: streak >= 30 },
    { id: "streak-100", name: "Légende vivante", description: "100 jours d'affilée", icon: Flame, unlocked: streak >= 100 },
    { id: "category-all", name: "Canon complet", description: "Lire dans toutes les catégories", icon: Gem, unlocked: categoriesDone >= totalCategories },
    { id: "category-half", name: "Œcuménique", description: "Lire dans la moitié des catégories", icon: Gem, unlocked: categoriesDone >= Math.ceil(totalCategories / 2) },
  ];
}

function getLevel(totalChapters: number): { level: number; title: string; next: number } {
  if (totalChapters < 10) return { level: 1, title: "Apprenti lecteur", next: 10 };
  if (totalChapters < 50) return { level: 2, title: "Lecteur du dimanche", next: 50 };
  if (totalChapters < 100) return { level: 3, title: "Fidèle", next: 100 };
  if (totalChapters < 250) return { level: 4, title: "Dévoué", next: 250 };
  if (totalChapters < 500) return { level: 5, title: "Érudit", next: 500 };
  if (totalChapters < 1000) return { level: 6, title: "Théologien", next: 1000 };
  return { level: 7, title: "Maître", next: -1 };
}

export default function ProgressPage() {
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [r, s] = await Promise.all([getAllReadings(), getSettings()]);
      setReadings(r);
      setSettings(s ?? null);
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
  }, [readings]);

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
  const streaks = useMemo(() => calcStreaks(readings), [readings]);
  const badges = useMemo(() => getBadges(chapterCount, streaks.longest, categoriesWithReads, categories.length), [chapterCount, streaks.longest, categoriesWithReads, categories.length]);
  const level = useMemo(() => getLevel(chapterCount), [chapterCount]);
  const goal = settings?.readingGoal;

  const goalProgress = useMemo(() => {
    if (!goal) return null;
    const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
    const today = new Date().toISOString().slice(0, 10);
    const todayReadings = sorted.filter((r) => r.date === today);
    const todayChapters = todayReadings.reduce((sum, r) => sum + (r.chapterEnd - r.chapterStart + 1), 0);
    const todayVerses = todayReadings.reduce((sum, r) => sum + (r.verseEnd - r.verseStart + 1), 0);
    return {
      type: goal.type,
      target: goal.target,
      current: goal.type === "chapters-per-day" ? todayChapters : todayVerses,
    };
  }, [goal, readings]);

  if (!loaded) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[#1e3a5f]" />
        Ma progression
      </h1>

      {/* Level + Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7a] text-white rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-300" />
            <span className="text-xs uppercase tracking-wider opacity-80">Niveau {level.level}</span>
          </div>
          <p className="text-lg font-bold">{level.title}</p>
          {level.next > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-300 rounded-full" style={{ width: `${Math.min(100, (chapterCount / level.next) * 100)}%` }} />
              </div>
              <p className="text-xs mt-1 opacity-70">{chapterCount} / {level.next} chapitres</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-xs uppercase tracking-wider text-gray-500">Série actuelle</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">{streaks.current}<span className="text-lg font-normal text-gray-400 ml-1">jours</span></p>
          <p className="text-xs text-gray-400 mt-1">Meilleure : {streaks.longest} jours</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
            <span className="text-xs uppercase tracking-wider text-gray-500">Chapitres lus</span>
          </div>
          <p className="text-3xl font-bold text-[#1e3a5f]">{chapterCount}<span className="text-lg font-normal text-gray-400 ml-1">/ {totalBibleChapters}</span></p>
          <p className="text-xs text-gray-400 mt-1">{uniqueBooks} livre(s) entamé(s)</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-xs uppercase tracking-wider text-gray-500">Objectif du jour</span>
          </div>
          {goalProgress ? (
            <>
              <p className="text-3xl font-bold text-green-600">{goalProgress.current}<span className="text-lg font-normal text-gray-400 ml-1">/ {goalProgress.target}</span></p>
              <p className="text-xs text-gray-400 mt-1">{goalProgress.type === "chapters-per-day" ? "chapitres" : "versets"} aujourd&apos;hui</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Aucun objectif défini</p>
          )}
        </div>
      </div>

      {/* Goal progress ring */}
      {goalProgress && goalProgress.target > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="#16a34a" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - Math.min(1, goalProgress.current / goalProgress.target))}`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {goalProgress.current >= goalProgress.target ? <Sparkles className="w-6 h-6 text-yellow-500" /> : <Target className="w-6 h-6 text-green-600" />}
              </div>
            </div>
            <div>
              <p className="font-semibold">
                {goalProgress.current >= goalProgress.target ? "Objectif atteint ! 🎉" : "Encore un peu d'effort"}
              </p>
              <p className="text-sm text-gray-500">
                {goalProgress.current} / {goalProgress.target} {goalProgress.type === "chapters-per-day" ? "chapitres" : "versets"} aujourd&apos;hui
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
            <h2 className="font-semibold">Ancien Testament</h2>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: `${otTotal > 0 ? (otChapters / otTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{otChapters} / {otTotal} chapitres</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookMarked className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold">Nouveau Testament</h2>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${ntTotal > 0 ? (ntChapters / ntTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{ntChapters} / {ntTotal} chapitres</p>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
          Progression par catégorie
        </h2>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{cat.name}</span>
                <span className="text-gray-500">{cat.readChapters} / {cat.totalChapters}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{
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
          Succès &amp; Récompenses
          <span className="text-xs text-gray-400 font-normal ml-auto">{badges.filter((b) => b.unlocked).length}/{badges.length}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.id} className={`rounded-xl border p-3 text-center transition-all ${badge.unlocked ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50 opacity-50"}`}>
                <div className={`flex justify-center mb-1 ${badge.unlocked ? "" : "grayscale"}`}>
                  <Icon className={`w-7 h-7 ${badge.unlocked ? "text-yellow-500" : "text-gray-400"}`} />
                </div>
                <p className="text-xs font-semibold">{badge.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Books */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
          Détail par livre
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {booksReadList.map((b) => (
            <div key={b.book} className="flex items-center gap-3">
              <span className="text-sm w-32 shrink-0 truncate font-medium">{b.name}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${b.readChapters >= b.totalChapters ? "bg-green-500" : "bg-blue-500"}`}
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
