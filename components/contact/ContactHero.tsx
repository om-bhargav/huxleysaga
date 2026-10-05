'use client';

import { motion } from 'framer-motion';
import { RevealImage } from '@/components/shared/RevealImage'; // adjust path
import { flicker } from '@/components/shared/SectionIntro'; // adjust path
import { CONTACT_EMAIL } from '@/components/contact/ContactIntro'; // adjust path

/* Placeholder art: swap in your contact banner */
const banner = 'https://picsum.photos/seed/huxley-contact-1/1920/1080';

/* Placeholder copy: swap in your real text */
const meta: { label: string; value: string; href?: string }[] = [
  { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: 'Replies', value: 'Within 2 business days' },
];

/** Opening plate for the contact page: banner, title, the address, and a jump to the form. */
export default function ContactHero() {
  return (
    <section className="font-heading uppercase">
      {/*
        Fills the screen on every device. min-h (not h) so on a short phone in landscape
        the frame grows to fit the text instead of clipping the title.
        The text sits in normal flow at the bottom; RevealImage clips itself, so no overflow-hidden here.
        svh = the visible height with mobile browser bars showing, so nothing hides behind them.
      */}
      <div className="relative flex md:min-h-svh max-md:h-[80vh] w-full flex-col justify-end border border-white/10">
        {/* Above the fold, so it plays on load instead of waiting to be scrolled into view */}
        <div className="absolute inset-0">
          <RevealImage
            src={banner}
            alt=""
            direction="left-right"
            trigger="mount"
            priority
            sizes="100vw"
            className="size-full"
          >
            {/* Heavier at the bottom so the text stays readable; heavier still on phones, where text covers more */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/20 sm:from-black/80 sm:via-black/40"
            />
          </RevealImage>
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          className="relative z-10 px-4 pb-4 pt-28 text-white sm:px-6 sm:pb-6 lg:p-8"
        >
          <motion.span
            variants={flicker}
            custom={0}
            aria-hidden="true"
            className="block size-1 bg-white"
          />
          <motion.h1
            variants={flicker}
            custom={0.1}
            className="mt-3 text-[clamp(2.5rem,9vw,7rem)] leading-[0.9] tracking-wide sm:text-[clamp(3rem,7vw,7rem)]"
          >
            Contact
          </motion.h1>
          <motion.p
            variants={flicker}
            custom={0.25}
            className="mt-3 max-w-[48ch] text-[11px] leading-relaxed tracking-widest text-white/70 lg:text-xs"
          >
            {/* Placeholder copy: swap in your real text */}
            Press, licensing, wholesale or an order that went sideways. One inbox, read by the people who can help.
          </motion.p>

          <motion.div
            variants={flicker}
            custom={0.4}
            className="mt-5 flex flex-col gap-5 border-t border-white/15 pt-4 sm:mt-6 sm:flex-row sm:items-end sm:justify-between"
          >
            {/* Stacked on small phones, side by side from ~420px, a loose row from tablet up */}
            <dl className="grid gap-4 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
              {meta.map((item) => (
                <div key={item.label} className="min-w-0">
                  <dt className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">{item.label}</dt>
                  <dd className="mt-1 text-sm sm:text-base">
                    {item.href ? (
                      <a
                        href={item.href}
                        className="break-all normal-case transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="inline-flex shrink-0 items-center gap-2 self-start text-[10px] tracking-widest text-white/70 transition-colors hover:text-white sm:self-auto sm:text-[11px]">
              Write to us
              <span aria-hidden="true" className="inline-block animate-bounce">
                ↓
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}