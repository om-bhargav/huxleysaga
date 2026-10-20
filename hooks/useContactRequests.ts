'use client';

import useSWR from 'swr';
import { revalidate } from './revalidate';
import { api } from '@/lib/api/client';
import type { ContactFormValues } from '@/lib/contact/schema';
import type { ContactRequestDTO, ContactStatus, ContactTopic } from '@/lib/contact/types';

const BASE = '/api/contact-requests';

export type ContactRequestFilters = { status?: ContactStatus | ContactStatus[]; topic?: ContactTopic; q?: string };

/** The list URL is the SWR key, so the same filters share one cache entry */
export const contactRequestsKey = ({ status, topic, q }: ContactRequestFilters = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', [status].flat().join(','));
  if (topic) params.set('topic', topic);
  if (q) params.set('q', q);
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
};

/** Contact requests, newest first, e.g. useContactRequests({ status: 'NEW' }). Pass null to skip fetching. */
export function useContactRequests(filters?: ContactRequestFilters | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ContactRequestDTO[]>(
    filters === null ? null : contactRequestsKey(filters),
    { keepPreviousData: true },
  );
  return { requests: data ?? [], error, isLoading, isValidating, refresh: mutate };
}

/* ---------- Mutations ---------- */

const revalidateContactRequests = () => revalidate(BASE);

/** Public: the contact page's form */
export const submitContact = (values: ContactFormValues) => api.post<{ id: string | null }>('/api/contact', values);

export async function updateContactRequest(id: string, status: ContactStatus) {
  const result = await api.patch<ContactRequestDTO>(`${BASE}/${id}`, { status });
  await revalidateContactRequests();
  return result;
}

export async function deleteContactRequest(id: string) {
  const result = await api.delete<{ id: string }>(`${BASE}/${id}`);
  await revalidateContactRequests();
  return result;
}
