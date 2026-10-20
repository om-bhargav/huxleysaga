'use client';

import useSWR from 'swr';
import type { DashboardDTO, StudioStats } from '@/lib/stats/types';

/** Public studio totals: raised, backers, funded / upcoming / live issues */
export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<StudioStats>('/api/stats');
  return { stats: data, error, isLoading, refresh: mutate };
}

/** The admin overview. Any create/update/delete elsewhere refreshes it (see ./revalidate). */
export function useDashboard() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardDTO>('/api/dashboard');
  return { dashboard: data, error, isLoading, isValidating, refresh: mutate };
}
