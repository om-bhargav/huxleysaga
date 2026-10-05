'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Universe } from '@/config/universes';
import { BlockLabel, UniverseHeading } from '../universes/UniverseTheme';
import Flicker from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';
import { AccentButton, Corners } from '@/components/shared/AccentButton'; // adjust path

/* 7 ─ Kickstarter CTA. Button wording follows the campaign-state logic in spec section 5. */
export function CampaignCta({ universe }: { universe: Universe }) {
  // One trigger for the frame, so border, corners, text and buttons play in order
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="back" className="scroll-mt-14 px-3">
      <motion.div
        ref={ref}
        initial="rest"
        animate={inView ? 'hover' : 'rest'}
        className="relative p-3.5 lg:p-10"
      >
        {/* Accent frame flickers on like a failing light */}
        <Flicker
          active={inView}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 border"
          style={{ borderColor: 'var(--u-accent)' }}
        />
        {/* Camera-style corner brackets fly in from outside and lock on */}
        <Corners size="size-4" distance={5} delay={0.3} />

        <Flicker active={inView} delay={0.2}>
          <BlockLabel index={7}>Back the campaign</BlockLabel>
        </Flicker>

        {/* Headline: each word unfolds upright in 3D, in the universe's display face */}
        <UniverseHeading className="mt-8 max-w-[24ch] text-[clamp(1.75rem,4.5vw,4rem)]">
          <Reveal3D as="span" text={universe.cta.headline} active={inView} delay={0.35} className="block" />
        </UniverseHeading>

        <div className="mt-10 flex flex-wrap gap-4 ">
          {universe.cta.buttons.map((button, i) => (
            <Flicker key={button.label} active={inView} delay={0.9 + i * 0.12}>
              <AccentButton href={button.href}>[ {button.label} ]</AccentButton>
            </Flicker>
          ))}
        </div>
      </motion.div>
    </section>
  );
}