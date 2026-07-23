"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookPlus, Link as LinkIcon, ImageIcon, Camera, Upload, Search,
  X, ExternalLink, Plus, Music, ChevronDown,
} from "lucide-react";
import {
  seedIfNeeded, getAllVersions, getPassagesByRange, addReading, getSettings,
} from "@/lib/storage";
import type { BibleVersion, ReadingLink, BiblePassage } from "@/lib/storage";
import { BOOKS, getBook, getBookName } from "@/features/bible";
import type { BibleBook } from "@/features/bible";
import UnsplashSearch from "@/components/UnsplashSearch";
import AudioRecorder from "@/components/AudioRecorder";
import { resizeImage } from "@/lib/image-utils";

export default function NewReadingPage() {
  const router = useRouter();
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
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<ReadingLink[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [audio, setAudio] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const [passages, setPassages] = useState<BiblePassage[]>([]);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [showUnsplash, setShowUnsplash] = useState(false);

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
      const vers = await getAllVersions();
      setVersions(vers);
      if (vers.length > 0) {
        const s = await getSettings();
        setVersionId(s?.defaultVersionId || vers[0].id);
      }
      setLoaded(true);
    })();
  }, []);

  function addLink() {
    if (!linkUrl.trim()) return;
    setLinks((prev) => [
      ...prev,
      { url: linkUrl.trim(), title: linkTitle.trim() || linkUrl.trim() },
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
    if (!book || !versionId) return;
    setSaving(true);
    await addReading({
      date, book, chapterStart, chapterEnd: cEnd, verseStart, verseEnd: vEnd,
      passageText: "", translationId: versionId, tags: [], notes,
      links: links.length > 0 ? links : undefined,
      photos: photos.length > 0 ? photos : undefined,
      audio: audio || undefined,
    });
    setSaving(false);
    router.push("/");
  }

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-6 h-6 border-2 border-[--primary] border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <BookPlus className="w-5 h-5 text-[--primary]" />
          </span>
          Nouvelle lecture
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ml-[3.25rem]">
          Enregistre ta lecture du jour
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow] space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[--text]">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[--text]">Livre</label>
              <div className="relative">
                <select value={book} onChange={(e) => { setBook(e.target.value); setChapterStart(1); setChapterEnd(undefined); }}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] appearance-none cursor-pointer">
                  <option value="">Sélectionner un livre</option>
                  {BOOKS.map((b) => (
                    <option key={b.abbreviation} value={b.abbreviation}>{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--text-secondary] pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[--text]">Chapitre début</label>
                <select value={chapterStart} onChange={(e) => setChapterStart(Number(e.target.value))}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
                  {Array.from({ length: maxChapters }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[--text]">Chapitre fin</label>
                <select value={chapterEnd ?? chapterStart} onChange={(e) => setChapterEnd(Number(e.target.value))}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
                  {Array.from({ length: maxChapters - (chapterStart - 1) }, (_, i) => i + chapterStart).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[--text]">Verset début</label>
                <select value={verseStart} onChange={(e) => setVerseStart(Number(e.target.value))}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
                  {Array.from({ length: 200 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[--text]">Verset fin</label>
                <select value={verseEnd ?? verseStart} onChange={(e) => setVerseEnd(Number(e.target.value))}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
                  {Array.from({ length: 200 - (verseStart - 1) }, (_, i) => i + verseStart).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[--text]">Version</label>
              <select value={versionId} onChange={(e) => setVersionId(e.target.value)}
                className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
                {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
              </select>
            </div>
          </div>

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-2 text-[--text]">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={4} placeholder="Tes réflexions sur ce passage..."
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] resize-none placeholder:text-gray-400" />
          </div>

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2 text-[--text]">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              Liens
            </label>
            <div className="space-y-2 mb-2">
              <input type="text" value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Titre du lien" className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
              <div className="flex gap-2">
                <input type="url" value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                  placeholder="https://..." className="flex-1 border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
                <button onClick={addLink} disabled={!linkUrl.trim()}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1 transition-colors shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {links.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 border border-[--border] rounded-lg px-3 py-2 text-sm">
                    <LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-[--text]">{link.title}</p>
                      <p className="truncate text-xs text-[--text-secondary]">{link.url}</p>
                    </div>
                    <a href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600 shrink-0 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2 text-[--text]">
              <Music className="w-4 h-4 text-purple-500" />
              Audio
            </label>
            <AudioRecorder value={audio} onChange={setAudio} />
          </div>

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2 text-[--text]">
              <ImageIcon className="w-4 h-4 text-green-500" />
              Photos
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => handleFile(e.target.files)} />
              <button onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 border border-[--border] rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4" /> Appareil
              </button>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleFile(e.target.files)} />
              <button onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-1.5 border border-[--border] rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" /> Galerie
              </button>
              <button onClick={() => setShowUnsplash(true)}
                className="flex items-center gap-1.5 border border-[--border] rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Search className="w-4 h-4" /> Unsplash
              </button>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-[--border] aspect-square">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={!book || !versionId || saving}
            className="w-full bg-[--primary] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[--shadow]">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Enregistrement...
              </span>
            ) : "Enregistrer la lecture"}
          </button>
        </div>

        <div className="lg:sticky lg:top-10 lg:self-start">
          <h2 className="font-semibold text-sm text-[--text-secondary] mb-3 uppercase tracking-wider">Aperçu du texte</h2>
          {!book ? (
            <div className="bg-[--surface] rounded-xl border border-[--border] p-8 text-center">
              <BookPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[--text-secondary] text-sm">Sélectionne un livre pour voir l&apos;aperçu.</p>
            </div>
          ) : loadingPassage ? (
            <div className="bg-[--surface] rounded-xl border border-[--border] p-8 flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-[--primary] border-t-transparent rounded-full" />
            </div>
          ) : passages.length === 0 ? (
            <div className="bg-[--surface] rounded-xl border border-[--border] p-8 text-center">
              <p className="text-[--text-secondary] text-sm">Texte non disponible pour cette référence.</p>
            </div>
          ) : (
            <>
              <div className="bg-[--surface] rounded-xl border border-[--border] p-5 text-sm leading-relaxed shadow-[--shadow]">
                <p className="font-semibold mb-3 text-[--primary] border-b border-[--border] pb-2">
                  {getBookName(book)} {chapterStart}
                  {cEnd !== chapterStart ? `-${cEnd}` : ""}
                  {verseStart}:{vEnd}
                  <span className="text-[--text-secondary] font-normal ml-2">— {versions.find(v => v.id === versionId)?.name || versionId}</span>
                </p>
                <div className="space-y-1">
                  {passages.map((p) => (
                    <p key={`${p.chapter}-${p.verse}`} className="leading-relaxed">
                      <sup className="text-xs text-[--text-secondary] mr-0.5">{p.verse}</sup>
                      {p.text}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-[--primary-light] rounded-xl border border-[--primary]/10 p-4 text-sm text-[--text] mt-4 space-y-1">
                <p className="font-medium text-[--primary]">Résumé de la saisie</p>
                <p className="text-[--text-secondary]">{getBookName(book) || "?"} {chapterStart}{cEnd !== chapterStart ? `-${cEnd}` : ""}:{verseStart}{vEnd !== verseStart ? `-${vEnd}` : ""}</p>
                {notes && <p className="flex items-center gap-1.5"><span className="text-base">📝</span> {notes}</p>}
                {links.length > 0 && <p className="flex items-center gap-1.5"><span className="text-base">🔗</span> {links.length} lien(s)</p>}
                {photos.length > 0 && <p className="flex items-center gap-1.5"><span className="text-base">📷</span> {photos.length} photo(s)</p>}
                {audio && <p className="flex items-center gap-1.5"><span className="text-base">🎵</span> Audio joint</p>}
              </div>
            </>
          )}
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
