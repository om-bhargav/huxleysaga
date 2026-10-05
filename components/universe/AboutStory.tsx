'use client';
import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiPlus, FiX } from 'react-icons/fi';
import type { Universe } from '@/config/universes'; // adjust path
import { RevealImage } from '@/components/shared/RevealImage'; // adjust path
import { Flicker } from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';
import { Block } from './Block';
import { UniverseHeading } from '../universes/UniverseTheme';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

export function AboutStory({ universe }: { universe: Universe }) {
  const [open, setOpen] = useState(false);
  const { headline, text, more } = universe.story;

  /* Add `image?: string` to Universe['story']; until then it falls back to the hero poster */
  const image = universe.story.image ?? universe.hero.poster;

  // One trigger for the text column, so headline, copy and button play in order off the same moment
  const textRef = useRef<HTMLDivElement>(null);
  const inView = useInView(textRef, { once: true, amount: 0.3 });

  return (
    <Block id="story" index={2} label="About the story">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        {/* ───────────── Left: the story ───────────── */}
        <div ref={textRef}>
          {/* Headline decodes through scrambled glyphs, in the universe's display face */}
          <UniverseHeading className="max-w-[22ch] text-[clamp(1.75rem,4.5vw,4rem)]">
            <Flicker as="span" active={inView} className="block">
              {headline}
            </Flicker>
          </UniverseHeading>
          {/* Body: each word unfolds upright in 3D (no opacity animation, so opacity-80 stays) */}
          <Reveal3D
            as="p"
            text={text}
            active={inView}
            delay={0.4}
            stagger={0.012}
            className="mt-8 max-w-[70ch] text-sm leading-relaxed opacity-80 lg:text-base"
          />

          {more && (
            <>
              {/* Height opens the space; the words then unfold into it, and fold away on close */}
              <motion.div
                id="full-story"
                initial={false}
                animate={{ height: open ? 'auto' : 0 }}
                transition={{ duration: 0.45, ease }}
                className="max-w-[70ch] overflow-hidden"
              >
                <Reveal3D
                  as="p"
                  text={more}
                  active={open}
                  delay={0.15}
                  stagger={0.01}
                  className="mt-4 text-sm leading-relaxed opacity-80 lg:text-base"
                />
              </motion.div>

              <Flicker delay={0.9} amount={0.3} className="mt-6">
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-controls="full-story"
                  className="inline-flex items-center gap-2 border px-3 py-2 font-heading text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70 sm:text-[11px]"
                  style={{ borderColor: 'var(--u-accent)' }}
                >
                  {open ? <FiX aria-hidden="true" className="size-3" /> : <FiPlus aria-hidden="true" className="size-3" />}
                  {open ? 'Close' : 'Read the full story'}
                </button>
              </Flicker>
            </>
          )}
        </div>

        {/* ───────────── Right: the image ─────────────
            Sticky on desktop, so it stays beside the text while the full story opens below */}
        <div className="lg:sticky relative lg:top-24 lg:self-start">
          <div
            className="border"
            style={{ borderColor: 'color-mix(in srgb, currentColor 20%, transparent)' }}
          >
            <RevealImage
              glitch
              src={image}
              alt=""
              direction="right-left"
              delay={0.2}
              sizes="(min-width: 1024px) 40vw, 94vw"
              /* Phones: 4:3. Desktop: a fixed height that always fits the screen, so it can stick */
              className="aspect-4/3 lg:aspect-auto lg:h-[min(60svh,520px)]"
            >
              <span
                className="absolute bottom-3 left-3 border bg-black/60 px-2 py-1 font-heading text-[10px] uppercase tracking-widest backdrop-blur-sm sm:text-[11px]"
                style={{ borderColor: 'var(--u-accent)', color: 'var(--u-accent)' }}
              >
                {universe.shortName}
              </span>
            </RevealImage>
          </div>
        </div>
      </div>
    </Block>
  );
}
