'use client';

import useSWR from 'swr';
import { revalidate } from './revalidate';
import { api } from '@/lib/api/client';
import type { ComicDTO, ComicInput } from '@/lib/comics/types';

const BASE = '/api/comics';

export type ComicFilters = { world?: string; published?: boolean; q?: string };

/** The list URL is the SWR key, so the same filters share one cache entry */
export const comicsKey = ({ world, published, q }: ComicFilters = {}) => {
  const params = new URLSearchParams();
  if (world) params.set('world', world);
  if (published !== undefined) params.set('published', String(published));
  if (q) params.set('q', q);
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
};

/** List of comics, e.g. useComics({ world: 'spy-files' }). Pass null to skip fetching. */
export function useComics(filters?: ComicFilters | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ComicDTO[]>(
    filters === null ? null : comicsKey(filters),
    { keepPreviousData: true },
  );
  const comics = data ?? [];
  return {
    comics,
    /** Look a comic up by slug, e.g. to colour a badge */
    bySlug: (slug: string | null | undefined) => comics.find((c) => c.slug === slug),
    error,
    isLoading,
    isValidating,
    refresh: mutate,
  };
}

/** One comic by id or slug. Pass null to skip fetching. */
export function useComic(idOrSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ComicDTO>(idOrSlug ? `${BASE}/${idOrSlug}` : null);
  return { comic: data, error, isLoading, refresh: mutate };
}

/* ---------- Mutations ---------- */

/** A comic change also changes what characters and campaigns link to (slug renames, deletes), so refetch those too */
const revalidateComics = () => revalidate(BASE, '/api/characters', '/api/campaigns');

export async function createComic(input: ComicInput) {
  const result = await api.post<ComicDTO>(BASE, input);
  await revalidateComics();
  return result;
}

export async function updateComic(id: string, input: Partial<ComicInput>) {
  const result = await api.patch<ComicDTO>(`${BASE}/${id}`, input);
  await revalidateComics();
  return result;
}

export async function deleteComic(id: string) {
  const result = await api.delete<{ id: string }>(`${BASE}/${id}`);
  await revalidateComics();
  return result;
}
