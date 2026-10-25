'use client';
import Link from 'next/link';
import { FiArrowUpRight, FiPlay } from 'react-icons/fi';
import { UniverseHeading } from '@/components/universes/UniverseTheme'; // adjust path
import type { Universe } from '@/config/universes'; // adjust path
import { RevealImage } from '@/components/shared/RevealImage'; // adjust path
import { Flicker } from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';

export function IntroVideo({ universe }: { universe: Universe }) {
  /* The video isn't played here; it's only linked */
  const videoHref = universe.hero.video;

  return (
    <section
      id="intro"
      /* contain-paint clips everything inside, including clip-path and 3D-transformed layers,
         which iOS Safari can let slip past overflow-hidden and cause sideways scroll */
      className="relative isolate h-svh min-h-[560px] w-full max-w-full overflow-hidden [contain:paint]"
    >
      {/* Above the fold, so it reveals on load instead of waiting to be scrolled into view */}
      <div className="absolute inset-0 overflow-hidden">
        <RevealImage
          src={universe.hero.poster}
          alt=""
          direction="bottom-up"
          trigger="mount"
          priority
          sizes="100vw"
          className="size-full"
        >
          {/* Overlays live inside the reveal, so they wipe in with the picture rather than sitting on black */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, var(--u-ink) 4%, transparent 60%)` }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
        </RevealImage>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 min-w-0 p-3 pb-10 lg:p-8">
        {/* Overline: blinks on as the wipe lands. Flicker owns opacity, so the dimming sits on the span */}
        {universe.overline && (
          <Flicker
            as="p"
            trigger="mount"
            delay={0.45}
            className="font-heading text-[11px] uppercase tracking-widest sm:text-[13px]"
          >
            <span className="opacity-70">{universe.overline}</span>
          </Flicker>
        )}

        {/* Name: blinks on in the universe's own display face.
            Long names in a wide face can be wider than a phone, so they're allowed to wrap. */}
        <Flicker trigger="mount" delay={0.55}>
          <UniverseHeading
            as="h1"
            className="mt-2 text-[clamp(2.25rem,10vw,7.5rem)] [overflow-wrap:anywhere] sm:text-[clamp(2.5rem,8vw,7.5rem)]"
          >
            {universe.name}
          </UniverseHeading>
        </Flicker>

        {/* Genre and hook: each word unfolds upright in 3D, scale and rotation only */}
        <Reveal3D
          as="p"
          text={`${universe.genre} · ${universe.hook}`}
          trigger="mount"
          delay={0.9}
          className="mt-4 max-w-[46ch] font-heading text-[11px] uppercase leading-relaxed tracking-widest opacity-80 sm:text-[13px]"
        />

        {/* Watch button: only when this universe has a video link. Blinks on last, opens the video in a new tab. */}
        {videoHref && (
          <Flicker trigger="mount" delay={1.3} className="mt-6">
            <Link
              href={videoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative isolate inline-flex max-w-full items-center gap-2.5 overflow-hidden border border-[var(--u-accent)] px-3.5 py-2.5 font-heading text-[10px] uppercase tracking-widest text-[var(--u-accent)] transition-colors duration-300 hover:text-[var(--u-ink)] focus-visible:text-[var(--u-ink)] focus-visible:outline-none sm:text-[11px]"
            >
              {/* Accent fill wipes in from the left on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-[var(--u-accent)] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <FiPlay aria-hidden="true" className="size-3 shrink-0 transition-transform duration-300 group-hover:scale-125" />
              Watch the intro
              <FiArrowUpRight
                aria-hidden="true"
                className="size-3 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </Flicker>
        )}
      </div>
    </section>
  );
}