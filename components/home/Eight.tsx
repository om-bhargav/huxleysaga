'use client';

import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { Divider } from '@/components/shared/Divider';
import { RollingNumber } from '@/components/shared/RollingNumber';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  description: string;
};

const stats: Stat[] = [
  {
    value: 36,
    prefix: '$',
    suffix: 'K+',
    label: 'Raised',
    description: '$36,000+ raised across our Kickstarter campaigns, funded by readers who wanted these stories to exist.',
  },
  {
    value: 3,
    suffix: 'K+',
    label: 'Followers',
    description: '3,000+ people follow Night O’Clock on Kickstarter, ready for every new launch.',
  },
  {
    value: 780,
    suffix: '+',
    label: 'Backer pledges',
    description: '780+ pledges across every campaign so far, many from readers coming back for the next issue.',
  },
  {
    value: 4,
    label: 'Issues funded',
    description: 'Four issues funded so far, with two more on the way.',
  },
];

type Campaign = {
  title: string;
  status: 'Funded' | 'Coming soon';
  raised?: string;
  backers?: number;
  href: string;
};

/* PLACEHOLDER campaigns: swap in the real titles, numbers and Kickstarter links */
const campaigns: Campaign[] = [
  { title: 'Agent Scarlett #1', status: 'Funded', raised: '$12,400', backers: 260, href: '#' },
  { title: 'Venom Vixens #1', status: 'Funded', raised: '$9,800', backers: 210, href: '#' },
  { title: 'Chains of Fate #1', status: 'Funded', raised: '$7,900', backers: 170, href: '#' },
  { title: 'Boundless Loop #1', status: 'Funded', raised: '$6,100', backers: 145, href: '#' },
];

/**
 * Fade-up for one card. Each card triggers on its own when it scrolls into
 * view, so none of them can get stuck hidden waiting on the parent list.
 */
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease, delay },
});

/* Short bright ticks on the four corners of a card */
function CornerTicks() {
  const tick = 'absolute h-px w-1.5 bg-foreground/40';
  return (
    <span aria-hidden="true" className="pointer-events-none">
      <span className={`${tick} -left-px -top-px`} />
      <span className={`${tick} -right-px -top-px`} />
      <span className={`${tick} -bottom-px -left-px`} />
      <span className={`${tick} -bottom-px -right-px`} />
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="px-3 py-10 uppercase text-white">
      <Divider />

      <motion.h2
        {...rise()}
        className="mt-3 text-center text-3xl tracking-wide lg:text-4xl"
      >
        Kickstarter journey
      </motion.h2>

      {/* Count-up stats — all four across the full width */}
      <ul className="mt-12 grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.li
            key={stat.label}
            {...rise(i * 0.12)}
            className="relative flex min-h-[250px] w-full flex-col border border-white/10 p-3"
          >
            <CornerTicks />

            {/* Grey box hugging the number */}
            <span className="self-start font-heading bg-foreground/5 px-1.5 text-[clamp(2.75rem,4.5vw,5rem)] font-light">
              {stat.prefix}
              <RollingNumber value={stat.value} suffix={stat.suffix} delay={i * 150} />
            </span>

            <h3 className="mt-auto pt-12 text-lg tracking-wide lg:text-xl">{stat.label}</h3>
            <p className="mt-2 text-[10px] leading-relaxed tracking-wider text-white/50 sm:text-xs">
              {stat.description}
            </p>
          </motion.li>
        ))}
      </ul>

      {/* Campaign cards */}
      <motion.h2 {...rise()} className="mt-16 text-center text-3xl tracking-wide lg:text-4xl">
        Campaigns
      </motion.h2>

      <ul className="mt-12 grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {campaigns.map((c, i) => (
          <motion.li key={c.title} {...rise(i * 0.12)} className="relative border border-white/10">
            <CornerTicks />
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full min-h-[180px] flex-col p-3 outline-none transition-colors hover:bg-foreground/5 focus-visible:bg-foreground/5"
            >
              <span
                className={`self-start px-1.5 py-0.5 text-[10px] tracking-wider ${
                  c.status === 'Funded' ? 'bg-foreground text-background' : 'bg-foreground/10 text-white/70'
                }`}
              >
                {c.status}
              </span>

              <span className="mt-auto pt-10 font-heading text-xl tracking-wide lg:text-2xl">{c.title}</span>

              <span className="mt-2 flex items-end justify-between gap-3 text-[10px] tracking-wider text-white/50 sm:text-xs">
                <span>
                  {c.raised ? `${c.raised} raised` : 'Launching soon'}
                  {c.backers ? ` · ${c.backers} backers` : ''}
                </span>
                <FiArrowUpRight className="size-4 shrink-0 text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}