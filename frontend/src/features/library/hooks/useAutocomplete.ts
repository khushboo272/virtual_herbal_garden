import { useState, useEffect } from 'react';
import { getAutocomplete } from '../api/libraryApi';
import type { AutocompleteResult } from '../types/library.types';

export function useAutocomplete(query: string, minLength = 1) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < minLength) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = setTimeout(() => {
      getAutocomplete(query.trim(), controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setSuggestions(results);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, minLength]);

  return { suggestions, isLoading };
}
