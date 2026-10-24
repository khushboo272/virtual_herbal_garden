import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Leaf, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '../../../../app/components/ui/input';
import { searchDashboardGrouped } from '../api/sharedDashboardApi';
import type { IDashboardSearchResult } from '../types';

interface SearchItem {
  id: string;
  type: 'plant' | 'remedy';
  title: string;
  subtitle?: string;
  url: string;
}

export function HeaderSearchDropdown() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IDashboardSearchResult>({ plants: [], remedies: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Flattened items for easy keyboard navigation
  const flatItems: SearchItem[] = [
    ...results.plants.map((p) => ({
      id: p.id,
      type: 'plant' as const,
      title: p.commonName,
      subtitle: p.scientificName,
      url: `/plant/${p.slug || p.id}`,
    })),
    ...results.remedies.map((r) => ({
      id: r.id,
      type: 'remedy' as const,
      title: r.title,
      subtitle: r.summary,
      url: `/remedies/${r.slug || r.id}`,
    })),
  ];

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const clean = query.trim();
    if (clean.length < 2) {
      setResults({ plants: [], remedies: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchDashboardGrouped(clean);
        setResults(res);
        setSelectedIndex(-1);
        setOpen(true);
      } catch {
        setResults({ plants: [], remedies: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setQuery('');
      navigate(item.url);
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && flatItems.length > 0) {
        setOpen(true);
        setSelectedIndex(0);
        return;
      }
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        e.preventDefault();
        handleSelect(flatItems[selectedIndex]);
      } else if (query.trim()) {
        e.preventDefault();
        setOpen(false);
        const q = query.trim();
        setQuery('');
        navigate(`/library?q=${encodeURIComponent(q)}`);
      }
    }
  };

  const hasResults = results.plants.length > 0 || results.remedies.length > 0;
  const showEmpty = !loading && query.trim().length >= 2 && !hasResults;

  return (
    <div ref={containerRef} className="relative w-64 md:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search plants, remedies..."
          className="pl-9 pr-8 w-full h-9 border-green-200 focus:border-green-400 text-sm rounded-lg bg-white shadow-xs"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (flatItems.length > 0 || query.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-600 animate-spin pointer-events-none" />
        )}
      </div>

      {open && (hasResults || showEmpty) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-green-200/80 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {showEmpty && (
            <div className="p-4 text-center text-xs text-gray-500">
              No published plants or remedies matching &ldquo;{query}&rdquo;
            </div>
          )}

          {results.plants.length > 0 && (
            <div className="p-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-green-700 bg-green-50/70 rounded-md mb-1">
                <Leaf className="w-3 h-3 text-green-600" />
                Plants ({results.plants.length})
              </div>
              {results.plants.map((plant) => {
                const itemIndex = flatItems.findIndex((it) => it.type === 'plant' && it.id === plant.id);
                const isSelected = itemIndex === selectedIndex;
                return (
                  <div
                    key={`plant-${plant.id}`}
                    onClick={() =>
                      handleSelect({
                        id: plant.id,
                        type: 'plant',
                        title: plant.commonName,
                        subtitle: plant.scientificName,
                        url: `/plant/${plant.slug || plant.id}`,
                      })
                    }
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isSelected ? 'bg-green-100/70 text-green-900' : 'hover:bg-slate-50 text-gray-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium truncate">{plant.commonName}</p>
                      <p className="text-xs italic text-gray-500 truncate">{plant.scientificName}</p>
                    </div>
                    <span className="text-[10px] text-green-600 font-medium bg-green-100/60 px-1.5 py-0.5 rounded shrink-0">
                      View
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {results.remedies.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-purple-700 bg-purple-50/70 rounded-md mb-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                Remedies ({results.remedies.length})
              </div>
              {results.remedies.map((remedy) => {
                const itemIndex = flatItems.findIndex((it) => it.type === 'remedy' && it.id === remedy.id);
                const isSelected = itemIndex === selectedIndex;
                return (
                  <div
                    key={`remedy-${remedy.id}`}
                    onClick={() =>
                      handleSelect({
                        id: remedy.id,
                        type: 'remedy',
                        title: remedy.title,
                        subtitle: remedy.summary,
                        url: `/remedies/${remedy.slug || remedy.id}`,
                      })
                    }
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      isSelected ? 'bg-purple-100/70 text-purple-900' : 'hover:bg-slate-50 text-gray-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium truncate">{remedy.title}</p>
                      {remedy.summary && (
                        <p className="text-xs text-gray-500 truncate">{remedy.summary}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-purple-600 font-medium bg-purple-100/60 px-1.5 py-0.5 rounded shrink-0">
                      View
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                const q = query.trim();
                setQuery('');
                navigate(`/library?q=${encodeURIComponent(q)}`);
              }}
              className="text-xs text-green-700 hover:text-green-800 hover:underline font-medium"
            >
              See all results for &ldquo;{query.trim()}&rdquo; &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
