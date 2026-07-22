"use client";

import { useState } from "react";
import { Search, Image as ImageIcon, Loader2, X } from "lucide-react";
import { getSettings } from "@/lib/storage";

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string };
  alt_description: string;
  user: { name: string };
}

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function UnsplashSearch({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const s = await getSettings();
      const key = s?.unsplashAccessKey;
      if (!key) {
        alert("Configurez votre clé Unsplash dans Réglages.");
        return;
      }
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query.trim())}&per_page=20&client_id=${key}`,
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      alert("Erreur lors de la recherche Unsplash.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-5 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Unsplash</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Rechercher une image..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            autoFocus
          />
          <button onClick={search} disabled={loading || !query.trim()}
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50 flex items-center gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Chercher
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto flex-1">
          {results.map((photo) => (
            <button key={photo.id} onClick={() => { onSelect(photo.urls.regular); onClose(); }}
              className="group relative rounded-lg overflow-hidden border border-gray-200 aspect-[4/3] hover:ring-2 hover:ring-[#1e3a5f] transition-all">
              <img src={photo.urls.small} alt={photo.alt_description ?? ""}
                className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">Photo par {photo.user.name}</p>
              </div>
            </button>
          ))}
          {!loading && query && results.length === 0 && (
            <p className="col-span-full text-sm text-gray-400 text-center py-8">Aucun résultat.</p>
          )}
        </div>
      </div>
    </div>
  );
}
