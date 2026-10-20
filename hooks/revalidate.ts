'use client';

import { mutate } from 'swr';

/* Every change also moves the dashboard and the studio totals, so those always refresh too */
const ALWAYS = ['/api/dashboard', '/api/stats'];

/** Refetch every cached SWR entry whose URL starts with one of these, plus the dashboard and stats */
export const revalidate = (...prefixes: string[]) =>
  mutate((key) => typeof key === 'string' && [...prefixes, ...ALWAYS].some((prefix) => key.startsWith(prefix)));
