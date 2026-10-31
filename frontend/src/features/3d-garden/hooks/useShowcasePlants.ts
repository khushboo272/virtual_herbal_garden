// ──────────────────────────────────────────────────────────
// hooks/useShowcasePlants.ts — Reactive hook for Garden Showcase
// ETag-aware fetch + Live Socket updates + Polling fallback
// ──────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../../../lib/socket';
import { getShowcasePlants } from '../api/gardenShowcaseApi';
import type { IShowcasePlant } from '../types';

interface PlantsChangedPayload {
  type: 'ADDED' | 'UPDATED' | 'REMOVED';
  plant: IShowcasePlant;
}

export function useShowcasePlants() {
  const [plants, setPlants] = useState<IShowcasePlant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingUpdatesRef = useRef<PlantsChangedPayload[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPlants = useCallback(async () => {
    try {
      setError(null);
      const data = await getShowcasePlants();
      setPlants(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load garden showcase plants');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Flush queued socket changes to state
  const flushPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length === 0) return;

    const updates = [...pendingUpdatesRef.current];
    pendingUpdatesRef.current = [];

    setPlants((prev) => {
      let next = [...prev];
      for (const update of updates) {
        const { type, plant } = update;
        if (!plant || !plant.id) continue;

        if (type === 'REMOVED') {
          next = next.filter((p) => p.id !== plant.id);
        } else if (type === 'ADDED' || type === 'UPDATED') {
          const idx = next.findIndex((p) => p.id === plant.id);
          if (idx >= 0) {
            next[idx] = plant;
          } else {
            next.push(plant);
          }
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    fetchPlants();

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const onPlantsChanged = (payload: PlantsChangedPayload) => {
      if (!payload || !payload.plant) return;
      pendingUpdatesRef.current.push(payload);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        flushPendingUpdates();
      }, 80);
    };

    socket.on('garden:plantsChanged', onPlantsChanged);

    // 60-second polling fallback if socket is disconnected
    const pollingInterval = setInterval(() => {
      if (!socket.connected) {
        fetchPlants();
      }
    }, 60000);

    return () => {
      socket.off('garden:plantsChanged', onPlantsChanged);
      clearInterval(pollingInterval);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchPlants, flushPendingUpdates]);

  return {
    plants,
    isLoading,
    error,
    refetch: fetchPlants,
  };
}

