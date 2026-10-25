'use client';

import useSWR from 'swr';
import type { UniverseDTO, UniverseSummary } from '@/lib/universes/types';

const BASE = '/api/universes';

/** Published comics as cards, for /universes */
export function useUniverses() {
  const { data, error, isLoading, mutate } = useSWR<UniverseSummary[]>(BASE);
  return { universes: data ?? [], error, isLoading, refresh: mutate };
}

/** A world's published comics shaped like config/universes, for /universes/[world]. Pass null to skip fetching. */
export function useWorldUniverses(world: string | null) {
  const { data, error, isLoading, mutate } = useSWR<UniverseDTO[]>(world ? `/api/worlds/${world}` : null);
  return { comics: data ?? [], error, isLoading, refresh: mutate };
}

/** One published comic shaped like config/universes, for its page. Pass null to skip fetching. */
export function useUniverse(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR<UniverseDTO>(slug ? `${BASE}/${slug}` : null);
  return { universe: data, error, isLoading, refresh: mutate };
}
