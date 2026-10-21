import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlant } from '../api/libraryApi';
import type { LibraryPlant } from '../types/library.types';
import { ApiError } from '../../../lib/api';

function isObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function usePlant(slugOrId: string) {
  const [plant, setPlant] = useState<LibraryPlant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slugOrId) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await getPlant(slugOrId, controller.signal);
        if (controller.signal.aborted) return;

        // If fetched by ObjectId, redirect to canonical slug URL
        if (isObjectId(slugOrId) && data.slug && data.slug !== slugOrId) {
          navigate(`/plant/${data.slug}`, { replace: true });
          return;
        }

        setPlant(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const msg = err instanceof ApiError ? err.message : 'Failed to load plant';
        setError(msg);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [slugOrId, navigate]);

  return { plant, isLoading, error };
}

export function usePlantReviews(plantId: string) {
  const [reviews, setReviews] = useState<import('../types/library.types').PlantReview[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!plantId) return;
    const controller = new AbortController();
    setIsLoading(true);

    import('../api/libraryApi').then(({ getReviews }) => {
      getReviews(plantId, 1, 20, controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) {
            setReviews(res.reviews);
            setTotal(res.meta.total);
          }
        })
        .catch((err) => {
          if ((err as Error).name !== 'AbortError') setError('Failed to load reviews');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    });

    return () => controller.abort();
  }, [plantId]);

  async function submitReview(data: { rating: number; title?: string; body?: string }) {
    setIsSubmitting(true);
    try {
      const { postReview } = await import('../api/libraryApi');
      const review = await postReview(plantId, data);
      setReviews((prev) => [review, ...prev]);
      setTotal((t) => t + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { reviews, total, isLoading, error, isSubmitting, submitReview };
}
