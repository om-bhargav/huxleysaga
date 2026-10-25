'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import Loader from '@/components/ui/spinner';

const noop = () => () => {};

/** False during SSR and hydration, true after. */
const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/**
 * A blank screen with the spinner in the middle, while a page's data loads.
 * The spinner is styled-components with no SSR style registry, so it only renders once
 * the page is running in the browser; until then the screen is just blank.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  const mounted = useMounted();
  return (
    <div role="status" aria-label={label} className="relative z-10 grid min-h-svh place-items-center bg-background">
      {mounted && <Loader />}
    </div>
  );
}

/** Full-screen message for when a page's data couldn't load or isn't there */
export function PageError({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  const action =
    'px-1 py-2 text-[11px] tracking-widest text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[13px]';

  return (
    <div className="relative z-10 grid min-h-svh place-items-center bg-background px-3 text-center font-heading uppercase text-white">
      <div className="max-w-md">
        <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-none">{title}</h1>
        <p className="mt-4 text-xs tracking-wider text-white/60 sm:text-sm">{message}</p>
        <div className="mt-8 flex justify-center gap-6">
          {onRetry && (
            <button type="button" onClick={onRetry} className={action}>
              <span className="text-white/70">[</span> Try again <span className="text-white/70">]</span>
            </button>
          )}
          <Link href="/universes" className={action}>
            <span className="text-white/70">[</span> All universes <span className="text-white/70">]</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
