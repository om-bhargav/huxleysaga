'use client';

import Image from 'next/image';
import { SITE_NAME } from '@/config';
import { useComics } from '@/hooks/useComics';
import { useStats } from '@/hooks/useStats';
import { formatMoney } from '@/lib/format';

/** Left half of the login page: published comic posters and the studio totals, from the API */
export default function LoginArt() {
  const { comics } = useComics({ published: true });
  const { stats } = useStats();
  const posters = comics.slice(0, 6);

  return (
    <div className="relative hidden overflow-hidden border-r lg:block">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-1 opacity-60">
        {posters.map((c) => (
          <div key={c.id} className="relative overflow-hidden">
            <Image src={c.hero.poster} alt="" fill sizes="25vw" unoptimized className="object-cover" />
            <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: c.palette.ink }} />
            <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: c.palette.accent }}>
              {c.shortName}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/20" />
      <div className="absolute inset-x-12 bottom-12">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Studio admin</p>
        <h2 className="mt-3 text-5xl leading-tight tracking-wide">{SITE_NAME}</h2>
        {stats && stats.raised > 0 && (
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            {formatMoney(stats.raised)} raised on Kickstarter from {stats.backers.toLocaleString('en-US')} backer pledges.
          </p>
        )}
      </div>
    </div>
  );
}
