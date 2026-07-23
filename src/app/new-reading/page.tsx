"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookPlus, Link as LinkIcon, ImageIcon, Camera, Upload, Search,
  X, ExternalLink, Plus, Music,
} from "lucide-react";
import {
  seedIfNeeded, getAllContexts, getAllVersions, getPassagesByRange, addReading, getSettings,
} from "@/lib/storage";
import type { ReadingContext, BibleVersion, ReadingLink, BiblePassage } from "@/lib/storage";
import { BOOKS, getBook, getBookName } from "@/features/bible";
import type { BibleBook } from "@/features/bible";
import UnsplashSearch from "@/components/UnsplashSearch";
import AudioRecorder from "@/components/AudioRecorder";
import { resizeImage } from "@/lib/image-utils";

export default function NewReadingPage() {
  const router = useRouter();
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [book, setBook] = useState("");
  const [chapterStart, setChapterStart] = useState(1);
  const [chapterEnd, setChapterEnd] = useState<number | undefined>();
  const [verseStart, setVerseStart] = useState(1);
  const [verseEnd, setVerseEnd] = useState<number | undefined>();
  const [versionId, setVersionId] = useState("");
  const [contextId, setContextId] = useState("");
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<ReadingLink[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [audio, setAudio] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const [passages, setPassages] = useState<BiblePassage[]>([]);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);

  // link form
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const selectedBook: BibleBook | undefined = getBook(book);
  const maxChapters = selectedBook?.chapters ?? 150;
  const cEnd = chapterEnd ?? chapterStart;
  const vEnd = verseEnd ?? verseStart;

  useEffect(() => {
    if (!book || !versionId || !chapterStart) {
      setPassages([]);
      return;
    }
    (async () => {
      setLoadingPassage(true);
      try {
        const results: BiblePassage[] = [];
        const cStart = chapterStart;
        const cEndVal = cEnd;
        for (let ch = cStart; ch <= cEndVal; ch++) {
          const vs = ch === cStart ? verseStart : 1;
          const ve = ch === cEndVal ? vEnd : 999;
          const chPassages = await getPassagesByRange(versionId, book, ch, vs, ve);
          results.push(...chPassages);
        }
        setPassages(results);
      } catch {
        setPassages([]);
      }
      setLoadingPassage(false);
    })();
  }, [book, versionId, chapterStart, chapterEnd, verseStart, verseEnd]);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [ctxs, vers] = await Promise.all([
        getAllContexts(),
        getAllVersions(),
      ]);
      setContexts(ctxs);
      setVersions(vers);
      if (vers.length > 0) {
        const s = await getSettings();
        setVersionId(s?.defaultVersionId || vers[0].id);
      }
      if (ctxs.length > 0) setContextId(ctxs[0].id);
      setLoaded(true);
    })();
  }, []);

  function addLink() {
    if (!linkUrl.trim()) return;
    setLinks((prev) => [
      ...prev,
      {
        url: linkUrl.trim(),
        title: linkTitle.trim() || linkUrl.trim(),
      },
    ]);
    setLinkUrl("");
    setLinkTitle("");
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const dataUrl = await resizeImage(file, 640, 640);
      setPhotos((prev) => [...prev, dataUrl]);
    }
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addPhotoFromUnsplash(url: string) {
    setPhotos((prev) => [...prev, url]);
    setShowUnsplash(false);
  }

  async function handleSave() {
    if (!book || !versionId || !contextId) return;
    setSaving(true);

    await addReading({
      date,
      book,
      chapterStart,
      chapterEnd: cEnd,
      verseStart,
      verseEnd: vEnd,
      passageText: "",
      translationId: versionId,
      contextId,
      notes,
      links: links.length > 0 ? links : undefined,
      photos: photos.length > 0 ? photos : undefined,
      audio: audio || undefined,
    });

    setSaving(false);
    router.push("/");
  }

  if (!loaded) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookPlus className="w-6 h-6 text-[#1e3a5f]" />
        Nouvelle lecture
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Livre</label>
            <select value={book} onChange={(e) => { setBook(e.target.value); setChapterStart(1); setChapterEnd(undefined); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Sélectionner un livre</option>
              {BOOKS.map((b) => (
                <option key={b.abbreviation} value={b.abbreviation}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chapitre début</label>
              <select value={chapterStart} onChange={(e) => setChapterStart(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chapitre fin</label>
              <select value={chapterEnd ?? chapterStart} onChange={(e) => setChapterEnd(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: maxChapters - (chapterStart - 1) }, (_, i) => i + chapterStart).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Verset début</label>
              <select value={verseStart} onChange={(e) => setVerseStart(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 200 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Verset fin</label>
              <select value={verseEnd ?? verseStart} onChange={(e) => setVerseEnd(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {Array.from({ length: 200 - (verseStart - 1) }, (_, i) => i + verseStart).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Version</label>
            <select value={versionId} onChange={(e) => setVersionId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contexte</label>
            <select value={contextId} onChange={(e) => setContextId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {contexts.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              Liens
            </label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Titre du lien" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input type="url" value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLink()}
                placeholder="https://..." className="flex-[2] border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={addLink} disabled={!linkUrl.trim()}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
            {links.length > 0 && (
              <div className="space-y-1.5">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{link.title}</p>
                      <p className="truncate text-xs text-gray-400">{link.url}</p>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audio */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-600" />
              Audio
            </label>
            <AudioRecorder value={audio} onChange={setAudio} />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-green-600" />
              Photos
            </label>
            <div className="flex gap-2 mb-2">
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => handleFile(e.target.files)} />
              <button onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                <Camera className="w-4 h-4" /> Appareil photo
              </button>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleFile(e.target.files)} />
              <button onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                <Upload className="w-4 h-4" /> Galerie
              </button>
              <button onClick={() => setShowUnsplash(true)}
                className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                <Search className="w-4 h-4" /> Unsplash
              </button>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={!book || !versionId || !contextId || saving}
            className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <div>
          <h2 className="font-semibold text-gray-500 mb-3">Aperçu du texte</h2>
          {!book ? (
            <p className="text-gray-400 text-sm">Sélectionnez un livre pour voir l&apos;aperçu.</p>
          ) : loadingPassage ? (
            <p className="text-gray-400 text-sm">Chargement du texte...</p>
          ) : passages.length === 0 ? (
            <p className="text-gray-400 text-sm">Texte non disponible pour cette référence avec la version sélectionnée.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm leading-relaxed mb-4">
              <p className="font-medium mb-2">
                {getBookName(book)} {chapterStart}
                {cEnd !== chapterStart ? `-${cEnd}` : ""}
                {verseStart}:{vEnd}
              </p>
              {passages.map((p) => (
                <span key={`${p.chapter}-${p.verse}`}>
                  <sup className="text-xs text-gray-400 mr-0.5">{p.verse}</sup>
                  {p.text}{" "}
                </span>
              ))}
            </div>
          )}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-xs text-gray-500 space-y-1">
            <p>{getBookName(book) || "?"} {chapterStart}{cEnd !== chapterStart ? `-${cEnd}` : ""}:{verseStart}{vEnd !== verseStart ? `-${vEnd}` : ""}</p>
            {notes && <p>📝 {notes}</p>}
            {links.length > 0 && <p>🔗 {links.length} lien(s)</p>}
            {photos.length > 0 && <p>📷 {photos.length} photo(s)</p>}
            {audio && <p>🎵 Audio joint</p>}
          </div>
        </div>
      </div>

      {showUnsplash && (
        <UnsplashSearch
          onSelect={addPhotoFromUnsplash}
          onClose={() => setShowUnsplash(false)}
        />
      )}
    </div>
  );
}
