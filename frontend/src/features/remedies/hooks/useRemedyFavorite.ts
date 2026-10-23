import { useState, useEffect, useCallback } from 'react';
import {
  addRemedyFavorite,
  removeRemedyFavorite,
  getRemedyBookmarks,
} from '../api/remediesApi';
import { useAuth } from '../../../contexts/AuthContext';

export function useRemedyFavorite(remedyId: string) {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !remedyId) return;

    getRemedyBookmarks()
      .then((bookmarks) => {
        const existing = bookmarks.find(
          (b) => b.entityType === 'REMEDY' && b.entityId === remedyId,
        );
        if (existing) {
          setIsFavorite(true);
          setBookmarkId(existing._id);
        }
      })
      .catch(() => {
        // Silently ignore bookmark check error
      });
  }, [remedyId, isAuthenticated]);

  const toggle = useCallback(async () => {
    if (!isAuthenticated || isLoading) return;

    const prevState = isFavorite;
    const prevBookmarkId = bookmarkId;
    setIsFavorite(!isFavorite);
    setIsLoading(true);

    try {
      if (prevState && prevBookmarkId) {
        await removeRemedyFavorite(prevBookmarkId);
        setBookmarkId(null);
      } else {
        const result = await addRemedyFavorite(remedyId);
        setBookmarkId(result._id);
      }
    } catch {
      setIsFavorite(prevState);
      setBookmarkId(prevBookmarkId);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isFavorite, bookmarkId, remedyId, isLoading]);

  return { isFavorite, toggle, isLoading, isAuthenticated };
}

export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (title: string, text?: string) => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Browser doesn't allow clipboard access
    }
  }, []);

  return { share, copied };
}
