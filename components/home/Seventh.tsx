'use client';

import { motion, type Variants } from 'framer-motion';
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type EventItem = {
  date: string;
  description: string;
  href: string;
};

/* Placeholder copy: swap in your real events */
const events: EventItem[] = [
  {
    date: '10.23.26',
    description: 'Huxley heads to LightBox Expo in Pasadena with its own booth and an exclusive talk.',
    href: 'https://lightboxexpo.com/',
  },
  {
    date: '02.28.26',
    description:
      'A talk on building the Huxley universe from scratch, followed by a gallery reception with the artwork on show.',
    href: 'https://www.gnomon.edu/news-and-events/events/huxley-creating-an-original-sci-fi-universe/',
  },
  {
    date: '03.05.26',
    description: 'Huxley at Emerald City Comic Con in Seattle: a large booth, signed books, meet-and-greets and panels.',
    href: 'https://www.emeraldcitycomiccon.com/en-us.html',
  },
];

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const row: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

export default function EventsSection() {
  return (
    <section className="grid gap-10 px-3 py-20 font-heading uppercase text-white lg:grid-cols-[25%_1fr] lg:gap-0">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="self-start text-3xl tracking-wide lg:sticky lg:top-20 lg:text-4xl"
      >
        Events
      </motion.h2>

      <motion.ul
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="border-t border-white/10"
      >
        {events.map((event) => (
          <motion.li key={event.date} variants={row} className="relative border-b border-white/10 bg-neutral-950">
            <HoverGroup>
              <a
                href={event.href}
                target="_blank"
                rel="noreferrer"
                className="group grid gap-4 px-2 py-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white lg:grid-cols-[1fr_minmax(0,560px)_auto] lg:gap-10"
              >
                {/* Small marker to the left of the row */}
                <span
                  aria-hidden="true"
                  className="absolute -left-6 top-1/2 hidden size-1 bg-white/60 transition-transform duration-300 group-hover:scale-150 lg:block"
                />

                <span className="self-end text-[clamp(2.75rem,5.5vw,6rem)] font-light leading-[0.85]">
                  <HoverHighlight>{event.date}</HoverHighlight>
                </span>

                <p className="text-[10px] leading-relaxed tracking-wider text-white/50 sm:text-xs">
                  <HoverHighlight delay={0.08}>{event.description}</HoverHighlight>
                </p>

                {/* Always shown on touch screens; on desktop hidden until the row is hovered or focused */}
                <span className="self-start text-[10px] tracking-widest transition-all duration-300 sm:text-xs lg:translate-x-4 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-visible:translate-x-0 lg:group-focus-visible:opacity-100">
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