import { api } from '../../../lib/api';
import type { HomeData } from '../types/home.types';

export async function getHome(signal?: AbortSignal): Promise<HomeData> {
  const res = await api.get<HomeData>('/home', undefined, { signal });
  return res.data;
}
