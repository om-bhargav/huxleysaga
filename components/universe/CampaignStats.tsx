'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { RollingNumber } from '@/components/shared/RollingNumber';
import type { Universe } from '@/config/universes';
import { Block } from './Block';
import { UniverseHeading } from '../universes/UniverseTheme';
import Flicker from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

const line = 'color-mix(in srgb, var(--u-paper) 15%, transparent)';

type Issue = Universe['campaign'][number];

/* 5 ─ Kickstarter stats. Figures come from spec section 8. */
export function CampaignStats({ universe }: { universe: Universe }) {
  return (
    <Block id="campaign" index={5} label="Kickstarter stats">
      <ul className="grid gap-3 lg:grid-cols-2">
        {universe.campaign.map((issue, i) => (
          <IssueCard key={issue.title} issue={issue} offset={(i % 2) * 0.12} />
        ))}
      </ul>
    </Block>
  );
}

function IssueCard({ issue, offset }: { issue: Issue; offset: number }) {
  // One trigger per card, so title, stats, bar and footnote play in order off the same moment
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  // Bar shows how funded it is; anything over 100% fills it, while the real % stays in the stat
  const fill = Math.min(issue.funded ?? 100, 100) / 100;

  /* Each stat cell flickers on in turn; the label keeps its own dimming inside */
  const cell = (index: number) => ({ active: inView, delay: offset + 0.3 + index * 0.1 });

  return (
    <li ref={ref} className="border p-3.5 lg:p-6" style={{ borderColor: line }}>
      <UniverseHeading as="h3" className="text-xl lg:text-2xl">
        <Flicker as="span" active={inView} delay={offset} className="block">
          {issue.title}
        </Flicker>
      </UniverseHeading>

      {issue.raised ? (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-6 font-heading uppercase sm:grid-cols-4">
            <Flicker {...cell(0)}>
              <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Raised</dt>
              <dd className="mt-2 text-xl lg:text-2xl" style={{ color: 'var(--u-accent)' }}>
                {/* Money flips up character by character in 3D */}
                <Reveal3D as="span" split="chars" text={issue.raised} active={inView} delay={offset + 0.35} className="block" />
              </dd>
            </Flicker>

            <Flicker {...cell(1)}>
              <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Backers</dt>
              <dd className="mt-2 text-xl tabular-nums lg:text-2xl">
                <RollingNumber value={issue.backers ?? 0} delay={150} />
              </dd>
            </Flicker>

            <Flicker {...cell(2)}>
              <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Funded</dt>
              <dd className="mt-2 text-xl tabular-nums lg:text-2xl">
                <RollingNumber value={issue.funded ?? 0} suffix="%" delay={150} />
              </dd>
            </Flicker>

            <Flicker {...cell(3)}>
              <dt className="text-[10px] tracking-widest opacity-50 sm:text-[11px]">Goal</dt>
              <dd className="mt-2 text-xl lg:text-2xl">
                <Reveal3D as="span" split="chars" text={String(issue.goal ?? '')} active={inView} delay={offset + 0.65} className="block" />
              </dd>
            </Flicker>
          </dl>

          {/* Funding bar: track flickers on, then the fill sweeps across */}
          <Flicker active={inView} delay={offset + 0.7} className="relative mt-6 h-1.5" style={{ backgroundColor: line }}>
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: inView ? fill : 0 }}
              transition={{ duration: 1.2, ease, delay: offset + 0.9 }}
              style={{ width: '100%', originX: 0, backgroundColor: 'var(--u-accent)' }}
              className="absolute inset-y-0 left-0"
            />
          </Flicker>

          {/* Dates: each word unfolds upright in 3D (no opacity animation, so opacity-50 stays) */}
          {issue.ran && (
            <Reveal3D
              as="p"
              text={issue.ran}
              active={inView}
              delay={offset + 1.1}
              className="mt-4 font-heading text-[10px] uppercase tracking-widest opacity-50 sm:text-[11px]"
            />
          )}
        </>
      ) : (
        issue.status && (
          <Reveal3D
            as="p"
            text={issue.status}
            active={inView}
            delay={offset + 0.3}
            className="mt-6 font-heading text-[11px] uppercase tracking-widest opacity-60 sm:text-[13px]"
          />
        )
      )}
    </li>
  );
}