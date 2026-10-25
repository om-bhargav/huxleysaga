'use client';

import { motion } from 'framer-motion';
import { GlitchImage, GlitchScope, useGlitchTrigger } from '@/components/shared/GlitchImage'; // adjust path
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path
import { SITE_NAME } from '@/config';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* Placeholder art: swap in the real still for each milestone */
const still = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

type Entry = {
  year: string;
  title: string;
  text: string;
  image: string;
  /** Announced but not out yet */
  upcoming?: boolean;
};

const entries: Entry[] = [
  {
    year: '2014',
    title: `Original ${SITE_NAME} Drawing`,
    text: `The first ${SITE_NAME} robot concept is created, planting the seed for the larger world, characters, and mythology that would grow into the ${SITE_NAME} universe.`,
    image: still('huxley-2014-original-drawing'),
  },
  {
    year: '2017',
    title: `${SITE_NAME} Writing & Illustration`,
    text: `The ${SITE_NAME} graphic novel continues to take shape, meticulously crafted page by page as the story unfolds.`,
    image: still('huxley-2017-writing'),
  },
  {
    year: '2020',
    title: `${SITE_NAME} Teaser MAX`,
    text: `Early ${SITE_NAME} teaser trailer of MAX directed by Sava Zivkovic.`,
    image: still('huxley-2020-teaser-max'),
  },
  {
    year: '2022',
    title: `${SITE_NAME} Cinematic Trailer`,
    text: `${SITE_NAME} cinematic trailer directed by Sava Zivkovic.`,
    image: still('huxley-2022-cinematic-trailer'),
  },
  {
    year: '2022',
    title: `${SITE_NAME} Single Issues`,
    text: `Original six-part digital comic series introducing Max, Kai, ${SITE_NAME}, FURY-7, and the machine-ruled wasteland. Limited edition author edition physicals.`,
    image: still('huxley-2022-single-issues'),
  },
  {
    year: '2022',
    title: `${SITE_NAME} Deluxe Editions`,
    text: `Read-Only Memory hardcover and deluxe collector editions of the original ${SITE_NAME} graphic novel.`,
    image: still('huxley-2022-deluxe-editions'),
  },
  {
    year: '2024',
    title: `${SITE_NAME}: The Oracle Trailer`,
    text: `Main official cinematic trailer for the Oracle era of the ${SITE_NAME} universe directed by Syama Pedersen.`,
    image: still('huxley-2024-oracle-trailer'),
  },
  {
    year: '2024',
    title: `${SITE_NAME} Standard Editions`,
    text: `Standard print edition of the original ${SITE_NAME} graphic novel released worldwide through Thames & Hudson, Amazon, and major bookstores.`,
    image: still('huxley-2024-standard-editions'),
  },
  {
    year: '2025',
    title: `${SITE_NAME}: The Oracle`,
    text: `Read-Only Memory / Volume hardcover and deluxe collector editions of the first ${SITE_NAME} prequel book.`,
    image: still('huxley-2025-the-oracle'),
  },
  {
    year: '2025',
    title: `${SITE_NAME}: The Oracle Softcover`,
    text: `Standard edition (softcover) of ${SITE_NAME}: The Oracle was globally released. It debuted through Amazon and bookstores.`,
    image: still('huxley-2025-oracle-softcover'),
  },
  {
    year: '2027',
    title: `${SITE_NAME}: Dreamwalkers`,
    text: `Next major book release in the ${SITE_NAME} saga, continuing the first prequel arc.`,
    image: still('huxley-2027-dreamwalkers'),
    upcoming: true,
  },
  {
    year: '2028',
    title: `${SITE_NAME}: Stormshield`,
    text: `Next major book release in the ${SITE_NAME} saga, beginning the second prequel arc.`,
    image: still('huxley-2028-stormshield'),
    upcoming: true,
  },
];

/** Thumbnail that glitches when anything in its row is hovered or focused. */
function RowThumb({ entry }: { entry: Entry }) {
  const glitch = useGlitchTrigger();

  return (
    <div
      {...glitch}
      className="relative aspect-3/2 w-24 shrink-0 overflow-hidden border border-white/10 max-md:w-20"
    >
      <GlitchImage src={entry.image} alt="" sizes="96px" />
      {entry.upcoming && <div aria-hidden="true" className="absolute inset-0 bg-black/50" />}
    </div>
  );
}

/** The saga year by year, as ruled rows: still, year, title, note. */
export default function AboutTimeline() {
  return (
    <section className="px-3 uppercase">
      <SectionIntro title={`${SITE_NAME} Timeline`} />

      <motion.ol
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
        className="mt-12 border-t border-white/10"
      >
        {entries.map((entry) => (
          <motion.li
            key={entry.title}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
            }}
            className="border-b border-white/10"
          >
            <GlitchScope>
              <HoverGroup className="grid gap-x-3 gap-y-4 py-5 text-white transition-colors hover:bg-white/3 md:grid-cols-[6rem_5rem_minmax(0,1fr)_minmax(0,1.6fr)] md:items-center md:px-1">
                <RowThumb entry={entry} />

                <p className="text-[11px] tracking-widest text-white/40 sm:text-[13px]">
                  <HoverHighlight className="-ml-1">{entry.year}</HoverHighlight>
                </p>

                <h3 className="flex flex-wrap items-center gap-2 text-base tracking-wide lg:text-lg">
                  <HoverHighlight className="-ml-1" delay={0.05}>
                    {entry.title}
                  </HoverHighlight>
                  {entry.upcoming && (
                    <span className="border border-white/20 px-1.5 py-0.5 text-[9px] tracking-widest text-white/50 sm:text-[10px]">
                      Upcoming
                    </span>
                  )}
                </h3>

                <p className="text-xs leading-relaxed tracking-wider text-white/40 sm:text-sm">{entry.text}</p>
              </HoverGroup>
            </GlitchScope>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
