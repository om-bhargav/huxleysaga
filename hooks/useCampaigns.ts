'use client';

import useSWR from 'swr';
import { revalidate } from './revalidate';
import { api } from '@/lib/api/client';
import type { CampaignDTO, CampaignInput, CampaignStatus } from '@/lib/campaigns/types';

const BASE = '/api/campaigns';

export type CampaignFilters = { status?: CampaignStatus | CampaignStatus[]; universe?: string; limit?: number };

/** The list URL is the SWR key, so the same filters share one cache entry */
export const campaignsKey = ({ status, universe, limit }: CampaignFilters = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', [status].flat().join(','));
  if (universe) params.set('universe', universe);
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
};

/** List of campaigns, e.g. useCampaigns({ status: 'LIVE' }). Pass null to skip fetching. */
export function useCampaigns(filters?: CampaignFilters | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CampaignDTO[]>(
    filters === null ? null : campaignsKey(filters),
  );
  return { campaigns: data ?? [], error, isLoading, isValidating, refresh: mutate };
}

/** One campaign. Pass null to skip fetching. */
export function useCampaign(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CampaignDTO>(id ? `${BASE}/${id}` : null);
  return { campaign: data, error, isLoading, refresh: mutate };
}

/* ---------- Mutations ---------- */

/** Refetch every cached campaign list and item, whatever its filters */
const revalidateCampaigns = () => revalidate(BASE);

export async function createCampaign(input: CampaignInput) {
  const result = await api.post<CampaignDTO>(BASE, input);
  await revalidateCampaigns();
  return result;
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>) {
  const result = await api.patch<CampaignDTO>(`${BASE}/${id}`, input);
  await revalidateCampaigns();
  return result;
}

export async function deleteCampaign(id: string) {
  const result = await api.delete<{ id: string }>(`${BASE}/${id}`);
  await revalidateCampaigns();
  return result;
}
