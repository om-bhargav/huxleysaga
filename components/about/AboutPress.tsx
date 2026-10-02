'use client';

import { motion } from 'framer-motion';
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Feature = { outlet: string; title: string; href: string };

/* TODO: drop in each article's real URL */
const features: Feature[] = [
  { outlet: 'IGN', title: 'Huxley: The Oracle', href: '#' },
  {
    outlet: 'Cartoon Brew',
    title:
      "From 'Astartes' To 'Huxley': Ben Mauro And Digital Bones On Creating The Animated Trailer For 'The Oracle'",
    href: '#',
  },
  {
    outlet: 'Military.com',
    title: "Huxley: The Oracle Is an Origin Story for Ben Mauro's Epic Sci-Fi Universe",
    href: '#',
  },
  {
    outlet: 'GameRant',
    title: "Huxley: The Oracle Is an Origin Story for Ben Mauro's Epic Sci-Fi Universe",
    href: '#',
  },
  { outlet: 'Monkeys Fighting Robots', title: 'Sci-Fi Epic Huxley: The Oracle Available Now', href: '#' },
  {
    outlet: 'Business Wire',
    title:
      "Ben Mauro's Sci-Fi Epic 'Huxley' Launches Globally with Hardcover & Softcover Editions; New Trailer & Prequel",
    href: '#',
  },
  {
    outlet: 'Space.com',
    title: "Is Ben Mauro's 'Huxley' graphic novel universe the next big thing in sci-fi?",
    href: '#',
  },
  { outlet: 'IGN', title: 'Huxley — Official Graphic Novel Trailer', href: '#' },
  {
    outlet: 'The Comic Crush',
    title: "Concept artist Ben Mauro's world-building comes to comics!",
    href: '#',
  },
  {
    outlet: 'Press Release Hub',
    title: 'Ben Mauro Announces Early Deluxe Hardcover Release of Huxley: The Oracle, Featuring Exclusive Art',
    href: '#',
  },
  { outlet: 'Hypebeast', title: 'Huxley™: From Graphic Novel to Global Entertainment Franchise', href: '#' },
];

/** Press, as ruled rows: outlet, headline, and a view link out. */
export default function AboutPress() {
  return (
    <section className="bg-black px-3 pb-10 pt-20 font-heading uppercase">
      <SectionIntro title="Press" aside={`[${String(features.length).padStart(2, '0')}]`} />

      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
        className="mt-12 border-t border-white/10"
      >
        {features.map((feature) => (
          <motion.li
            key={`${feature.outlet}-${feature.title}`}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
            }}
            className="border-b border-white/10"
          >
            <HoverGroup>
              <a
                href={feature.href}
                target="_blank"
                rel="noreferrer"
                className="grid gap-x-3 gap-y-2 py-5 text-white transition-colors hover:bg-white/3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white md:grid-cols-[12rem_minmax(0,1fr)_5rem] md:items-baseline md:px-1"
              >
                <p className="text-[11px] tracking-widest text-white/40 sm:text-[13px]">
                  <HoverHighlight className="-ml-1">{feature.outlet}</HoverHighlight>
                </p>

                <p className="text-xs leading-relaxed tracking-wider sm:text-sm">{feature.title}</p>

                <p className="text-[11px] tracking-widest text-white/40 md:text-right sm:text-[13px]">
                  <HoverHighlight className="-ml-1" delay={0.05}>
                    View
                  </HoverHighlight>
                </p>
              </a>
            </HoverGroup>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
