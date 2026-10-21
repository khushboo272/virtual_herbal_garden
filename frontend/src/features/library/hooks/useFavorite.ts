import { useState, useEffect, useCallback } from 'react';
import { addFavorite, removeFavorite, getBookmarks } from '../api/libraryApi';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Manages the favorite (bookmark) state for a single plant.
 * Loads current bookmark status on mount, exposes a toggle.
 * Optimistic update: toggled immediately, reverted on error.
 */
export function useFavorite(plantId: string) {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing bookmark status
  useEffect(() => {
    if (!isAuthenticated || !plantId) return;

    getBookmarks()
      .then((bookmarks) => {
        const existing = bookmarks.find(
          (b) => b.entityType === 'PLANT' && b.entityId === plantId,
        );
        if (existing) {
          setIsFavorite(true);
          setBookmarkId(existing._id);
        }
      })
      .catch(() => {
        // Non-critical — silently ignore
      });
  }, [plantId, isAuthenticated]);

  const toggle = useCallback(async () => {
    if (!isAuthenticated || isLoading) return;

    // Optimistic update
    const prevState = isFavorite;
    const prevBookmarkId = bookmarkId;
    setIsFavorite(!isFavorite);
    setIsLoading(true);

    try {
      if (prevState && prevBookmarkId) {
        await removeFavorite(prevBookmarkId);
        setBookmarkId(null);
      } else {
        const result = await addFavorite(plantId);
        setBookmarkId(result._id);
      }
    } catch {
      // Revert optimistic update on error
      setIsFavorite(prevState);
      setBookmarkId(prevBookmarkId);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isFavorite, bookmarkId, plantId, isLoading]);

  return { isFavorite, toggle, isLoading };
}

/**
 * Copies the current page URL to the clipboard using Web Share API
 * with a clipboard fallback. Returns a `copied` flag that resets
 * after 2 seconds.
 */
export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (title: string, text?: string) => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Browser doesn't support clipboard API
    }
  }, []);

  return { share, copied };
}
