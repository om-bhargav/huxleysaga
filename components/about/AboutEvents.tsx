'use client';

import { motion } from 'framer-motion';
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Event = {
  /** As printed on the live page: MM.DD.YY */
  date: string;
  venue: string;
  text: string;
  href: string;
  /** Still to come */
  upcoming?: boolean;
};

/* TODO: drop in each event's real URL. Upcoming first, then past, newest down. */
const events: Event[] = [
  {
    date: '10.23.26',
    venue: 'LightBox Expo',
    text: 'HUXLEY comes to LightBox Expo in Pasadena with a dedicated booth and an exclusive talk.',
    href: '#',
    upcoming: true,
  },
  {
    date: '02.28.26',
    venue: 'Gnomon',
    text: 'A presentation on the creation of the original sci-fi universe HUXLEY, followed by a gallery reception showcasing artwork on display in the Gnomon Gallery.',
    href: '#',
  },
  {
    date: '03.05.26',
    venue: 'Emerald City Comic Con',
    text: 'HUXLEY joined Emerald City Comic Con in Seattle with a large booth, signed books, team meet-and-greets, and several panel discussions.',
    href: '#',
  },
  {
    date: '10.09.25',
    venue: 'New York Comic Con',
    text: 'HUXLEY arrived at New York Comic Con. Visit the Barnes & Noble booth on Saturday to get your books signed and meet the team.',
    href: '#',
  },
  {
    date: '09.25.25',
    venue: 'Tokyo Game Show',
    text: 'Huxley was at Tokyo Game Show. Get in touch to set up meetings and speak with the team.',
    href: '#',
  },
];

/** Appearances, dated the way the live page dates them. */
export default function AboutEvents() {
  return (
    <section className="bg-black px-3 pb-24 pt-20 font-heading uppercase">
      <SectionIntro title="Events" aside={`[${String(events.length).padStart(2, '0')}]`} />

      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
        className="mt-12 border-t border-white/10"
      >
        {events.map((event) => (
          <motion.li
            key={`${event.date}-${event.venue}`}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
            }}
            className="border-b border-white/10"
          >
            <HoverGroup>
              <a
                href={event.href}
                target="_blank"
                rel="noreferrer"
                className="grid gap-x-3 gap-y-3 py-5 text-white transition-colors hover:bg-white/3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white md:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1.6fr)] md:items-baseline md:px-1"
              >
                <p className="text-[11px] tracking-widest text-white/40 sm:text-[13px]">
                  <HoverHighlight className="-ml-1">{event.date}</HoverHighlight>
                </p>

                <h3 className="flex flex-wrap items-center gap-2 text-base tracking-wide lg:text-lg">
                  <HoverHighlight className="-ml-1" delay={0.05}>
                    {event.venue}
                  </HoverHighlight>
                  {event.upcoming && (
                    <span className="border border-white/20 px-1.5 py-0.5 text-[9px] tracking-widest text-white/50 sm:text-[10px]">
                      Upcoming
                    </span>
                  )}
                </h3>

                <p className="text-xs leading-relaxed tracking-wider text-white/40 sm:text-sm">{event.text}</p>
              </a>
            </HoverGroup>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
