import type { ReactNode } from 'react';
import { displayFont } from '@/fonts/universes'; // adjust path
import type { Universe } from '@/config/universes'; // adjust path

/**
 * Paints one universe's section 6 palette and display face onto its page as CSS
 * variables, so every block below can stay universe-agnostic:
 *
 *   --u-ink      page ground        --u-accent      campaign / CTA colour
 *   --u-paper    text on the ground --u-accent-soft secondary accent
 *   --u-display  headline face
 */
export function UniverseTheme({ universe, children }: { universe: Universe; children: ReactNode }) {
  const { ink, paper, accent, accentSoft } = universe.palette;

  return (
    <div
      data-universe={universe.slug}
      style={
        {
          '--u-ink': ink,
          '--u-paper': paper,
          '--u-accent': accent,
          '--u-accent-soft': accentSoft,
          '--u-display': displayFont[universe.display],
          backgroundColor: ink,
          color: paper,
        } as React.CSSProperties
      }
      className="relative z-10"
    >
      {children}
    </div>
  );
}

/** Headline in this universe's display face. */
export function UniverseHeading({
  children,
  className = '',
  as: Tag = 'h2',
}: {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <Tag style={{ fontFamily: 'var(--u-display)' }} className={`uppercase leading-[0.95] ${className}`}>
      {children}
    </Tag>
  );
}

/** Small block label: "01 · Intro video". Keeps the 8 blocks legible as a system. */
export function BlockLabel({ index, children }: { index: number; children: ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]">
      <span style={{ color: 'var(--u-accent)' }}>{String(index).padStart(2, '0')}</span>
      <span aria-hidden="true" className="h-px w-6 opacity-40" style={{ backgroundColor: 'var(--u-paper)' }} />
      <span className="opacity-60">{children}</span>
    </p>
  );
}
