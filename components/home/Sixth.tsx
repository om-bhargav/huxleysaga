'use client';

import { motion, type Variants } from 'framer-motion';
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type PressItem = {
  outlet: string;
  headline: string;
  href: string;
};

const press: PressItem[] = [
  { outlet: 'IGN', headline: 'HUXLEY: The Oracle', href: 'https://www.ign.com/comics/huxley-the-oracle' },
  {
    outlet: 'Cartoon Brew',
    headline: "From 'Astartes' To 'Huxley': Ben Mauro And Digital Bones On Creating The Animated Trailer For 'The Oracle'",
    href: 'https://www.cartoonbrew.com/shorts/huxley-the-oracle-ben-mauro-digital-bones-259019.html',
  },
  {
    outlet: 'Military.com',
    headline: "Huxley: The Oracle Is an Origin Story for Ben Mauro's Epic Sci-Fi Universe",
    href: 'https://www.military.com/off-duty/games/huxley-oracle-origin-story-ben-mauros-epic-sci-fi-universe-exclusive.html',
  },
  {
    outlet: 'GameRant',
    headline: "Huxley: The Oracle Is an Origin Story for Ben Mauro's Epic Sci-Fi Universe",
    href: 'https://gamerant.com/huxley-the-oracle-origin-story-ben-mauro-sci-fi-prequel-graphic-novel-art/',
  },
  {
    outlet: 'Monkeys Fighting Robots',
    headline: 'Sci-Fi Epic HUXLEY: THE ORACLE Available Now',
    href: 'https://monkeysfightingrobots.co/sci-fi-epic-huxley-the-oracle-available-now/',
  },
  {
    outlet: 'Business Wire',
    headline:
      "Ben Mauro's Sci-Fi Epic 'HUXLEY' Launches Globally with Hardcover & Softcover Editions; New Trailer and Prequel 'The Oracle' Announced for October Release",
    href: 'https://www.businesswire.com/news/home/20250610972522/en/Ben-Mauros-Sci-Fi-Epic-HUXLEY-Launches-Globally-with-Hardcover-Softcover-Editions-New-Trailer-and-Prequel-The-Oracle-Announced-for-October-Release',
  },
  {
    outlet: 'Space.com',
    headline: "Is Ben Mauro's 'Huxley' graphic novel universe the next big thing in sci-fi?",
    href: 'https://www.space.com/entertainment/space-books/is-ben-mauros-huxley-graphic-novel-universe-the-next-big-thing-in-sci-fi-interview',
  },
  {
    outlet: 'IGN',
    headline: 'HUXLEY - Official Graphic Novel Trailer',
    href: 'https://www.ign.com/videos/huxley-official-graphic-novel-trailer',
  },
  {
    outlet: 'The Comic Crush',
    headline: "Concept artist Ben Mauro's world-building comes to comics!",
    href: 'https://www.thecomiccrush.com/graphic-novel-crush/huxley-ben-mauro',
  },
  {
    outlet: 'Press Release Hub',
    headline:
      'Ben Mauro Announces Early Deluxe Hardcover Release of HUXLEY: The Oracle, Featuring Exclusive Art from Top Sci-Fi Artists',
    href: 'https://pressreleasehub.pa.media/article/ben-mauro-announces-early-deluxe-hardcover-release-of-huxley-the-oracle-featuring-exclusive-art-from-top-sci-fi-artists-59513.html',
  },
  {
    outlet: 'Hypebeast',
    headline: 'HUXLEY™: From Graphic Novel to Global Entertainment Franchise',
    href: 'https://hypebeast.com/2022/11/huxley-web3-nft-launch-ben-mauro',
  },
];

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const row: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export default function PressSection() {
  return (
    <section className="grid gap-10 bg-black px-3 py-20 font-heading uppercase text-white lg:grid-cols-[25%_1fr] lg:gap-0">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="self-start text-3xl tracking-wide lg:sticky lg:top-20 lg:text-4xl"
      >
        Press
      </motion.h2>

      <motion.ul
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="border-t border-white/10"
      >
        {press.map((item) => (
          <motion.li key={item.href} variants={row} className="relative border-b border-white/10 bg-neutral-950">
            <HoverGroup>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group grid gap-2 px-2 py-4 text-[10px] tracking-wider focus-visible:outline focus-visible:outline-1 focus-visible:outline-white sm:text-xs lg:grid-cols-[320px_minmax(0,1fr)_auto] lg:items-center lg:gap-6"
              >
                {/* Small marker to the left of the row */}
                <span
                  aria-hidden="true"
                  className="absolute -left-6 top-1/2 hidden size-1 bg-white/60 transition-transform duration-300 group-hover:scale-150 lg:block"
                />

                <span className="font-semibold">
                  <HoverHighlight>{item.outlet}</HoverHighlight>
                </span>

                {/* One line with "…" on desktop, wraps on smaller screens */}
                <span className="min-w-0 text-white/50">
                  <HoverHighlight delay={0.08} className="max-w-full lg:truncate">
                    {item.headline}
                  </HoverHighlight>
                </span>

                {/* Always shown on touch screens; on desktop hidden until the row is hovered or focused */}
                <span className="tracking-widest transition-all duration-300 lg:translate-x-4 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-visible:translate-x-0 lg:group-focus-visible:opacity-100">
                  <HoverHighlight delay={0.16}>View</HoverHighlight>
                </span>
              </a>
            </HoverGroup>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}