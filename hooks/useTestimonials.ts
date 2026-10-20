'use client';

import useSWR from 'swr';
import { revalidate } from './revalidate';
import { api } from '@/lib/api/client';
import type { TestimonialDTO, TestimonialInput } from '@/lib/testimonials/types';

const BASE = '/api/backer-testimonials';

export type TestimonialFilters = { published?: boolean; limit?: number };

/** The list URL is the SWR key, so the same filters share one cache entry */
export const testimonialsKey = ({ published, limit }: TestimonialFilters = {}) => {
  const params = new URLSearchParams();
  if (published !== undefined) params.set('published', String(published));
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
};

/** List of backer testimonials, e.g. useTestimonials({ published: true }). Pass null to skip fetching. */
export function useTestimonials(filters?: TestimonialFilters | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TestimonialDTO[]>(
    filters === null ? null : testimonialsKey(filters),
  );
  return { testimonials: data ?? [], error, isLoading, isValidating, refresh: mutate };
}

/** One testimonial. Pass null to skip fetching. */
export function useTestimonial(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TestimonialDTO>(id ? `${BASE}/${id}` : null);
  return { testimonial: data, error, isLoading, refresh: mutate };
}

/* ---------- Mutations ---------- */

/** Refetch every cached testimonial list and item, whatever its filters */
const revalidateTestimonials = () => revalidate(BASE);

export async function createTestimonial(input: TestimonialInput) {
  const result = await api.post<TestimonialDTO>(BASE, input);
  await revalidateTestimonials();
  return result;
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput>) {
  const result = await api.patch<TestimonialDTO>(`${BASE}/${id}`, input);
  await revalidateTestimonials();
  return result;
}

export async function deleteTestimonial(id: string) {
  const result = await api.delete<{ id: string }>(`${BASE}/${id}`);
  await revalidateTestimonials();
  return result;
}
