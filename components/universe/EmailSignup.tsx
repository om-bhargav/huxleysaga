'use client';

import { useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import type { Universe } from '@/config/universes'; // adjust path
import { Block } from './Block';
import { UniverseHeading } from '../universes/UniverseTheme';
import { AccentButton } from '@/components/shared/AccentButton'; // adjust path
import { Flicker } from '@/components/shared/FlickerText'; // adjust path
import { Reveal3D } from '@/components/shared/Reveal3d'; // adjust path

/* 8 ─ Email signup, tagged per universe so the list knows which world it came from. */
export function EmailSignup({ universe }: { universe: Universe }) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  // One trigger for the block, so headline, field and button play in order
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <Block id="signup" index={8} label="Email signup">
      <div ref={ref} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        {/* Headline: each word unfolds upright in 3D, in the universe's display face */}
        <UniverseHeading className="max-w-[18ch] text-[clamp(1.5rem,3.5vw,3rem)]">
          <Reveal3D as="span" text={universe.signup.line} active={inView} className="block" />
        </UniverseHeading>

        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: post to the list with tag `${universe.slug}` once the admin panel exists
              setJoined(true);
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            {/* Field and button flicker on one after the other */}
            <Flicker active={inView} delay={0.5} className="flex min-w-0 flex-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={joined}
                placeholder="Enter your email"
                aria-label="Email address"
                className="min-w-0 flex-1 border bg-transparent px-3 py-3 font-heading text-[11px] uppercase tracking-widest transition-colors placeholder:opacity-50 focus:border-[var(--u-accent)] focus-visible:outline-none disabled:opacity-50 sm:text-[13px]"
                style={{ borderColor: 'color-mix(in srgb, var(--u-paper) 25%, transparent)' }}
              />
            </Flicker>

            <Flicker active={inView} delay={0.65} className="flex">
              <AccentButton type="submit" disabled={joined} className="w-full sm:w-auto">
                {/* Keyed, so the new label blinks on when it changes */}
                <Flicker key={joined ? 'joined' : 'join'} as="span" trigger="mount">
                  {joined ? 'Joined ✓' : '[ Join ]'}
                </Flicker>
              </AccentButton>
            </Flicker>
          </form>

          {/* Confirmation unfolds in 3D under the form once they're in */}
          {joined && (
            <Reveal3D
              as="p"
              text={`You're on the list for ${universe.name}.`}
              trigger="mount"
              className="mt-4 font-heading text-[10px] uppercase tracking-widest opacity-70 sm:text-[11px]"
            />
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {joined ? 'Thanks — you are on the list.' : ''}
      </p>
    </Block>
  );
}