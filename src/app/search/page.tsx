"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, BookOpen, BookPlus } from "lucide-react";
import { seedIfNeeded, getAllVersions, getAllContexts, addReading, getPassages, getPassagesByRange, searchPassages } from "@/lib/storage";
import type { BibleVersion, BiblePassage, ReadingContext } from "@/lib/storage";
import { BOOKS, getBookName } from "@/features/bible";

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
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [mode, setMode] = useState<Mode>("reference");

  const [refBook, setRefBook] = useState("");
  const [refChapter, setRefChapter] = useState(1);
  const [refVerse, setRefVerse] = useState<number | undefined>();
  const [refVersion, setRefVersion] = useState("");
  const [refResults, setRefResults] = useState<BiblePassage[]>([]);
  const [refLoading, setRefLoading] = useState(false);

  const [kwQuery, setKwQuery] = useState("");
  const [kwVersion, setKwVersion] = useState("");
  const [kwResults, setKwResults] = useState<BiblePassage[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwCount, setKwCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [addDate, setAddDate] = useState("");
  const [addContextId, setAddContextId] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addDone, setAddDone] = useState("");

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [vers, ctxs] = await Promise.all([getAllVersions(), getAllContexts()]);
      setVersions(vers);
      setContexts(ctxs);
      if (vers.length > 0) { setRefVersion(vers[0].id); setKwVersion(vers[0].id); }
      if (ctxs.length > 0) setAddContextId(ctxs[0].id);
      setLoaded(true);
    })();
  }, []);

  async function searchByReference() {
    if (!refBook || !refVersion) return;
    setRefLoading(true);
    try {
      if (refVerse) {
        setRefResults(await getPassagesByRange(refVersion, refBook, refChapter, refVerse, refVerse));
      } else {
        setRefResults(await getPassages(refVersion, refBook, refChapter));
      }
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
    if (contexts.length > 0) setAddContextId(contexts[0].id);
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
      contextId: addContextId,
      notes: addNotes,
    });
    setAddSaving(false);
    setAddDone("Ajouté ✓");
    setTimeout(() => { setAddTarget(null); setAddDone(""); }, 1500);
  }

  if (!loaded) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Search className="w-6 h-6 text-[#1e3a5f]" />
        Recherche biblique
      </h1>

      <div className="flex gap-2 mb-6">
        {(["reference", "keyword"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? "bg-[#1e3a5f] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m === "reference" ? "Par référence" : "Par mots-clés"}
          </button>
        ))}
      </div>

      {mode === "reference" ? (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Livre</label>
                <select value={refBook} onChange={(e) => setRefBook(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Sélectionner</option>
                  {BOOKS.map((b) => (
                    <option key={b.abbreviation} value={b.abbreviation}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Chapitre</label>
                <input type="number" min={1} value={refChapter}
                  onChange={(e) => setRefChapter(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Verset (optionnel)</label>
                <input type="number" min={1} value={refVerse ?? ""}
                  onChange={(e) => setRefVerse(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Tous"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
                <select value={refVersion} onChange={(e) => setRefVersion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                </select>
              </div>
            </div>
            <button onClick={searchByReference} disabled={!refBook}
              className="mt-4 bg-[#1e3a5f] text-white px-5 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50">
              Chercher
            </button>
          </div>

          {refLoading ? (
            <p className="text-gray-500 text-sm">Chargement...</p>
          ) : refResults.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-medium mb-3">
                {getBookName(refBook)} {refChapter}
                {refVerse ? `:${refVerse}` : ""} — {refResults.length} verset(s)
              </p>
              <div className="text-sm leading-relaxed mb-4">
                {refResults.map((p) => (
                  <span key={`${p.chapter}-${p.verse}`}>
                    <sup className="text-xs text-gray-400 mr-0.5">{p.verse}</sup>
                    {p.text}{" "}
                  </span>
                ))}
              </div>
              <button onClick={() => openAddForm({
                book: refBook,
                chapterStart: refChapter,
                chapterEnd: refChapter,
                verseStart: refVerse ?? 1,
                verseEnd: refVerse ?? refResults[refResults.length - 1]?.verse ?? 1,
                versionId: refVersion,
                passageText: refResults.map((p) => `[${p.verse}] ${p.text}`).join("\n"),
              })}
                className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800">
                + Ajouter cette lecture
              </button>
            </div>
          ) : refBook ? (
            <p className="text-gray-400 text-sm">Aucun résultat.</p>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Mot-clé</label>
                <input type="text" value={kwQuery}
                  onChange={(e) => setKwQuery(e.target.value)}
                  placeholder="Entrez un mot ou une phrase..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" autoFocus />
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
                <select value={kwVersion} onChange={(e) => setKwVersion(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {versions.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                </select>
              </div>
            </div>
          </div>

          {kwLoading ? (
            <p className="text-gray-500 text-sm">Recherche en cours...</p>
          ) : kwQuery.trim() && kwResults.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun résultat pour &quot;{kwQuery}&quot;.</p>
          ) : kwResults.length > 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">{kwCount} résultat(s) pour &quot;{kwQuery}&quot;</p>
              <div className="space-y-1">
                {kwResults.map((p) => (
                  <div key={`${p.book}-${p.chapter}-${p.verse}`}
                    className="bg-white rounded-lg border border-gray-200 px-4 py-2 text-sm flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[#1e3a5f]">
                        {getBookName(p.book)} {p.chapter}:{p.verse}
                      </span>{" "}
                      <span className="text-gray-700">{highlightText(p.text, kwQuery)}</span>
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
                      + Ajouter
                    </button>
                  </div>
                ))}
              </div>
              {kwCount >= 100 && (
                <p className="text-xs text-gray-400 mt-2">
                  Affichage des 100 premiers résultats. Précisez votre recherche.
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
                <h3 className="font-semibold mb-1">Ajouter une lecture</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {getBookName(addTarget.book)} {addTarget.chapterStart}
                  {addTarget.chapterEnd !== addTarget.chapterStart ? `-${addTarget.chapterEnd}` : ""}
                  :{addTarget.verseStart}{addTarget.verseEnd !== addTarget.verseStart ? `-${addTarget.verseEnd}` : ""}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                    <input type="date" value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contexte</label>
                    <select value={addContextId} onChange={(e) => setAddContextId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {contexts.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optionnel)</label>
                    <textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4 justify-end">
                  <button onClick={cancelAdd}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Annuler
                  </button>
                  <button onClick={saveAdd} disabled={addSaving}
                    className="bg-[#1e3a5f] text-white px-4 py-2 text-sm rounded-lg hover:bg-[#2a4f7a] disabled:opacity-50">
                    {addSaving ? "Ajout..." : "Ajouter aux lectures"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
