'use client';

import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GlitchImage, GlitchScope } from '@/components/shared/GlitchImage'; // adjust path
import { RollingNumber } from '@/components/shared/RollingNumber'; // adjust path
import { BracketButton } from '@/components/shared/BracketButton'; // adjust path
import { cardReveal } from '@/components/products/ProductCard'; // adjust path
import { SectionIntro, flicker } from '@/components/shared/SectionIntro'; // adjust path
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Keyboard, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import { useCampaigns } from '@/hooks/useCampaigns';
import type { CampaignDTO } from '@/lib/campaigns/types';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

export type Campaign = {
  id: string;
  title: string;
  /** Short line under the title */
  description: string;
  image: string;
  /** Percent of the goal reached, e.g. 412 for 412% funded */
  funded: number;
  /** Amount raised so far, already formatted, e.g. "1.2M" */
  raised: string;
  backers: number;
  /** null when the campaign has no end date */
  daysLeft: number | null;
  button: { label: string; href: string };
};

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** API campaign → card props */
const toCard = (c: CampaignDTO): Campaign => ({
  id: c.id,
  title: c.title,
  description: c.description,
  image: c.image,
  funded: c.funded,
  raised: compact.format(c.raised),
  backers: c.backers,
  daysLeft: c.daysLeft,
  button: { label: c.buttonLabel, href: c.buttonHref },
});

/** Label above value, in the same muted-key rhythm as the product cards */
function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="flex flex-col gap-1.5">
      <span className="text-white/40">{label}</span>
      <span className="text-white">{children}</span>
    </p>
  );
}

function CampaignCard({ campaign, className = 'w-full' }: { campaign: Campaign; className?: string }) {
  return (
    <GlitchScope>
      <article className={`flex shrink-0 flex-col border border-white/10 bg-neutral-950 text-white ${className}`}>
        {/* Still from the campaign, glitches when the link below is hovered */}
        <div className="relative aspect-3/2 overflow-hidden">
          <GlitchImage
            src={campaign.image}
            alt={campaign.title}
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          />

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

          {campaign.daysLeft !== null && (
            <span className="absolute right-3 top-3 border border-white/20 bg-black/70 px-2 py-1 text-[10px] tracking-widest backdrop-blur-sm sm:text-[11px]">
              {campaign.daysLeft}D Left
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="text-lg tracking-wide lg:text-xl">{campaign.title}</h3>
          <p className="mt-2 flex-1 line-clamp-2 text-xs leading-relaxed tracking-wider text-white/40 sm:text-sm">
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
            <Stat label="Ends in">{campaign.daysLeft === null ? '—' : `${campaign.daysLeft} Days`}</Stat>
          </div>

          <div className="mt-5 -ml-1">
            <BracketButton target="_blank" label={campaign.button.label} href={campaign.button.href} />
          </div>
        </div>
      </article>
    </GlitchScope>
  );
}

/** Same shape and size as CampaignCard, so nothing jumps when the real cards arrive */
function CampaignSkeleton({ className = 'w-full' }: { className?: string }) {
  const bar = 'animate-pulse bg-white/10';
  return (
    <div aria-hidden="true" className={`flex shrink-0 flex-col border border-white/10 bg-neutral-950 ${className}`}>
      <div className="aspect-3/2 animate-pulse bg-white/5" />

      <div className="flex flex-1 flex-col p-3.5">
        <div className={`h-6 w-2/3 ${bar}`} />
        <div className="mt-3 h-3 w-full animate-pulse bg-white/5" />
        <div className="mt-2 h-3 w-4/5 animate-pulse bg-white/5" />

        <div className="mt-6 flex items-end justify-between">
          <div className="h-3 w-14 animate-pulse bg-white/5" />
          <div className={`h-5 w-12 ${bar}`} />
        </div>
        <div className="mt-2 h-1.5 bg-white/10" />

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3 w-1/2 animate-pulse bg-white/5" />
              <div className={`h-4 w-3/4 ${bar}`} />
            </div>
          ))}
        </div>

        <div className={`mt-5 h-6 w-36 ${bar}`} />
      </div>
    </div>
  );
}

/** Shown when the request finished but nothing is live */
function NoCampaigns() {
  return (
    <motion.div
      variants={cardReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="mt-10 flex min-h-56 flex-col justify-center gap-3 border border-white/10 bg-neutral-950 p-5 text-white sm:p-8"
    >
      <p className="flex items-center gap-2 text-[10px] tracking-widest text-white/40 sm:text-[11px]">
        <span aria-hidden="true" className="size-1.5 bg-white/40" />
        Offline
      </p>
      <p className="text-lg tracking-wide lg:text-2xl">No campaigns are live right now</p>
      <p className="max-w-xl text-xs leading-relaxed tracking-wider text-white/40 sm:text-sm">
        The next story is already in the works. Check back soon to back it first.
      </p>
    </motion.div>
  );
}

// How long each position stays on screen before the swiper moves on
const AUTOPLAY_DELAY = 12_000; // ms

/**
 * One card on phones, two on tablets, three on wide screens.
 * Drag, swipe, scroll sideways, or use the arrow keys; it advances on its own
 * and pauses while the cursor is over it.
 */
function CampaignSwiper({ campaigns }: { campaigns: Campaign[] }) {
  const reduceMotion = useReducedMotion();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [active, setActive] = useState(0);
  // Number of positions it can stop at: fewer than the number of cards when several are visible
  const [stops, setStops] = useState(1);

  const sync = (instance: SwiperInstance) => {
    setActive(instance.snapIndex);
    setStops(instance.snapGrid.length);
  };

  return (
    <div>
      <Swiper
        modules={[Autoplay, Keyboard, Mousewheel]}
        onSwiper={(instance) => {
          setSwiper(instance);
          sync(instance);
        }}
        onSlideChange={sync}
        onSnapGridLengthChange={sync}
        slidesPerView={1}
        spaceBetween={12}
        breakpoints={{
          768: { slidesPerView: 2 },
          1280: { slidesPerView: 3 },
        }}
        rewind
        grabCursor
        keyboard={{ enabled: true, onlyInViewport: true }}
        mousewheel={{ forceToAxis: true }}
        autoplay={
          reduceMotion
            ? false
            : { delay: AUTOPLAY_DELAY, disableOnInteraction: false, pauseOnMouseEnter: true }
        }
      >
        {campaigns.map((campaign) => (
          /* h-auto + flex keeps every card in a row the same height */
          <SwiperSlide key={campaign.id} className="flex! h-auto! *:w-full">
            <CampaignCard campaign={campaign} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* One bar per position, the current one lit. Hidden when everything already fits. */}
      {stops > 1 && (
        <div className="mt-2 flex">
          {Array.from({ length: stops }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show campaigns from ${i + 1}`}
              aria-current={i === active}
              onClick={() => swiper?.slideTo(i)}
              className="py-2 pr-1.5"
            >
              <span
                className={`block h-0.5 w-6 transition-colors duration-300 ${i === active ? 'bg-white' : 'bg-white/15'}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Live campaigns. The heading flickers in word by word like the saga intro,
 * then the cards sit in a swiper: one at a time on phones, two or three side
 * by side on larger screens, advancing on their own.
 *
 * While loading, skeleton cards hold the space; if nothing is live, a short notice is shown.
 */
export default function LiveCampaigns({
  title = 'Live Campaigns',
  /* Placeholder copy: swap in your real text */
  text = 'Three campaigns are live right now, each bringing a new story to life. Back your favourite, help turn ink and imagination into something real, and claim your edition before the final page turns.',
  emptyText = 'Every story starts with a campaign. Nothing is live at the moment, but new worlds are always in the making.',
  campaigns: campaignsProp,
}: {
  title?: string;
  text?: string;
  /** Intro text used instead of `text` when no campaign is live */
  emptyText?: string;
  /** Pass campaigns to skip fetching; otherwise the LIVE ones come from /api/campaigns */
  campaigns?: Campaign[];
}) {
  const { campaigns: live, isLoading } = useCampaigns(campaignsProp ? null : { status: 'LIVE' });
  const campaigns = campaignsProp ?? live.map(toCard);

  const loading = !campaignsProp && isLoading;
  const empty = !loading && campaigns.length === 0;

  return (
    <section className="overflow-hidden px-3 py-10 uppercase">
      <SectionIntro title={title} text={empty ? emptyText : text} />

      {empty ? (
        <NoCampaigns />
      ) : (
        <>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={flicker}
            custom={0.4}
            className="mt-10 flex items-center gap-2 text-[10px] tracking-widest text-white/40 sm:text-[11px]"
          >
            <span aria-hidden="true" className="size-1 bg-white/40" />
            {loading ? (
              <span>Loading campaigns</span>
            ) : (
              <>
                <span className="md:hidden">Swipe to browse</span>
                <span className="max-md:hidden">Drag to browse</span>
              </>
            )}
          </motion.p>

          {loading ? (
            /* Same columns as the swiper: one on phones, two on tablets, three on wide screens */
            <div
              role="status"
              aria-label="Loading campaigns"
              className="mt-3 grid gap-3 overflow-hidden md:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <CampaignSkeleton
                  key={i}
                  className={`w-full ${i > 0 ? 'max-md:hidden' : ''} ${i > 1 ? 'max-xl:hidden' : ''}`}
                />
              ))}
            </div>
          ) : (
            <motion.div
              variants={cardReveal}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-3"
            >
              <CampaignSwiper campaigns={campaigns} />
            </motion.div>
          )}
        </>
      )}
    </section>
  );
}