"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink, X, Play, Square, Link as LinkIcon, ImageIcon, Camera, Upload, Music,
} from "lucide-react";
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
import type {
  ReadingEntry, BibleVersion, BiblePassage, ReadingContext, ReadingLink,
} from "@/lib/storage";

import { getBook } from "@/features/bible";
import { versetsAProposer } from "@/features/bible/versets";
import { useI18n, useBookName, useBooks, useContextName } from "@/contexts/I18nContext";
import { formatDate } from "@/lib/i18n/format";
import { textDirection } from "@/lib/i18n/locales";
import ContextPicker from "@/components/ContextPicker";
import AudioRecorder from "@/components/AudioRecorder";
import { resizeImage } from "@/lib/image-utils";

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
  // Ce que l'écran ne savait pas modifier : le titre de séance, les liens, les
  // photos et l'audio. Une lecture s'éditait donc à moitié — on pouvait tout
  // saisir à la création, et corriger seulement une partie ensuite.
  const [editSessionTitle, setEditSessionTitle] = useState("");
  const [editLinks, setEditLinks] = useState<ReadingLink[]>([]);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editAudio, setEditAudio] = useState<string | undefined>();
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [editLinkTitle, setEditLinkTitle] = useState("");
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

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
    setEditSessionTitle(reading.sessionTitle ?? "");
    setEditLinks(reading.links ?? []);
    setEditPhotos(reading.photos ?? []);
    setEditAudio(reading.audio || undefined);
    setEditLinkUrl("");
    setEditLinkTitle("");
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
      sessionTitle: editSessionTitle.trim(),
      links: editLinks.length > 0 ? editLinks : undefined,
      photos: editPhotos.length > 0 ? editPhotos : undefined,
      audio: editAudio || undefined,
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

  function addEditLink() {
    if (!editLinkUrl.trim()) return;
    setEditLinks((prev) => [
      ...prev,
      { url: editLinkUrl.trim(), title: editLinkTitle.trim() || editLinkUrl.trim() },
    ]);
    setEditLinkUrl("");
    setEditLinkTitle("");
  }

  async function handleEditFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      setEditPhotos((prev) => [...prev, ""]);
      const dataUrl = await resizeImage(file, 640, 640);
      // Remplacer le jeton posé plus haut : deux fichiers choisis ensemble
      // arrivent dans un ordre que rien ne garantit, et un simple `push`
      // aurait pu les intervertir.
      setEditPhotos((prev) => {
        const i = prev.indexOf("");
        if (i === -1) return [...prev, dataUrl];
        const copie = [...prev];
        copie[i] = dataUrl;
        return copie;
      });
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
          <div>
            <label htmlFor="edit-session" className="block text-sm font-medium mb-1">
              {t.newReading.nameSession}
            </label>
            <input
              id="edit-session"
              type="text"
              value={editSessionTitle}
              onChange={(e) => setEditSessionTitle(e.target.value)}
              placeholder={t.newReading.nameSessionPlaceholder}
              maxLength={80}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-blue-500" /> {t.newReading.links}
            </label>
            {editLinks.length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {editLinks.map((lien, i) => (
                  <li key={i} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="flex-1 min-w-0 truncate text-sm">{lien.title}</span>
                    <button type="button" onClick={() => setEditLinks((p) => p.filter((_, j) => j !== i))}
                      aria-label={t.newReading.removeLink}
                      className="shrink-0 text-gray-500 hover:text-gray-900 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input type="text" value={editLinkTitle} onChange={(e) => setEditLinkTitle(e.target.value)}
              placeholder={t.newReading.linkTitlePlaceholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-1.5" />
            <div className="flex gap-2">
              <input type="url" value={editLinkUrl} onChange={(e) => setEditLinkUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button type="button" onClick={addEditLink} aria-label={t.newReading.addLink}
                className="shrink-0 bg-blue-500 text-white rounded-lg px-3 hover:bg-blue-600 transition-colors">
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-500" /> {t.newReading.audio}
            </label>
            <AudioRecorder value={editAudio} onChange={setEditAudio} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-green-500" /> {t.newReading.photos}
            </label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4" /> {t.newReading.camera}
              </button>
              <button type="button" onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" /> {t.newReading.gallery}
              </button>
            </div>
            {/* `capture` n'a de sens que sur le bouton Appareil : c'est lui qui
                ouvre la caméra du téléphone plutôt que le sélecteur de fichiers. */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={(e) => handleEditFiles(e.target.files)} />
            <input ref={galleryRef} type="file" accept="image/*" multiple
              className="hidden" onChange={(e) => handleEditFiles(e.target.files)} />
            {editPhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {editPhotos.filter(Boolean).map((photo, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                    <img src={photo} alt="" width="640" height="640" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setEditPhotos((p) => p.filter((_, j) => j !== i))}
                      aria-label={t.newReading.removePhoto}
                      className="absolute top-1 end-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
