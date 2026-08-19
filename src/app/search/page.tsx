"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, BookOpen, BookPlus, BookText, FileText } from "lucide-react";
import { seedIfNeeded, getEnabledVersions, addReading, getPassagesForRange, searchPassages, getSettings, getAllContexts } from "@/lib/storage";
import type { BibleVersion, BiblePassage, ReadingContext } from "@/lib/storage";

import { getBook } from "@/features/bible";
import BookPicker from "@/components/BookPicker";
import ContextPicker from "@/components/ContextPicker";
import PassagePicker, { describeRange, type PassageRange } from "@/components/PassagePicker";
import { useI18n, useBookName } from "@/contexts/I18nContext";
import { textDirection } from "@/lib/i18n/locales";

type Mode = "reference" | "keyword";

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      : part,
  );
}

interface AddTarget {
  book: string;
  chapterStart: number;
  chapterEnd: number;
  verseStart: number;
  verseEnd: number;
  versionId: string;
  passageText: string;
}

export default function SearchPage() {
  const { t } = useI18n();
  const getBookName = useBookName();
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  /**
   * Le sens d'écriture du texte affiché suit la **version**, pas l'interface :
   * la Smith & Van Dyck se lit de droite à gauche même dans une application
   * réglée en français.
   */
  const sensDuTexte = (versionId: string) =>
    textDirection(versions.find((v) => v.id === versionId)?.language ?? "fr");

  const [mode, setMode] = useState<Mode>("reference");

  const [refBook, setRefBook] = useState("");
  /**
   * Un intervalle, et non plus un chapitre plus un verset facultatif.
   *
   * C'est ce que rend `PassagePicker`, désormais partagé avec Nouvelle lecture
   * et l'ajout d'un passage à un plan : même geste, mêmes possibilités. La
   * recherche gagne au passage les intervalles, que les deux listes
   * déroulantes ne savaient pas exprimer — et perd leur défaut, qui proposait
   * 200 versets quel que soit le chapitre.
   */
  const [refRange, setRefRange] = useState<PassageRange>({
    chapterStart: 1, chapterEnd: 1, verseStart: 1, verseEnd: 1,
  });
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [refVersion, setRefVersion] = useState("");
  const [refResults, setRefResults] = useState<BiblePassage[]>([]);
  const [refLoading, setRefLoading] = useState(false);

  const [kwQuery, setKwQuery] = useState("");
  const [kwVersion, setKwVersion] = useState("");
  const [kwResults, setKwResults] = useState<BiblePassage[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwCount, setKwCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [addContextId, setAddContextId] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addDone, setAddDone] = useState("");

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [vers, ctxs] = await Promise.all([getEnabledVersions(), getAllContexts()]);
      setVersions(vers);
      setContexts(ctxs);
      if (vers.length > 0) {
        const s = await getSettings();
        const defId = s?.defaultVersionId || vers[0].id;
        setRefVersion(defId);
        setKwVersion(defId);
      }
      setLoaded(true);
    })();
  }, []);

  async function searchByReference() {
    if (!refBook || !refVersion) return;
    setRefLoading(true);
    try {
      setRefResults(await getPassagesForRange(refVersion, refBook, refRange));
    } catch { setRefResults([]); }
    setRefLoading(false);
  }

  const searchByKeyword = useCallback(async (query: string) => {
    if (!query.trim() || !kwVersion) { setKwResults([]); setKwCount(0); return; }
    setKwLoading(true);
    try {
      const results = await searchPassages(kwVersion, query.trim(), 100);
      setKwResults(results);
      setKwCount(results.length);
    } catch { setKwResults([]); setKwCount(0); }
    setKwLoading(false);
  }, [kwVersion]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!kwQuery.trim()) { setKwResults([]); setKwCount(0); return; }
    debounceRef.current = setTimeout(() => searchByKeyword(kwQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [kwQuery, searchByKeyword]);

  function openAddForm(target: AddTarget) {
    setAddTarget(target);
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddContextId("");
    setAddNotes("");
    setAddDone("");
  }

  function cancelAdd() {
    setAddTarget(null);
  }

  async function saveAdd() {
    if (!addTarget) return;
    setAddSaving(true);
    const passageText = addTarget.passageText;
    await addReading({
      date: addDate,
      book: addTarget.book,
      chapterStart: addTarget.chapterStart,
      chapterEnd: addTarget.chapterEnd,
      verseStart: addTarget.verseStart,
      verseEnd: addTarget.verseEnd,
      passageText,
      translationId: addTarget.versionId,
      tags: [],
      contextId: addContextId,
      notes: addNotes,
    });
    setAddSaving(false);
    setAddDone(t.search.added);
    setTimeout(() => { setAddTarget(null); setAddDone(""); }, 1500);
  }

  if (!loaded) return <p className="text-gray-500">{t.common.loading}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Search className="w-6 h-6 text-[--primary]" />
        {t.search.title}
      </h1>

      <div className="flex gap-2 mb-6">
        {(["reference", "keyword"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? "bg-[--primary] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m === "reference" ? <BookText className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {m === "reference" ? t.search.modeReference : t.search.modeKeyword}
          </button>
        ))}
      </div>

      {mode === "reference" ? (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.book}</label>
                <BookPicker value={refBook} onSelect={(b) => {
                  setRefBook(b);
                  setRefRange({ chapterStart: 1, chapterEnd: 1, verseStart: 1, verseEnd: 1 });
                  setRefResults([]);
                }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.chapter}</label>
                <button type="button" onClick={() => setRefPickerOpen(true)} disabled={!refBook}
                  className="w-full flex items-center justify-between gap-3 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] hover:border-[--primary] disabled:opacity-50 disabled:hover:border-[--border] disabled:cursor-not-allowed transition-colors">
                  <span className={refBook ? "truncate" : "truncate text-[--text-secondary]"}>
                    {refBook ? describeRange(getBookName(refBook), refRange) : t.search.select}
                  </span>
                  <BookText className="w-4 h-4 text-[--text-secondary] shrink-0" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.version}</label>
                <select value={refVersion} onChange={(e) => setRefVersion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                </select>
              </div>
            </div>
            <button onClick={searchByReference} disabled={!refBook}
              className="mt-4 bg-[--primary] text-white px-5 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50">
              {t.search.go}
            </button>
          </div>

          {refLoading ? (
            <p className="text-gray-500 text-sm">{t.common.loading}</p>
          ) : refResults.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-medium mb-3">
                {describeRange(getBookName(refBook), refRange)} — {t.search.verseCount(refResults.length)}
              </p>
              <div className="texte-biblique text-sm leading-relaxed mb-4" dir={sensDuTexte(refVersion)}>
                {refResults.map((p) => (
                  <span key={`${p.chapter}-${p.verse}`}>
                    <sup className="text-xs text-gray-400 me-0.5">{p.verse}</sup>
                    {p.text}{" "}
                  </span>
                ))}
              </div>
              <button onClick={() => openAddForm({
                book: refBook,
                chapterStart: refRange.chapterStart,
                chapterEnd: refRange.chapterEnd,
                verseStart: refRange.verseStart,
                verseEnd: refRange.verseEnd,
                versionId: refVersion,
                passageText: refResults.map((p) => `[${p.verse}] ${p.text}`).join("\n"),
              })}
                className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800">
                {t.search.addThisReading}
              </button>
            </div>
          ) : refBook ? (
            <p className="text-gray-400 text-sm">{t.search.noResult}</p>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.keyword}</label>
                <input type="text" value={kwQuery}
                  onChange={(e) => setKwQuery(e.target.value)}
                  placeholder={t.search.keywordPlaceholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" autoFocus />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.version}</label>
                <select value={kwVersion} onChange={(e) => setKwVersion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          {kwLoading ? (
            <p className="text-gray-500 text-sm">{t.search.searching}</p>
          ) : kwQuery.trim() && kwResults.length === 0 ? (
            <p className="text-gray-400 text-sm">{t.search.noResultFor(kwQuery)}</p>
          ) : kwResults.length > 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">{t.search.resultCount(kwCount, kwQuery)}</p>
              <div className="space-y-1">
                {kwResults.map((p) => (
                  <div key={`${p.book}-${p.chapter}-${p.verse}`}
                    className="bg-white rounded-lg border border-gray-200 px-4 py-2 text-sm flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[--primary]">
                        {getBookName(p.book)} {p.chapter}:{p.verse}
                      </span>{" "}
                      <span className="texte-biblique text-gray-700" dir={sensDuTexte(p.versionId)}>
                        {highlightText(p.text, kwQuery)}
                      </span>
                    </div>
                    <button onClick={() => openAddForm({
                      book: p.book,
                      chapterStart: p.chapter,
                      chapterEnd: p.chapter,
                      verseStart: p.verse,
                      verseEnd: p.verse,
                      versionId: p.versionId,
                      passageText: `[${p.verse}] ${p.text}`,
                    })}
                      className="shrink-0 text-xs text-green-700 hover:text-green-800 font-medium mt-0.5">
                      {t.search.add}
                    </button>
                  </div>
                ))}
              </div>
              {kwCount >= 100 && (
                <p className="text-xs text-gray-400 mt-2">
                  {t.search.truncated}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {addTarget && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4 shadow-xl">
            {addDone ? (
              <div className="text-center py-6">
                <p className="text-green-700 font-semibold text-lg">{addDone}</p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold mb-1">{t.search.addTitle}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {getBookName(addTarget.book)} {addTarget.chapterStart}
                  {addTarget.chapterEnd !== addTarget.chapterStart ? `-${addTarget.chapterEnd}` : ""}
                  :{addTarget.verseStart}{addTarget.verseEnd !== addTarget.verseStart ? `-${addTarget.verseEnd}` : ""}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.date}</label>
                    <input type="date" value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label htmlFor="search-add-context" className="block text-xs font-medium text-gray-500 mb-1">{t.search.context}</label>
                    <ContextPicker
                      id="search-add-context"
                      contexts={contexts}
                      value={addContextId}
                      onChange={setAddContextId}
                      onContextAdded={(created) => setContexts((prev) => [...prev, created])}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t.search.notes}</label>
                    <textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button onClick={cancelAdd}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    {t.common.cancel}
                  </button>
                  <button onClick={saveAdd} disabled={addSaving}
                    className="bg-[--primary] text-white px-4 py-2 text-sm rounded-lg hover:bg-[--primary-hover] disabled:opacity-50">
                    {addSaving ? t.search.adding : t.search.addToReadings}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <PassagePicker
        open={refPickerOpen && !!refBook}
        book={refBook}
        bookName={getBookName(refBook)}
        versionId={refVersion}
        maxChapters={getBook(refBook)?.chapters ?? 150}
        chapterStart={refRange.chapterStart}
        chapterEnd={refRange.chapterEnd}
        verseStart={refRange.verseStart}
        verseEnd={refRange.verseEnd}
        onClose={() => setRefPickerOpen(false)}
        onValidate={(r) => { setRefRange(r); setRefResults([]); setRefPickerOpen(false); }}
      />
    </div>
  );
}
