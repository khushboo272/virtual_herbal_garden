import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { Plant } from '../lib/types';
import { getSocket } from '../lib/socket';

export function useGardenPlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGardenPlants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Plant[]>('/plants/garden');
      setPlants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load garden plants');
      // Fallback mock
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGardenPlants();

    // Socket listeners for real-time updates
    const onPlantCreated = (plant: Plant) => {
      if (plant.isVisibleInGarden) {
        setPlants(prev => [...prev, plant]);
      }
    };
    
    const onPlantUpdated = (plant: Plant) => {
      setPlants(prev => {
        const exists = prev.find(p => p._id === plant._id);
        if (exists && !plant.isVisibleInGarden) {
          // Remove if no longer visible
          return prev.filter(p => p._id !== plant._id);
        } else if (exists && plant.isVisibleInGarden) {
          // Update
          return prev.map(p => p._id === plant._id ? plant : p);
        } else if (!exists && plant.isVisibleInGarden) {
          // Add newly visible
          return [...prev, plant];
        }
        return prev;
      });
    };

    const socket = getSocket();
    socket.on('plant:created', onPlantCreated);
    socket.on('plant:updated', onPlantUpdated);

    return () => {
      socket.off('plant:created', onPlantCreated);
      socket.off('plant:updated', onPlantUpdated);
    };
  }, [fetchGardenPlants]);

  return { plants, isLoading, error, refetch: fetchGardenPlants };
}
