// ──────────────────────────────────────────────────────────
// api/gardenShowcaseApi.ts — API client for Garden Showcase
// ETag-aware fetch and model-error reporting
// ──────────────────────────────────────────────────────────
import { api } from '../../../lib/api';
import type { IShowcasePlant } from '../types';

let cachedEtag: string | null = null;
let cachedPlants: IShowcasePlant[] = [];

/**
 * Fetch all published showcase plants with ETag support.
 * Returns cached plants if 304 Not Modified.
 */
export async function getShowcasePlants(): Promise<IShowcasePlant[]> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (cachedEtag) {
    headers['If-None-Match'] = cachedEtag;
  }
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch('/api/v1/garden/showcase', {
      headers,
      credentials: 'include',
    });

    if (res.status === 304) {
      return cachedPlants;
    }

    if (!res.ok) {
      throw new Error(`Failed to load showcase plants (${res.status} ${res.statusText})`);
    }

    const etag = res.headers.get('ETag');
    if (etag) {
      cachedEtag = etag;
    }

    const body = await res.json();
    const plants = (body.data || []) as IShowcasePlant[];
    cachedPlants = plants;
    return plants;
  } catch (err) {
    // If network fails but we had cached plants, return them
    if (cachedPlants.length > 0) {
      console.warn('[GardenShowcaseApi] Network error, serving cached plants', err);
      return cachedPlants;
    }
    throw err;
  }
}

/**
 * Report a failed 3D model load to backend.
 * Rate-limited server-side; sets modelStatus = FAILED after 3 reports within an hour.
 */
export async function reportModelError(plantId: string, message: string): Promise<void> {
  try {
    await api.post('/garden/model-error', { plantId, message });
  } catch (err) {
    console.warn('[GardenShowcaseApi] Error reporting model failure:', err);
  }
}

