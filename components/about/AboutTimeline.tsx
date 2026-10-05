'use client';

import { motion } from 'framer-motion';
import { GlitchImage, GlitchScope, useGlitchTrigger } from '@/components/shared/GlitchImage'; // adjust path
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path

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
    title: 'Original Huxley Drawing',
    text: 'The first HUXLEY robot concept is created, planting the seed for the larger world, characters, and mythology that would grow into the HUXLEY universe.',
    image: still('huxley-2014-original-drawing'),
  },
  {
    year: '2017',
    title: 'Huxley Writing & Illustration',
    text: 'The HUXLEY graphic novel continues to take shape, meticulously crafted page by page as the story unfolds.',
    image: still('huxley-2017-writing'),
  },
  {
    year: '2020',
    title: 'Huxley Teaser MAX',
    text: 'Early Huxley teaser trailer of MAX directed by Sava Zivkovic.',
    image: still('huxley-2020-teaser-max'),
  },
  {
    year: '2022',
    title: 'Huxley Cinematic Trailer',
    text: 'Huxley cinematic trailer directed by Sava Zivkovic.',
    image: still('huxley-2022-cinematic-trailer'),
  },
  {
    year: '2022',
    title: 'Huxley Single Issues',
    text: 'Original six-part digital comic series introducing Max, Kai, HUXLEY, FURY-7, and the machine-ruled wasteland. Limited edition author edition physicals.',
    image: still('huxley-2022-single-issues'),
  },
  {
    year: '2022',
    title: 'Huxley Deluxe Editions',
    text: 'Read-Only Memory hardcover and deluxe collector editions of the original HUXLEY graphic novel.',
    image: still('huxley-2022-deluxe-editions'),
  },
  {
    year: '2024',
    title: 'Huxley: The Oracle Trailer',
    text: 'Main official cinematic trailer for the Oracle era of the HUXLEY universe directed by Syama Pedersen.',
    image: still('huxley-2024-oracle-trailer'),
  },
  {
    year: '2024',
    title: 'Huxley Standard Editions',
    text: 'Standard print edition of the original HUXLEY graphic novel released worldwide through Thames & Hudson, Amazon, and major bookstores.',
    image: still('huxley-2024-standard-editions'),
  },
  {
    year: '2025',
    title: 'Huxley: The Oracle',
    text: 'Read-Only Memory / Volume hardcover and deluxe collector editions of the first HUXLEY prequel book.',
    image: still('huxley-2025-the-oracle'),
  },
  {
    year: '2025',
    title: 'Huxley: The Oracle Softcover',
    text: 'Standard edition (softcover) of HUXLEY: The Oracle was globally released. It debuted through Amazon and bookstores.',
    image: still('huxley-2025-oracle-softcover'),
  },
  {
    year: '2027',
    title: 'Huxley: Dreamwalkers',
    text: 'Next major book release in the HUXLEY saga, continuing the first prequel arc.',
    image: still('huxley-2027-dreamwalkers'),
    upcoming: true,
  },
  {
    year: '2028',
    title: 'Huxley: Stormshield',
    text: 'Next major book release in the HUXLEY saga, beginning the second prequel arc.',
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
    <section className="px-3 font-heading uppercase">
      <SectionIntro title="Huxley Timeline" aside={`[${String(entries.length).padStart(2, '0')}]`} />

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
