'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import type { Universe } from '@/config/universes'; // adjust path
import { UniverseHeading } from '../universes/UniverseTheme';
import { Block } from './Block';
import { GlitchScope, useGlitchTrigger } from '@/components/shared/GlitchImage'; // adjust path
import { RevealImage } from '@/components/shared/RevealImage'; // adjust path
import Reveal3D from '../shared/Reveal3d';
import Flicker from '../shared/FlickerText';
const line = 'color-mix(in srgb, var(--u-paper) 15%, transparent)';

type Face = NonNullable<Universe['face']>;

/* Label blinks out and back on hover, like BracketButton */
const labelFlicker: Variants = {
  rest: { opacity: 1 },
  hover: {
    opacity: [1, 0, 1, 0, 0.6, 1],
    transition: { duration: 0.4, times: [0, 0.15, 0.3, 0.5, 0.7, 1] },
  },
};

/* 6 ─ Face of the comic: the creator or collaborator behind this universe. */
export function FaceOfTheComic({ universe }: { universe: Universe }) {
  const face = universe.face;

  return (
    <Block id="face" index={6} label="Face of the comic">
      {face ? (
        // Scope for this card only: the profile link glitches the portrait, nothing else on the page
        <GlitchScope>
          <FaceCard face={face} />
        </GlitchScope>
      ) : (
        <Reveal3D
          as="p"
          text="[PLACEHOLDER] No creator, artist or collaborator confirmed for this universe yet. Needs a name, photo or video, a short bio, a profile link and their approval."
          stagger={0.012}
          className="max-w-[60ch] text-sm leading-relaxed opacity-60"
        />
      )}
    </Block>
  );
}

function FaceCard({ face }: { face: Face }) {
  // One trigger for the card, so portrait and text play in order off the same moment
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const glitch = useGlitchTrigger();

  return (
    <div
      ref={ref}
      className="grid gap-3 border lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
      style={{ borderColor: line }}
    >
      {/* Portrait wipes up, glitches as it lands, and again when the profile link is hovered */}
      <RevealImage
        glitch
        src={face.image}
        alt={face.name}
        direction="bottom-up"
        sizes="(min-width: 1024px) 38vw, 94vw"
        amount={0.25}
        className="aspect-4/3 lg:aspect-4/5"
      />

      <div className="flex flex-col justify-center p-3.5 lg:p-8">
        <Flicker
          as="span"
          active={inView}
          delay={0.4}
          className="self-start border px-2 py-1 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
          style={{ borderColor: 'var(--u-accent)', color: 'var(--u-accent)' }}
        >
          {face.tag}
        </Flicker>

        {/* Name blinks on in the universe's display face */}
        <UniverseHeading as="h3" className="mt-6 text-[clamp(1.75rem,3.5vw,3rem)]">
          <Flicker as="span" active={inView} delay={0.5} className="block">
            {face.name}
          </Flicker>
        </UniverseHeading>

        {/* Bio: each word unfolds upright in 3D (no opacity animation, so opacity-70 stays) */}
        <Reveal3D
          as="p"
          text={face.bio}
          active={inView}
          delay={0.65}
          stagger={0.012}
          className="mt-4 max-w-[52ch] text-sm leading-relaxed opacity-70"
        />

        {/* Profile link: flickers on last; on hover its label flickers and the portrait glitches */}
        <Flicker active={inView} delay={1.1} className="mt-8 self-start">
          <motion.a
            href={face.href}
            target="_blank"
            rel="noreferrer"
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileFocus="hover"
            {...glitch}
            className="inline-flex items-center gap-2 border px-3 py-2 font-heading text-[10px] uppercase tracking-widest focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 sm:text-[11px]"
            style={{ borderColor: 'var(--u-accent)' }}
          >
            <span aria-hidden="true" className="opacity-70">
              [
            </span>
            <motion.span variants={labelFlicker}>View profile</motion.span>
            <span aria-hidden="true" className="opacity-70">
              ]
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </motion.a>
        </Flicker>
      </div>
    </div>
  );
}