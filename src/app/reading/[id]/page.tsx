"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, X, Play, Square } from "lucide-react";
import {
  seedIfNeeded,
  getReadingById,
  getAllVersions,
  getAllContexts,
  getPassagesByRange,
  getPassages,
  updateReading,
  deleteReading,
} from "@/lib/storage";
import type { ReadingEntry, BibleVersion, BiblePassage, ReadingContext } from "@/lib/storage";

import { getBook } from "@/features/bible";
import { versetsAProposer } from "@/features/bible/versets";
import { useI18n, useBookName, useBooks, useContextName } from "@/contexts/I18nContext";
import { formatDate } from "@/lib/i18n/format";
import { textDirection } from "@/lib/i18n/locales";
import ContextPicker from "@/components/ContextPicker";

export default function ReadingDetailPage() {
  const { t, locale } = useI18n();
  const getBookName = useBookName();
  const books = useBooks();
  const contextName = useContextName();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [reading, setReading] = useState<ReadingEntry | undefined>();
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [passages, setPassages] = useState<BiblePassage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [editDate, setEditDate] = useState("");
  const [editBook, setEditBook] = useState("");
  const [editChapterStart, setEditChapterStart] = useState(1);
  const [editChapterEnd, setEditChapterEnd] = useState<number>(1);
  const [editVerseStart, setEditVerseStart] = useState(1);
  const [editVerseEnd, setEditVerseEnd] = useState<number>(1);
  const [editVersionId, setEditVersionId] = useState("");
  const [editContextId, setEditContextId] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [r, vers, ctxs] = await Promise.all([
        getReadingById(id),
        getAllVersions(),
        getAllContexts(),
      ]);
      if (!r) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      setReading(r);
      setVersions(vers);
      setContexts(ctxs);

      const results: BiblePassage[] = [];
      for (let ch = r.chapterStart; ch <= r.chapterEnd; ch++) {
        const vs = ch === r.chapterStart ? r.verseStart : 1;
        const ve = ch === r.chapterEnd ? r.verseEnd : 999;
        const chPassages = await getPassagesByRange(r.translationId, r.book, ch, vs, ve);
        results.push(...chPassages);
      }
      setPassages(results);

      setLoaded(true);
    })();
  }, [id]);

  const versionMap = useMemo(() => {
    const m: Record<string, BibleVersion> = {};
    for (const v of versions) m[v.id] = v;
    return m;
  }, [versions]);

  /**
   * Versions proposées à l'édition : les versions actives, plus celle de la
   * lecture si elle a été désactivée depuis. Sans quoi le menu s'ouvrirait sur
   * un choix vide et changerait la version à l'insu de l'utilisateur.
   */
  const selectableVersions = useMemo(() => {
    const enabled = versions.filter((v) => v.isEnabled);
    if (!editVersionId || enabled.some((v) => v.id === editVersionId)) return enabled;
    const current = versions.find((v) => v.id === editVersionId);
    return current ? [current, ...enabled] : enabled;
  }, [versions, editVersionId]);

  function enterEditMode() {
    if (!reading) return;
    setEditDate(reading.date.slice(0, 10));
    setEditBook(reading.book);
    setEditChapterStart(reading.chapterStart);
    setEditChapterEnd(reading.chapterEnd);
    setEditVerseStart(reading.verseStart);
    setEditVerseEnd(reading.verseEnd);
    setEditVersionId(reading.translationId);
    setEditContextId(reading.contextId ?? "");
    setEditNotes(reading.notes);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!reading) return;
    await updateReading(id, {
      date: editDate,
      book: editBook,
      chapterStart: editChapterStart,
      chapterEnd: editChapterEnd,
      verseStart: editVerseStart,
      verseEnd: editVerseEnd,
      translationId: editVersionId,
      contextId: editContextId,
      notes: editNotes,
    });
    setIsEditing(false);
    const updated = await getReadingById(id);
    if (updated) {
      setReading(updated);
      const results: BiblePassage[] = [];
      for (let ch = updated.chapterStart; ch <= updated.chapterEnd; ch++) {
        const vs = ch === updated.chapterStart ? updated.verseStart : 1;
        const ve = ch === updated.chapterEnd ? updated.verseEnd : 999;
        const chPassages = await getPassagesByRange(updated.translationId, updated.book, ch, vs, ve);
        results.push(...chPassages);
      }
      setPassages(results);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t.readingDetail.confirmDelete)) return;
    await deleteReading(id);
    router.push("/history");
  }

  if (!loaded) {
    return <p className="text-gray-500">{t.common.loading}</p>;
  }

  if (notFound || !reading) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">{t.readingDetail.notFound}</h1>
        <Link href="/history" className="text-[--primary] underline">
          {t.readingDetail.backToHistory}
        </Link>
      </div>
    );
  }

  const version = versionMap[reading.translationId];
  const context = reading.contextId
    ? contexts.find((c) => c.id === reading.contextId)
    : undefined;
  const selectedBook = getBook(editBook);
  const maxChapters = selectedBook?.chapters ?? 150;
  // Cet écran est resté aux listes déroulantes, et il portait donc le même
  // `200` en dur que `PassagePicker` avant le ticket 25 — c'est même lui qui a
  // écrit les « Psaumes 1:1-200 » que la base garde. Il n'interroge pas le
  // cache : la versification de référence suffit à ne plus proposer un numéro
  // qui n'existe nulle part, et la valeur enregistrée reste toujours dans la
  // liste, faute de quoi on ne pourrait plus la corriger.
  const dernierPremierVerset = versetsAProposer(editBook, editChapterStart, undefined, editVerseStart);
  const dernierDernierVerset = versetsAProposer(editBook, editChapterEnd, undefined, editVerseEnd);

  function renderReference(book: string, chStart: number, chEnd: number, vStart: number, vEnd: number) {
    return (
      <>
        {getBookName(book)} {chStart}
        {chEnd !== chStart ? `-${chEnd}` : ""}:{vStart}
        {vEnd !== vStart ? `-${vEnd}` : ""}
      </>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? t.readingDetail.editTitle : t.readingDetail.detailTitle}
        </h1>
        <Link
          href="/history"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {t.common.back}
        </Link>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">{t.readingDetail.date}</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.readingDetail.book}</label>
            <select
              value={editBook}
              onChange={(e) => {
                setEditBook(e.target.value);
                setEditChapterStart(1);
                setEditChapterEnd(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {books.map((b) => (
                <option key={b.abbreviation} value={b.abbreviation}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.readingDetail.chapterStart}</label>
              <select value={editChapterStart} onChange={(e) => setEditChapterStart(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.readingDetail.chapterEnd}</label>
              <select value={editChapterEnd} onChange={(e) => setEditChapterEnd(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: maxChapters - (editChapterStart - 1) }, (_, i) => i + editChapterStart).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.readingDetail.verseStart}</label>
              <select value={editVerseStart} onChange={(e) => setEditVerseStart(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: dernierPremierVerset }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.readingDetail.verseEnd}</label>
              <select value={editVerseEnd} onChange={(e) => setEditVerseEnd(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: Math.max(0, dernierDernierVerset - (editVerseStart - 1)) }, (_, i) => i + editVerseStart).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t.readingDetail.version}</label>
            <select
              value={editVersionId}
              onChange={(e) => setEditVersionId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {selectableVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-context" className="block text-sm font-medium mb-1">Contexte</label>
            <ContextPicker
              id="edit-context"
              contexts={contexts}
              value={editContextId}
              onChange={setEditContextId}
              onContextAdded={(created) => setContexts((prev) => [...prev, created])}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-[--primary] text-white px-6 py-2 rounded-lg text-sm hover:bg-[--primary-hover]"
            >
              {t.readingDetail.saveEdit}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-100"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">
                {formatDate(locale, reading.date, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {renderReference(
                reading.book,
                reading.chapterStart,
                reading.chapterEnd,
                reading.verseStart,
                reading.verseEnd,
              )}
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-gray-500 mb-4">
              <span>{t.readingDetail.versionLabel(version?.name ?? reading.translationId)}</span>
              {context && (
                <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
                  <span aria-hidden="true">{context.emoji} </span>{contextName(context)}
                </span>
              )}
            </div>

            {reading.notes && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">{t.readingDetail.notes}</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {reading.notes}
                </p>
              </div>
            )}

            {reading.links && reading.links.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-blue-500" /> {t.readingDetail.links}
                </p>
                <div className="space-y-1.5">
                  {reading.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 no-underline">
                      <ExternalLink className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-medium text-gray-800 truncate">{link.title}</span>
                      <span className="text-xs text-gray-400 truncate flex-1">{link.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {reading.audio && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">🎵 {t.readingDetail.audio}</p>
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <audio ref={audioRef} src={reading.audio} onEnded={() => setAudioPlaying(false)} />
                  <button onClick={() => {
                    if (audioPlaying) { audioRef.current?.pause(); setAudioPlaying(false); }
                    else { audioRef.current?.play(); setAudioPlaying(true); }
                  }} aria-label={audioPlaying ? t.readingDetail.pause : t.readingDetail.play} className="text-purple-700">
                    {audioPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <span className="text-sm text-gray-600">{t.readingDetail.audioAttached}</span>
                </div>
              </div>
            )}

            {reading.photos && reading.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  📷 {t.readingDetail.photos}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {reading.photos.map((photo, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-gray-200 aspect-video">
                      <img src={photo} alt="" width="640" height="640" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">{t.readingDetail.bibleText}</h3>
            {passages.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {t.readingDetail.textUnavailable}
              </p>
            ) : (
              // Le sens d'écriture suit la version lue, pas l'interface.
              <div
                className="texte-biblique text-sm leading-relaxed"
                dir={textDirection(version?.language ?? "fr")}
              >
                {passages.map((p) => (
                  <p key={`${p.chapter}-${p.verse}`} className="mb-1">
                    <sup className="text-xs text-gray-400 me-1">
                      {p.chapter !== reading.chapterStart ||
                      p.verse !== reading.verseStart
                        ? `${p.chapter}:${p.verse}`
                        : p.verse}
                    </sup>
                    {p.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!isEditing && (
        <div className="flex gap-3">
          <button
            onClick={enterEditMode}
            className="bg-[--primary] text-white px-6 py-2 rounded-lg text-sm hover:bg-[--primary-hover]"
          >
            {t.common.edit}
          </button>
          <button
            onClick={handleDelete}
            className="border border-red-300 text-red-600 px-6 py-2 rounded-lg text-sm hover:bg-red-50"
          >
            {t.common.delete}
          </button>
        </div>
      )}
    </div>
  );
}
