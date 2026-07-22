import { BOOKS } from '@/features/bible';
import type { PlanDuration } from './types';

interface RawDay {
  day: number;
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
}

export function generatePlanDays(
  duration: PlanDuration,
  startDate: string,
  customDays?: number,
  customBooks?: string[],
): RawDay[] {
  const durationDays: Record<string, number> = {
    "1-year": 365,
    "6-months": 182,
    "3-months": 91,
    "1-month": 30,
    "custom": customDays ?? 30,
  };

  const totalDays = durationDays[duration];

  const selectedBooks = customBooks && customBooks.length > 0
    ? BOOKS.filter((b) => customBooks.includes(b.abbreviation))
    : BOOKS;

  const totalChapters = selectedBooks.reduce((sum, b) => sum + b.chapters, 0);
  const chaptersPerDay = Math.ceil(totalChapters / totalDays);

  const assignments: { book: string; chapter: number }[] = [];
  for (const book of selectedBooks) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      assignments.push({ book: book.abbreviation, chapter: ch });
    }
  }

  const days: RawDay[] = [];
  const start = new Date(startDate);

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);

    const startIdx = d * chaptersPerDay;
    const endIdx = Math.min(startIdx + chaptersPerDay - 1, assignments.length - 1);

    if (startIdx >= assignments.length) break;

    const first = assignments[startIdx];
    const last = assignments[endIdx];

    if (first.book !== last.book) {
      days.push({
        day: d + 1,
        date: dateStr,
        book: first.book,
        chapterStart: first.chapter,
        chapterEnd: first.chapter,
      });
    } else {
      days.push({
        day: d + 1,
        date: dateStr,
        book: first.book,
        chapterStart: first.chapter,
        chapterEnd: last.chapter,
      });
    }
  }

  return days;
}
