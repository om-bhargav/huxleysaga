'use client';

import useSWR from 'swr';
import { revalidate } from './revalidate';
import { api } from '@/lib/api/client';
import type { CharacterDTO, CharacterInput } from '@/lib/characters/types';

const BASE = '/api/characters';

export type CharacterFilters = { comic?: string; q?: string; limit?: number };

/** The list URL is the SWR key, so the same filters share one cache entry */
export const charactersKey = ({ comic, q, limit }: CharacterFilters = {}) => {
  const params = new URLSearchParams();
  if (comic) params.set('comic', comic);
  if (q) params.set('q', q);
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
};

/** List of characters, e.g. useCharacters({ comic: 'silk-sting' }). Pass null to skip fetching. */
export function useCharacters(filters?: CharacterFilters | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CharacterDTO[]>(
    filters === null ? null : charactersKey(filters),
    { keepPreviousData: true },
  );
  return { characters: data ?? [], error, isLoading, isValidating, refresh: mutate };
}

/** One character. Pass null to skip fetching. */
export function useCharacter(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CharacterDTO>(id ? `${BASE}/${id}` : null);
  return { character: data, error, isLoading, refresh: mutate };
}

/* ---------- Mutations ---------- */

/** Refetch every cached character list and item, whatever its filters */
const revalidateCharacters = () => revalidate(BASE);

export async function createCharacter(input: CharacterInput) {
  const result = await api.post<CharacterDTO>(BASE, input);
  await revalidateCharacters();
  return result;
}

export async function updateCharacter(id: string, input: Partial<CharacterInput>) {
  const result = await api.patch<CharacterDTO>(`${BASE}/${id}`, input);
  await revalidateCharacters();
  return result;
}

export async function deleteCharacter(id: string) {
  const result = await api.delete<{ id: string }>(`${BASE}/${id}`);
  await revalidateCharacters();
  return result;
}
