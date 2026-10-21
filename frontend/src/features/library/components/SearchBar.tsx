import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAutocomplete } from '../hooks/useAutocomplete';
import type { AutocompleteResult } from '../types/library.types';

interface SearchBarProps {
  /** Controlled value from parent (URL source of truth) */
  value: string;
  onChange: (q: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search plants…', className = '' }: SearchBarProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { suggestions, isLoading } = useAutocomplete(inputValue);

  // Sync external value → local input (e.g. URL param change)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Show dropdown when suggestions arrive
  useEffect(() => {
    setOpen(suggestions.length > 0);
    setActiveIndex(-1);
  }, [suggestions]);

  function handleChange(raw: string) {
    setInputValue(raw);
    // Only propagate to URL / parent when user clears or submits
    if (!raw) onChange('');
  }

  function handleSubmit() {
    onChange(inputValue.trim());
    setOpen(false);
    inputRef.current?.blur();
  }

  function selectSuggestion(item: AutocompleteResult) {
    setInputValue(item.commonName);
    setOpen(false);
    // Navigate directly to the plant detail
    navigate(`/plant/${item.slug}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-green-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-green-200 bg-white text-green-900 placeholder:text-green-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="search-autocomplete-list"
        />
        <div className="absolute right-3 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 text-green-400 animate-spin" />}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={() => { setInputValue(''); onChange(''); setOpen(false); }}
              className="p-0.5 rounded-full text-green-400 hover:text-green-600 hover:bg-green-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          id="search-autocomplete-list"
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border-2 border-green-200 shadow-xl overflow-hidden"
        >
          {suggestions.map((item, idx) => {
            const primaryImage = item.images?.find((img) => img.isPrimary) || item.images?.[0];
            return (
              <li
                key={item.slug}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={() => selectSuggestion(item)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  idx === activeIndex
                    ? 'bg-green-50 text-green-900'
                    : 'hover:bg-green-50 text-green-800'
                }`}
              >
                {/* Tiny image or leaf icon */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-green-100 flex items-center justify-center">
                  {primaryImage?.url ? (
                    <img src={primaryImage.url} alt={item.commonName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-green-400 text-lg">🌿</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.commonName}</p>
                  <p className="text-xs text-green-500 italic truncate">{item.scientificName}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
