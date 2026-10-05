'use client';

import { motion } from 'framer-motion';
import { FaInstagram, FaYoutube, FaXTwitter } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { SectionIntro } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Channel = { label: string; handle: string; href: string; Icon: IconType };

/* Same accounts the navbar links to — keep the two in step */
const channels: Channel[] = [
  { label: 'Instagram', handle: '@huxleysaga', href: 'https://www.instagram.com/huxleysaga/', Icon: FaInstagram },
  { label: 'YouTube', handle: '@HUXLEYSAGA', href: 'https://www.youtube.com/@HUXLEYSAGA', Icon: FaYoutube },
  { label: 'X', handle: '@huxleysaga', href: 'https://x.com/huxleysaga', Icon: FaXTwitter },
];

/** Where the work gets posted first, for anything that does not need a reply. */
export default function ContactFollow() {
  return (
    <section className="px-3 font-heading uppercase">
      <SectionIntro
        title="Follow The Saga"
        /* Placeholder copy: swap in your real text */
        text="New art, trailers and campaign news go out here first."
      />

      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
        className="mt-12 grid gap-3 sm:grid-cols-3"
      >
        {channels.map(({ label, handle, href, Icon }) => (
          <motion.li
            key={label}
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
            }}
          >
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group/social flex h-full flex-col justify-between gap-12 border border-white/10 bg-neutral-950 p-3.5 text-white transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white lg:p-6"
            >
              <Icon aria-hidden="true" className="size-5 text-white/40 transition-colors group-hover/social:text-white" />

              <span>
                <span className="block text-lg tracking-wide lg:text-xl">{label}</span>
                <span className="mt-1.5 block text-[11px] tracking-widest text-white/40 sm:text-[13px]">
                  {handle}
                </span>
              </span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
