'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GlitchImage, GlitchScope } from '@/components/shared/GlitchImage'; // adjust path
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { BracketButton } from '@/components/shared/BracketButton'; // adjust path
import { cardReveal } from '@/components/products/ProductCard'; // adjust path
import { SectionIntro, flicker } from '@/components/shared/SectionIntro'; // adjust path
import { Marquee } from '@/components/shared/Marquee'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

export type Campaign = {
  title: string;
  /** Short line under the title */
  description: string;
  image: string;
  /** Percent of the goal reached, e.g. 412 for 412% funded */
  funded: number;
  /** Amount raised so far, already formatted, e.g. "1.2M" */
  raised: string;
  backers: number;
  daysLeft: number;
  button: { label: string; href: string };
};

const still = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;

/* Placeholder copy: swap in your real campaigns */
const defaultCampaigns: Campaign[] = [
  {
    title: 'The Oracle — Deluxe',
    description:
      'The first prequel novel in a foiled slipcase, packaged with a signed art print and an expanded lore appendix from the creator.',
    image: still('campaign-oracle'),
    funded: 412,
    raised: '1.2M',
    backers: 8420,
    daysLeft: 11,
    button: { label: 'Back the Oracle', href: '/campaigns/the-oracle' },
  },
  {
    title: 'Huxley — Collector Set',
    description:
      'All six issues of the original graphic novel plus the art book, boxed together in a numbered run of 500.',
    image: still('campaign-collector-set'),
    funded: 186,
    raised: '640K',
    backers: 3105,
    daysLeft: 23,
    button: { label: 'Back the set', href: '/campaigns/collector-set' },
  },
  {
    title: 'Ronin — Art Book',
    description:
      'Two hundred pages of concept art, vehicle studies and unused designs from the empire era, printed oversized on uncoated stock.',
    image: still('campaign-ronin-art'),
    funded: 94,
    raised: '310K',
    backers: 1870,
    daysLeft: 6,
    button: { label: 'Back the art book', href: '/campaigns/ronin-art-book' },
  },
];

/** Label above value, in the same muted-key rhythm as the product cards */
function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex flex-col gap-1.5">
      <span className="text-white/40">{label}</span>
      <span className="text-white">{children}</span>
    </p>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <GlitchScope>
      <article className="flex w-[min(86vw,480px)] shrink-0 flex-col border border-white/10 bg-neutral-950 text-white">
        {/* Still from the campaign, glitches when the link below is hovered */}
        <div className="relative aspect-3/2 overflow-hidden">
          <GlitchImage src={campaign.image} alt={campaign.title} sizes="(min-width: 560px) 480px, 86vw" />

          {/* Live tag, blinks like a recording light */}
          <div className="absolute left-3 top-3 flex items-center gap-2 border border-white/20 bg-black/70 px-2 py-1 text-[10px] tracking-widest backdrop-blur-sm sm:text-[11px]">
            <motion.span
              aria-hidden="true"
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              className="size-1.5 bg-white"
            />
            Live
          </div>

          <span className="absolute right-3 top-3 border border-white/20 bg-black/70 px-2 py-1 text-[10px] tracking-widest backdrop-blur-sm sm:text-[11px]">
            {campaign.daysLeft}D Left
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="text-lg tracking-wide lg:text-xl">{campaign.title}</h3>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed tracking-wider text-white/40 sm:text-sm">
            {campaign.description}
          </p>

          {/* Funding progress */}
          <div className="mt-6">
            <div className="flex items-end justify-between text-[11px] tracking-widest sm:text-[13px]">
              <span className="text-white/40">Funded</span>
              <RollingNumber value={campaign.funded} suffix="%" delay={200} className="text-base lg:text-lg" />
            </div>

            <div className="relative mt-2 h-1.5 bg-white/10">
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 1.2, ease, delay: 0.2 }}
                style={{ width: `${Math.min(campaign.funded, 100)}%`, originX: 0 }}
                className="absolute inset-y-0 left-0 bg-white"
              />
            </div>
          </div>

          {/* Numbers */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-3 text-[11px] tracking-widest sm:text-[13px]">
            <Stat label="Raised">${campaign.raised}</Stat>
            <Stat label="Backers">
              <RollingNumber value={campaign.backers} delay={200} />
            </Stat>
            <Stat label="Ends in">{campaign.daysLeft} Days</Stat>
          </div>

          <div className="mt-5 -ml-1">
            <BracketButton label={campaign.button.label} href={campaign.button.href} />
          </div>
        </div>
      </article>
    </GlitchScope>
  );
}

/**
 * Live campaigns. The heading flickers in word by word like the saga intro,
 * then the cards scroll past on a loop that stops under the cursor.
 */
export default function LiveCampaigns({
  title = 'Live Campaigns',
  /* Placeholder copy: swap in your real text */
  text = 'Three campaigns are funding right now. Back one to help bring the next chapter of the saga into print and claim an edition before it closes.',
  campaigns = defaultCampaigns,
}: {
  title?: string;
  text?: string;
  campaigns?: Campaign[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="overflow-hidden bg-black px-3 pb-10 pt-20 font-heading uppercase">
      <SectionIntro title={title} text={text} aside={`[${String(campaigns.length).padStart(2, '0')}]`} />

      <motion.p
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        variants={flicker}
        custom={0.4}
        className="mt-10 flex items-center gap-2 text-[10px] tracking-widest text-white/40 sm:text-[11px]"
      >
        <span aria-hidden="true" className="size-1 bg-white/40" />
        {reduceMotion ? 'Scroll the row to browse' : 'Hover to pause'}
      </motion.p>

      <motion.div
        variants={cardReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-3"
      >
        <Marquee className="-mx-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.title} campaign={campaign} />
          ))}
        </Marquee>
      </motion.div>
    </section>
  );
}
