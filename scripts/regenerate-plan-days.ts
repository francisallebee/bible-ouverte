/**
 * Reprise des plans de lecture créés avant la correction du générateur.
 *
 * L'ancien algorithme sautait les chapitres dès qu'une journée chevauchait deux
 * livres : un plan « Bible en 1 an » ne couvrait que 1036 des 1189 chapitres et
 * s'arrêtait au 298e jour. Les plans déjà enregistrés gardent ces jours erronés,
 * la correction ne s'appliquant qu'à la génération.
 *
 * Ce script régénère leurs jours avec le générateur corrigé — celui que
 * couvrent les tests — et reporte la progression déjà acquise.
 *
 *   npx tsx scripts/regenerate-plan-days.ts           # simulation
 *   npx tsx scripts/regenerate-plan-days.ts --apply   # écriture
 *
 * Nécessite NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (.env.local).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { generatePlanDays } from '../src/lib/storage/plan-generator';
import type { PlanDuration } from '../src/lib/storage/types';

// -- Configuration -----------------------------------------------------------

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const supabase = createClient(url, key, { auth: { persistSession: false } });

// -- Types -------------------------------------------------------------------

interface PlanRow {
  id: number;
  user_id: string;
  name: string;
  duration: PlanDuration;
  customDays: number | null;
  startDate: string;
  totalDays: number;
  books: string;
}

interface DayRow {
  id: number;
  day: number;
  book: string;
  chapterStart: number;
  chapterEnd: number;
  isRead: boolean;
  readingId: number | null;
}

/** Deux plages de chapitres d'un même livre se recouvrent-elles ? */
function overlaps(a: { book: string; chapterStart: number; chapterEnd: number },
                  b: { book: string; chapterStart: number; chapterEnd: number }): boolean {
  return a.book === b.book && a.chapterStart <= b.chapterEnd && b.chapterStart <= a.chapterEnd;
}

function coveredChapters(days: { book: string; chapterStart: number; chapterEnd: number }[]): Set<string> {
  const out = new Set<string>();
  for (const d of days) {
    for (let c = d.chapterStart; c <= d.chapterEnd; c++) out.add(`${d.book} ${c}`);
  }
  return out;
}

// -- Reprise -----------------------------------------------------------------

async function main() {
  console.log(APPLY ? '=== ÉCRITURE ===\n' : '=== SIMULATION (--apply pour écrire) ===\n');

  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, user_id, name, duration, "customDays", "startDate", "totalDays", books')
    .order('id');
  if (error) throw error;

  for (const plan of (plans ?? []) as PlanRow[]) {
    const { data: oldDaysRaw, error: daysErr } = await supabase
      .from('plan_days')
      .select('id, day, book, "chapterStart", "chapterEnd", "isRead", "readingId"')
      .eq('plan_id', plan.id)
      .order('day');
    if (daysErr) throw daysErr;

    const oldDays = (oldDaysRaw ?? []) as DayRow[];
    const readDays = oldDays.filter((d) => d.isRead);

    let books: string[] | undefined;
    try {
      const parsed = JSON.parse(plan.books || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) books = parsed;
    } catch { /* books mal formé : plan sur toute la Bible */ }

    const newDays = generatePlanDays(
      plan.duration,
      plan.startDate,
      plan.customDays ?? undefined,
      books,
    );

    const before = coveredChapters(oldDays);
    const after = coveredChapters(newDays);

    console.log(`Plan ${plan.id} — « ${plan.name} » (${plan.duration}, départ ${plan.startDate})`);
    console.log(`  jours      : ${oldDays.length} -> ${newDays.length}`);
    console.log(`  chapitres  : ${before.size} -> ${after.size}`);
    console.log(`  progression: ${readDays.length} jour(s) lu(s) à reporter`);

    if (after.size < before.size) {
      console.log('  IGNORÉ : la régénération réduirait la couverture.\n');
      continue;
    }
    if (newDays.length === oldDays.length && after.size === before.size) {
      console.log('  déjà à jour, rien à faire.\n');
      continue;
    }

    // Report de la progression : un nouveau jour est marqué lu si sa plage
    // recoupe celle d'un ancien jour lu. L'identifiant de lecture n'est repris
    // que pour une correspondance exacte, afin de ne jamais rattacher une
    // lecture existante à des chapitres qu'elle ne couvre pas.
    const rows = newDays.map((d) => {
      const exact = readDays.find(
        (r) => r.book === d.book && r.chapterStart === d.chapterStart && r.chapterEnd === d.chapterEnd,
      );
      const touching = exact ?? readDays.find((r) => overlaps(r, d));
      return {
        plan_id: plan.id,
        user_id: plan.user_id,
        day: d.day,
        date: d.date,
        book: d.book,
        chapterStart: d.chapterStart,
        chapterEnd: d.chapterEnd,
        isRead: Boolean(touching),
        readingId: exact?.readingId ?? null,
      };
    });

    const reported = rows.filter((r) => r.isRead).length;
    console.log(`  reportés   : ${reported} jour(s) marqué(s) lu(s)`);

    if (!APPLY) {
      console.log('  (simulation, rien écrit)\n');
      continue;
    }

    const { error: delErr } = await supabase.from('plan_days').delete().eq('plan_id', plan.id);
    if (delErr) throw delErr;

    // Par lots : 365 lignes en une requête passent, mais un plan long pourrait
    // dépasser la limite de taille de requête PostgREST.
    for (let i = 0; i < rows.length; i += 200) {
      const { error: insErr } = await supabase.from('plan_days').insert(rows.slice(i, i + 200));
      if (insErr) throw insErr;
    }

    const { error: upErr } = await supabase
      .from('plans')
      .update({ totalDays: newDays.length, updatedAt: new Date().toISOString() })
      .eq('id', plan.id);
    if (upErr) throw upErr;

    console.log('  écrit.\n');
  }

  console.log('Terminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
