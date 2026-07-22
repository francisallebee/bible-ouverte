import type { ReadingPlan, PlanDay } from './types';
import { getBookName } from '@/features/bible';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function getDurationLabel(plan: ReadingPlan): string {
  if (plan.duration === "custom") return `${plan.customDays ?? plan.totalDays} jours`;
  const labels: Record<string, string> = {
    "1-year": "1 an",
    "6-months": "6 mois",
    "3-months": "3 mois",
    "1-month": "1 mois",
  };
  return labels[plan.duration] ?? `${plan.totalDays} jours`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPlanCSV(plan: ReadingPlan, days: PlanDay[]) {
  const lines = [
    `# ${plan.name}`,
    `# Durée: ${getDurationLabel(plan)} - Début: ${plan.startDate}`,
    "# Jour;Date;Livre;Chapitre début;Chapitre fin;Lu",
  ];
  for (const d of days) {
    lines.push(
      `${d.day};${d.date};${getBookName(d.book)};${d.chapterStart};${d.chapterEnd};${d.isRead ? "Oui" : "Non"}`,
    );
  }
  downloadBlob(lines.join("\n"), `plan-${plan.name.toLowerCase().replace(/\s+/g, "-")}.csv`, "text/csv;charset=utf-8");
}

export function exportPlanMarkdown(plan: ReadingPlan, days: PlanDay[]) {
  const lines: string[] = [
    `# ${plan.name}`,
    "",
    `**Durée :** ${getDurationLabel(plan)}`,
    `**Début :** ${plan.startDate}`,
    `**Progression :** ${days.filter((d) => d.isRead).length}/${days.length}`,
    "",
    "## Jours de lecture",
    "",
    "| Jour | Date | Livre | Chapitres | Lu |",
    "|------|------|-------|-----------|-----|",
  ];
  for (const d of days) {
    const ref = d.chapterEnd !== d.chapterStart
      ? `${d.chapterStart}-${d.chapterEnd}`
      : `${d.chapterStart}`;
    lines.push(`| ${d.day} | ${d.date} | ${getBookName(d.book)} | ${ref} | ${d.isRead ? "✅" : "⬜"} |`);
  }
  downloadBlob(lines.join("\n"), `plan-${plan.name.toLowerCase().replace(/\s+/g, "-")}.md`, "text/markdown;charset=utf-8");
}

export function exportPlanJSON(plan: ReadingPlan, days: PlanDay[]) {
  const data = { plan, days };
  downloadBlob(JSON.stringify(data, null, 2), `plan-${plan.name.toLowerCase().replace(/\s+/g, "-")}.json`, "application/json");
}

export function exportPlanHTML(plan: ReadingPlan, days: PlanDay[]) {
  const rows = days.map((d) => {
    const ref = d.chapterEnd !== d.chapterStart
      ? `${d.chapterStart}-${d.chapterEnd}`
      : `${d.chapterStart}`;
    const checked = d.isRead ? "✅" : "⬜";
    return `<tr><td>${d.day}</td><td>${d.date}</td><td>${getBookName(d.book)}</td><td>${ref}</td><td>${checked}</td></tr>`;
  }).join("\n");

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${plan.name}</title>
<style>body{font-family:sans-serif;max-width:700px;margin:2rem auto;padding:0 1rem}
table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;border:1px solid #ddd;text-align:left}
th{background:#1e3a5f;color:#fff}h1{color:#1e3a5f}.progress{height:20px;background:#eee;border-radius:10px;overflow:hidden;margin:1rem 0}
.progress-bar{height:100%;background:#1e3a5f;border-radius:10px;transition:width .5s}</style></head>
<body><h1>${plan.name}</h1>
<p><strong>Durée :</strong> ${getDurationLabel(plan)} — <strong>Début :</strong> ${plan.startDate}</p>
<p><strong>Progression :</strong> ${days.filter(d => d.isRead).length}/${days.length}</p>
<div class="progress"><div class="progress-bar" style="width:${days.length > 0 ? (days.filter(d => d.isRead).length / days.length * 100) : 0}%"></div></div>
<table><thead><tr><th>Jour</th><th>Date</th><th>Livre</th><th>Chapitres</th><th>Lu</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;

  downloadBlob(html, `plan-${plan.name.toLowerCase().replace(/\s+/g, "-")}.html`, "text/html;charset=utf-8");
}

export function exportPlanPDF(plan: ReadingPlan, days: PlanDay[]) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text(plan.name, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Durée : ${getDurationLabel(plan)} — Début : ${plan.startDate}`, 14, 30);
  const readCount = days.filter((d) => d.isRead).length;
  doc.text(`Progression : ${readCount}/${days.length} (${days.length > 0 ? Math.round((readCount / days.length) * 100) : 0}%)`, 14, 36);

  // progress bar
  const barX = 14, barY = 42, barW = 180, barH = 6;
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(barX, barY, barW, barH, 3, 3, 'F');
  if (days.length > 0) {
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(barX, barY, barW * (readCount / days.length), barH, 3, 3, 'F');
  }

  const tableData = days.map((d) => {
    const ref = d.chapterEnd !== d.chapterStart ? `${d.chapterStart}-${d.chapterEnd}` : `${d.chapterStart}`;
    return [String(d.day), d.date, getBookName(d.book), ref, d.isRead ? "Oui" : "Non"];
  });

  (doc as any).autoTable({
    startY: 55,
    head: [['Jour', 'Date', 'Livre', 'Chapitres', 'Lu']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 55 },
  });

  doc.save(`plan-${plan.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
