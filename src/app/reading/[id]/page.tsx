"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, X, Play, Square } from "lucide-react";
import {
  seedIfNeeded,
  getReadingById,
  getAllContexts,
  getAllVersions,
  getPassagesByRange,
  getPassages,
  updateReading,
  deleteReading,
} from "@/lib/storage";
import type { ReadingEntry, ReadingContext, BibleVersion, BiblePassage } from "@/lib/storage";
import { FLAT_TAGS } from "@/lib/storage/seed";
import { BOOKS, getBookName, getBook } from "@/features/bible";

export default function ReadingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [reading, setReading] = useState<ReadingEntry | undefined>();
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
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
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [r, ctxs, vers] = await Promise.all([
        getReadingById(id),
        getAllContexts(),
        getAllVersions(),
      ]);
      if (!r) {
        setNotFound(true);
        setLoaded(true);
        return;
      }
      setReading(r);
      setContexts(ctxs);
      setVersions(vers);

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

  const contextMap = useMemo(() => {
    const m: Record<string, ReadingContext> = {};
    for (const c of contexts) m[c.id] = c;
    return m;
  }, [contexts]);

  const versionMap = useMemo(() => {
    const m: Record<string, BibleVersion> = {};
    for (const v of versions) m[v.id] = v;
    return m;
  }, [versions]);

  function enterEditMode() {
    if (!reading) return;
    setEditDate(reading.date.slice(0, 10));
    setEditBook(reading.book);
    setEditChapterStart(reading.chapterStart);
    setEditChapterEnd(reading.chapterEnd);
    setEditVerseStart(reading.verseStart);
    setEditVerseEnd(reading.verseEnd);
    setEditVersionId(reading.translationId);
    setEditTags(reading.tags ?? []);
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
      tags: editTags,
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
    if (!window.confirm("Supprimer cette lecture ?")) return;
    await deleteReading(id);
    router.push("/history");
  }

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  if (notFound || !reading) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Lecture introuvable</h1>
        <Link href="/history" className="text-[#1e3a5f] underline">
          Retour à l&apos;historique
        </Link>
      </div>
    );
  }

  const tagsList = reading.tags?.map(t => contextMap[t]).filter(Boolean) ?? [];
  const version = versionMap[reading.translationId];
  const selectedBook = getBook(editBook);
  const maxChapters = selectedBook?.chapters ?? 150;

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
          {isEditing ? "Modifier la lecture" : "Détail de la lecture"}
        </h1>
        <Link
          href="/history"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Retour
        </Link>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Livre</label>
            <select
              value={editBook}
              onChange={(e) => {
                setEditBook(e.target.value);
                setEditChapterStart(1);
                setEditChapterEnd(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {BOOKS.map((b) => (
                <option key={b.abbreviation} value={b.abbreviation}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chapitre début</label>
              <select value={editChapterStart} onChange={(e) => setEditChapterStart(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chapitre fin</label>
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
              <label className="block text-sm font-medium mb-1">Verset début</label>
              <select value={editVerseStart} onChange={(e) => setEditVerseStart(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 200 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Verset fin</label>
              <select value={editVerseEnd} onChange={(e) => setEditVerseEnd(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 200 - (editVerseStart - 1) }, (_, i) => i + editVerseStart).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Version</label>
            <select
              value={editVersionId}
              onChange={(e) => setEditVersionId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {FLAT_TAGS.map(t => {
                const active = editTags.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => {
                    setEditTags(prev => active ? prev.filter(x => x !== t.id) : [...prev, t.id])
                  }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <span>{t.emoji}</span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
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
              className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#2a4f7a]"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400">
                {new Date(reading.date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {reading.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {reading.tags.map(t => {
                    const ft = FLAT_TAGS.find(x => x.id === t);
                    return (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                        {ft?.emoji} {ft?.name || t}
                      </span>
                    );
                  })}
                </div>
              )}
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

            <div className="text-sm text-gray-500 mb-4">
              Version : {version?.name ?? reading.translationId}
            </div>

            {reading.notes && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {reading.notes}
                </p>
              </div>
            )}

            {reading.links && reading.links.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-blue-500" /> Liens
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
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">🎵 Audio</p>
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <audio ref={audioRef} src={reading.audio} onEnded={() => setAudioPlaying(false)} />
                  <button onClick={() => {
                    if (audioPlaying) { audioRef.current?.pause(); setAudioPlaying(false); }
                    else { audioRef.current?.play(); setAudioPlaying(true); }
                  }} className="text-purple-700">
                    {audioPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <span className="text-sm text-gray-600">Audio joint</span>
                </div>
              </div>
            )}

            {reading.photos && reading.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  📷 Photos
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {reading.photos.map((photo, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-gray-200 aspect-video">
                      <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Texte biblique</h3>
            {passages.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Texte non disponible pour cette référence avec la version
                sélectionnée.
              </p>
            ) : (
              <div className="text-sm leading-relaxed">
                {passages.map((p) => (
                  <p key={`${p.chapter}-${p.verse}`} className="mb-1">
                    <sup className="text-xs text-gray-400 mr-1">
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
            className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#2a4f7a]"
          >
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="border border-red-300 text-red-600 px-6 py-2 rounded-lg text-sm hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
