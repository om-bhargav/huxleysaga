'use client';

import type { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api/client';

/** App-wide SWR defaults, so hooks only need to pass a key */
export default function SwrProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
