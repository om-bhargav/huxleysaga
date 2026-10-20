'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import type { IconType } from 'react-icons';
import { FiArrowUpRight, FiCompass, FiCpu, FiEye, FiFeather, FiGlobe } from 'react-icons/fi';
import { comicsIn, displayFontClass, worlds as allWorlds, type World } from '@/config/worlds';
import type { Universe } from '@/config/universes';
import { SectionIntro } from '../shared/SectionIntro';

/* ------------------------------------------------------------------ */
/* LINKS & LOOKUPS — adjust to your routes                             */
/* ------------------------------------------------------------------ */

const worldHref = (world: World) => `/universes/${world.slug}`;
const comicHref = (comic: Universe) => `/universes/${comic.slug}`;

/** The comic's display name (uses `title` or `name`, whichever Universe has) */
const comicName = (comic: Universe) => {
  const c = comic as unknown as { title?: string; name?: string };
  return c.title ?? c.name ?? comic.slug;
};

const ICONS: Record<string, IconType> = {
  'spy-files': FiEye,
  'wild-west': FiCompass,
  'game-world': FiCpu,
  'fantasy-land': FiFeather,
};

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

const pad = (n: number) => String(n).padStart(2, '0');

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export default function MeetTheUniverse({
  worlds = allWorlds,
  images = {},
}: {
  worlds?: World[];
  /** Artwork per world, keyed by world slug. Missing ones show a placeholder. */
  images?: Record<string, string>;
}) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (!worlds.length) return null;

  const world = worlds[active];
  const comics = comicsIn(world);
  const Icon = ICONS[world.slug] ?? FiGlobe;
  const image = images[world.slug];
  const countWord = NUMBER_WORDS[worlds.length] ?? String(worlds.length);

  // Arrow keys move between tabs
  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + worlds.length) % worlds.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="bg-background px-3 text-foreground">

      <SectionIntro title={`Meet the universe`} text={`${countWord} worlds. Hundreds of characters. One universe to explore. Every world has its own rules, heroes and secrets. Pick one to meet the stories that live there.`} />
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Worlds"
        className="mt-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap"
      >
        {worlds.map((w, i) => {
          const selected = i === active;
          return (
            <button
              key={w.slug}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onTabKey}
              className={`shrink-0 cursor-pointer rounded-full border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground'
                }`}
            >
              {w.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${active}`}
        className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={world.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid items-center gap-10 md:grid-cols-2"
          >
            {/* Text */}
            <div>
              <div className="flex items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                World
                <span className="font-mono font-normal">{pad(active + 1)}</span>
              </div>

              <div className="mt-8 flex size-10 items-center justify-center rounded-lg border border-border">
                <Icon className="size-4" />
              </div>

              {/* World name in its own display face */}
              <h3
                className={`mt-6 max-w-md text-4xl uppercase leading-none sm:text-5xl ${displayFontClass[world.display] ?? 'font-heading'
                  }`}
              >
                {world.label}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{world.line}</p>

              {/* Comics in this world */}
              {comics.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {comics.map((comic) => (
                    <li key={comic.slug}>
                      <Link
                        href={comicHref(comic)}
                        className="inline-flex rounded-full border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {comicName(comic)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={worldHref(world)}
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-foreground px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-85"
              >
                Explore {world.label} <FiArrowUpRight className="size-3.5" />
              </Link>
            </div>

            {/* Artwork */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
              {image ? (
                <Image
                  src={image}
                  alt={`${world.label} artwork`}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  [Placeholder: {world.label} artwork]
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}