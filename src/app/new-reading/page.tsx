"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookPlus, Link as LinkIcon, ImageIcon, Camera, Upload,
  X, ExternalLink, Plus, Music, Trash2, Layers, SlidersHorizontal, BookOpenText, Search,
} from "lucide-react";
import {
  seedIfNeeded, getEnabledVersions, getPassagesForRange, addReading, getSettings,
  getAllContexts,
} from "@/lib/storage";
import type { BibleVersion, ReadingLink, BiblePassage, ReadingContext } from "@/lib/storage";
import { getBook } from "@/features/bible";
import type { BibleBook } from "@/features/bible";
import { useI18n, useBookName } from "@/contexts/I18nContext";
import { textDirection } from "@/lib/i18n/locales";
import AudioRecorder from "@/components/AudioRecorder";
import ContextPicker from "@/components/ContextPicker";
import PassagePicker, { describeRange } from "@/components/PassagePicker";
import BookPicker from "@/components/BookPicker";
import PassagePreview from "@/components/PassagePreview";
import PassageSearch from "@/components/PassageSearch";
import { resizeImage } from "@/lib/image-utils";

/** Un passage mis de côté, en attente de l'enregistrement global. */
interface PendingPassage {
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
}

/**
 * Le nom du livre est fourni par l'appelant plutôt que lu ici : cette fonction
 * vit hors du composant, donc hors de portée du crochet qui connaît la langue.
 */
function describePassage(p: PendingPassage, nomDuLivre: (code: string) => string): string {
  const chapters = p.chapterEnd !== p.chapterStart
    ? `${p.chapterStart}-${p.chapterEnd}`
    : `${p.chapterStart}`;
  const verses = p.verseEnd !== p.verseStart
    ? `${p.verseStart}-${p.verseEnd}`
    : `${p.verseStart}`;
  return `${nomDuLivre(p.book)} ${chapters}:${verses}`;
}

export default function NewReadingPage() {
  const router = useRouter();
  const { t } = useI18n();
  const getBookName = useBookName();
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
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [contextId, setContextId] = useState("");
  // `passages` porte déjà l'aperçu des versets : ce champ-ci est la pile des
  // passages mis de côté pour être enregistrés ensemble.
  const [pending, setPending] = useState<PendingPassage[]>([]);
  const [notes, setNotes] = useState("");
  const [links, setLinks] = useState<ReadingLink[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [audio, setAudio] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const [passages, setPassages] = useState<BiblePassage[]>([]);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
        // Dérivés ici plutôt que repris de cEnd/vEnd : l'effet dépend alors
        // uniquement d'états bruts, tous listés dans son tableau de dépendances.
        setPassages(await getPassagesForRange(versionId, book, {
          chapterStart,
          chapterEnd: chapterEnd ?? chapterStart,
          verseStart,
          verseEnd: verseEnd ?? verseStart,
        }));
      } catch {
        setPassages([]);
      }
      setLoadingPassage(false);
    })();
  }, [book, versionId, chapterStart, chapterEnd, verseStart, verseEnd]);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [vers, ctxs] = await Promise.all([getEnabledVersions(), getAllContexts()]);
      setVersions(vers);
      setContexts(ctxs);
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

  /** Le passage en cours de saisie, s'il est complet. */
  function currentPassage(): PendingPassage | null {
    if (!book) return null;
    return { book, chapterStart, chapterEnd: cEnd, verseStart, verseEnd: vEnd };
  }

  function resetPassageFields() {
    setBook("");
    setChapterStart(1);
    setChapterEnd(undefined);
    setVerseStart(1);
    setVerseEnd(undefined);
  }

  /**
   * Changer de livre remet la référence à zéro — les versets aussi, qui
   * restaient sur leur valeur précédente et faisaient passer d'un Jean 3:16 à
   * un Abdias 1:16 que personne n'avait demandé — puis ouvre la fenêtre de
   * sélection dans la foulée.
   */
  function selectBook(abbreviation: string) {
    setBook(abbreviation);
    setChapterStart(1);
    setChapterEnd(undefined);
    setVerseStart(1);
    setVerseEnd(undefined);
    if (abbreviation) setPickerOpen(true);
  }

  /** Met le passage en cours de côté et vide les champs pour le suivant. */
  function stackPassage() {
    const p = currentPassage();
    if (!p) return;
    setPending((prev) => [...prev, p]);
    resetPassageFields();
  }

  function removePending(i: number) {
    setPending((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Le passage en cours compte dans le total : on n'oblige pas à cliquer
  // « Ajouter ce passage » avant d'enregistrer une lecture unique.
  const toSave = [...pending, ...(currentPassage() ? [currentPassage()!] : [])];

  /**
   * Ce qui serait perdu en quittant la page.
   *
   * La date et la version ne comptent pas : elles ont une valeur par défaut et
   * n'ont donc rien d'un travail en cours.
   */
  const enCours =
    Boolean(book) || notes.trim().length > 0 || links.length > 0
    || photos.length > 0 || Boolean(audio) || pending.length > 0;

  // Une fois la lecture enregistrée, la navigation qui suit n'a plus rien à
  // faire confirmer — c'est nous qui la déclenchons.
  const enregistre = useRef(false);

  useEffect(() => {
    if (!enCours) return;
    const avantFermeture = (e: BeforeUnloadEvent) => {
      if (enregistre.current) return;
      // Les navigateurs imposent leur propre message depuis longtemps ; seul le
      // fait d'annuler l'événement compte.
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avantFermeture);
    return () => window.removeEventListener("beforeunload", avantFermeture);
  }, [enCours]);

  /**
   * La même garde pour la navigation interne.
   *
   * L'App Router n'expose aucun événement de navigation annulable — il n'a pas
   * d'équivalent au `routeChangeStart` du Pages Router, et `useBlocker` de
   * React Router n'existe pas ici. Le seul point d'accroche est donc le clic
   * sur le lien, intercepté en phase de capture avant que `next/link` ne le
   * traite. Un changement d'onglet du navigateur ou un bouton « précédent »
   * passent au travers : le premier est couvert par `beforeunload`, le second
   * ne l'est pas, et c'est une limite assumée.
   */
  useEffect(() => {
    if (!enCours) return;
    const auClic = (e: MouseEvent) => {
      if (enregistre.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = (e.target as HTMLElement | null)?.closest?.("a");
      if (!lien) return;
      const href = lien.getAttribute("href");
      if (!href || !href.startsWith("/") || href === "/new-reading") return;
      if (lien.getAttribute("target") === "_blank") return;
      if (confirm(t.newReading.leaveWarning)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("click", auClic, true);
    return () => document.removeEventListener("click", auClic, true);
  }, [enCours, t]);

  async function handleSave() {
    if (toSave.length === 0 || !versionId) return;
    setSaving(true);

    // Une lecture par passage : les statistiques, la progression et les plans
    // raisonnent tous par lecture, un enregistrement unique portant plusieurs
    // passages fausserait tous les comptages.
    for (const p of toSave) {
      await addReading({
        date,
        book: p.book,
        chapterStart: p.chapterStart,
        chapterEnd: p.chapterEnd,
        verseStart: p.verseStart,
        verseEnd: p.verseEnd,
        passageText: "",
        translationId: versionId,
        tags: [],
        contextId,
        notes,
        links: links.length > 0 ? links : undefined,
        photos: photos.length > 0 ? photos : undefined,
        audio: audio || undefined,
      });
    }

    enregistre.current = true;
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
          {t.newReading.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">
          {t.newReading.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow] space-y-5">
            <div>
              <label htmlFor="reading-date" className="block text-sm font-medium mb-1.5 text-[--text]">{t.newReading.date}</label>
              <input id="reading-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} autoComplete="off"
                className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
            </div>

            <div>
              <label htmlFor="reading-context" className="block text-sm font-medium mb-1.5 text-[--text]">{t.newReading.context}</label>
              <ContextPicker
                id="reading-context"
                contexts={contexts}
                value={contextId}
                onChange={setContextId}
                onContextAdded={(created) => setContexts((prev) => [...prev, created])}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[--text]">{t.newReading.book}</label>
              <BookPicker value={book} onSelect={selectBook} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[--text]">{t.newReading.chaptersAndVerses}</label>
              <button type="button" onClick={() => setPickerOpen(true)} disabled={!book}
                className="w-full flex items-center justify-between gap-3 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
                <span className="truncate">
                  {book
                    ? describeRange(getBookName(book), { chapterStart, chapterEnd: cEnd, verseStart, verseEnd: vEnd })
                    : t.newReading.selectBookFirst}
                </span>
                <SlidersHorizontal className="w-4 h-4 text-[--text-secondary] shrink-0" />
              </button>
            </div>

            <button type="button" onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-center gap-2 border border-[--border] rounded-lg px-3 py-2.5 text-sm text-[--primary] hover:border-[--primary] transition-colors">
              <Search className="w-4 h-4" />
              {t.passageSearch.open}
            </button>

            <button type="button" onClick={() => setPreviewOpen(true)} disabled={!book}
              className="w-full flex items-center justify-center gap-2 border border-[--border] rounded-lg px-3 py-2.5 text-sm text-[--primary] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
              <BookOpenText className="w-4 h-4" />
              {t.newReading.previewOpen}
            </button>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[--text]">{t.newReading.version}</label>
              <select value={versionId} onChange={(e) => setVersionId(e.target.value)}
                className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
                {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
              </select>
            </div>

            <div className="pt-1">
              <button type="button" onClick={stackPassage} disabled={!book}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-[--border] rounded-lg px-3 py-2.5 text-sm text-[--text-secondary] hover:border-[--primary] hover:text-[--primary] disabled:opacity-40 disabled:hover:border-[--border] disabled:hover:text-[--text-secondary] transition-colors">
                <Plus className="w-4 h-4" />
                {t.newReading.addAnotherPassage}
              </button>
              <p className="text-xs text-[--text-secondary] mt-1.5">
                {t.newReading.sharedFields}
              </p>
            </div>
          </div>

          {pending.length > 0 && (
            <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
              <p className="text-sm font-medium mb-3 flex items-center gap-2 text-[--text]">
                <Layers className="w-4 h-4 text-[--primary]" />
                {t.newReading.passagesToSave(pending.length, currentPassage() !== null)}
              </p>
              <ul className="space-y-1.5">
                {pending.map((p, i) => (
                  <li key={`${p.book}-${p.chapterStart}-${i}`}
                    className="flex items-center gap-2 bg-gray-50 border border-[--border] rounded-lg px-3 py-2 text-sm">
                    <span className="flex-1 min-w-0 truncate text-[--text]">{describePassage(p, getBookName)}</span>
                    <button type="button" onClick={() => removePending(i)}
                      aria-label={t.newReading.removePassage(describePassage(p, getBookName))}
                      className="text-[--text-secondary] hover:text-red-600 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-2 text-[--text]">{t.newReading.notes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={4} placeholder={t.newReading.notesPlaceholder}
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] resize-none placeholder:text-gray-400" />
          </div>

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2 text-[--text]">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              {t.newReading.links}
            </label>
            <div className="space-y-2 mb-2">
              <input type="text" value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder={t.newReading.linkTitlePlaceholder} className="w-full border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
              <div className="flex gap-2">
                <input type="url" value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                  placeholder="https://..." className="flex-1 border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" />
                <button onClick={addLink} disabled={!linkUrl.trim()} aria-label={t.newReading.addLink}
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
                    <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={t.newReading.openLink}
                      className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => removeLink(i)} aria-label={t.newReading.removeLink} className="text-red-400 hover:text-red-600 shrink-0 transition-colors">
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
              {t.newReading.audio}
            </label>
            <AudioRecorder value={audio} onChange={setAudio} />
          </div>

          <div className="bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow]">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2 text-[--text]">
              <ImageIcon className="w-4 h-4 text-green-500" />
              {t.newReading.photos}
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => handleFile(e.target.files)} />
              <button onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 border border-[--border] rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4" /> {t.newReading.camera}
              </button>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleFile(e.target.files)} />
              <button onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-1.5 border border-[--border] rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" /> {t.newReading.gallery}
              </button>
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-[--border] aspect-square">
                    <img src={photo} alt="" width="640" height="640" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)} aria-label={t.newReading.removePhoto}
                      className="absolute top-1 end-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={toSave.length === 0 || !versionId || saving}
            className="w-full bg-[--primary] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[--shadow]">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {t.newReading.saving}
              </span>
            ) : toSave.length > 1 ? t.newReading.saveMany(toSave.length) : t.newReading.saveOne}
          </button>
        </div>

        <div className="lg:sticky lg:top-10 lg:self-start">
          {!book ? (
            <div className="bg-[--surface] rounded-xl border border-[--border] p-8 text-center">
              <BookPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[--text-secondary] text-sm">{t.newReading.previewEmpty}</p>
            </div>
          ) : (
            <div className="bg-[--primary-light] rounded-xl border border-[--primary]/10 p-4 text-sm text-[--text] space-y-1">
              <p className="font-medium text-[--primary]">{t.newReading.summary}</p>
              <p className="text-[--text-secondary]">
                {describeRange(getBookName(book), { chapterStart, chapterEnd: cEnd, verseStart, verseEnd: vEnd })}
                <span className="ms-2">— {versions.find((v) => v.id === versionId)?.name || versionId}</span>
              </p>
              {notes && <p className="flex items-center gap-1.5"><span className="text-base">📝</span> {notes}</p>}
              {links.length > 0 && <p className="flex items-center gap-1.5"><span className="text-base">🔗</span> {t.newReading.linkCount(links.length)}</p>}
              {photos.length > 0 && <p className="flex items-center gap-1.5"><span className="text-base">📷</span> {t.newReading.photoCount(photos.length)}</p>}
              {audio && <p className="flex items-center gap-1.5"><span className="text-base">🎵</span> {t.newReading.audioAttached}</p>}
            </div>
          )}
        </div>
      </div>

      <PassagePicker
        open={pickerOpen && !!book}
        book={book}
        bookName={getBookName(book)}
        versionId={versionId}
        maxChapters={maxChapters}
        chapterStart={chapterStart}
        chapterEnd={cEnd}
        verseStart={verseStart}
        verseEnd={vEnd}
        onClose={() => setPickerOpen(false)}
        onValidate={(r) => {
          setChapterStart(r.chapterStart);
          setChapterEnd(r.chapterEnd);
          setVerseStart(r.verseStart);
          setVerseEnd(r.verseEnd);
          setPickerOpen(false);
          // On enchaîne sur le texte : c'est pour le lire qu'on vient de le
          // désigner, et la fenêtre porte le bouton qui le valide.
          setPreviewOpen(true);
        }}
      />

      <PassagePreview
        open={previewOpen && !!book}
        title={describeRange(getBookName(book), { chapterStart, chapterEnd: cEnd, verseStart, verseEnd: vEnd })}
        versionName={versions.find((v) => v.id === versionId)?.name || versionId}
        dir={textDirection(versions.find((v) => v.id === versionId)?.language ?? "fr")}
        passages={passages}
        loading={loadingPassage}
        onEdit={() => { setPreviewOpen(false); setPickerOpen(true); }}
        onValidate={() => setPreviewOpen(false)}
        onClose={() => setPreviewOpen(false)}
      />

      <PassageSearch
        open={searchOpen}
        versionId={versionId}
        versionLanguage={versions.find((v) => v.id === versionId)?.language ?? "fr"}
        onClose={() => setSearchOpen(false)}
        onPick={(p) => {
          setBook(p.book);
          setChapterStart(p.chapterStart);
          setChapterEnd(p.chapterEnd);
          setVerseStart(p.verseStart);
          setVerseEnd(p.verseEnd);
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
