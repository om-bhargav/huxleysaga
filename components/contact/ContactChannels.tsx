'use client';

import { motion } from 'framer-motion';
import { HoverGroup, HoverHighlight } from '@/components/shared/HoverHighlight'; // adjust path
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path
import { CONTACT_EMAIL } from './ContactIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Channel = {
  title: string;
  /** What to put in the message, so the first reply can be the useful one */
  text: string;
  /** Prefills the subject line */
  subject: string;
};

/* Everything routes to the one published address. If dedicated inboxes exist
   (press@, rights@, …), give each channel its own `to` instead of a subject. */
const channels: Channel[] = [
  {
    title: 'Press & media',
    text: 'Outlet, deadline, and what you need: review copies, art assets, or an interview with the creator.',
    subject: 'Press enquiry',
  },
  {
    title: 'Licensing & rights',
    text: 'Territory, format and timeline. Film, series, games, merchandise and translation rights.',
    subject: 'Licensing enquiry',
  },
  {
    title: 'Wholesale & retail',
    text: 'Store name, location, and which editions you want to stock.',
    subject: 'Wholesale enquiry',
  },
  {
    title: 'Orders & support',
    text: 'Order number and the address it shipped to. Add photos if a book arrived damaged.',
    subject: 'Order support',
  },
  {
    title: 'Everything else',
    text: 'Conventions, collaborations, portfolio questions, or anything that fits nowhere above.',
    subject: 'General enquiry',
  },
];

/** Who to write to for what, each row opening a mail draft with the subject already set. */
export default function ContactChannels() {
  return (
    <section className="px-3 font-heading uppercase">
      <SectionIntro title="What Are You After" aside={`[${String(channels.length).padStart(2, '0')}]`} />

      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
        className="mt-12 border-t border-white/10"
      >
        {channels.map((channel) => (
          <motion.li
            key={channel.title}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
            }}
            className="border-b border-white/10"
          >
            <HoverGroup>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(channel.subject)}`}
                className="grid gap-x-3 gap-y-3 py-5 text-white transition-colors hover:bg-white/3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_5rem] md:items-baseline md:px-1"
              >
                <h3 className="text-base tracking-wide lg:text-lg">
                  <HoverHighlight className="-ml-1">{channel.title}</HoverHighlight>
                </h3>

                <p className="text-xs leading-relaxed tracking-wider text-white/40 sm:text-sm">{channel.text}</p>

                <p className="text-[11px] tracking-widest text-white/40 sm:text-[13px] md:text-right">
                  <HoverHighlight className="-ml-1" delay={0.05}>
                    Write
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
