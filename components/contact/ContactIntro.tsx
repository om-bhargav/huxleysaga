'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FrameButton } from '@/components/shared/FrameButton'; // adjust path
import { SectionIntro, flicker } from '@/components/shared/SectionIntro'; // adjust path

/* The one address the live site publishes */
export const CONTACT_EMAIL = 'info@huxleysaga.com';

/** The address itself, with the two things anyone wants to do with it. */
export default function ContactIntro() {
  const [copied, setCopied] = useState(false);

  // Clear the confirmation on its own so the button doesn't stay stuck on "Copied"
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure origin, or the visitor said no): the address is on screen anyway
    }
  };

  return (
    <section className="bg-black px-3 pb-10 pt-20 font-heading uppercase">
      <SectionIntro
        title="Contact"
        /* Placeholder copy: swap in your real text */
        text="One inbox for everything: press, licensing, wholesale and orders. Tell us which it is in the subject line and it reaches the right person faster."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
        className="mt-12 border border-white/10 bg-neutral-950 p-3.5 text-white lg:p-6"
      >
        <motion.p variants={flicker} custom={0} className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">
          Email
        </motion.p>

        <motion.p variants={flicker} custom={0.1} className="mt-4 break-all">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[clamp(1.25rem,3.4vw,2.75rem)] leading-none tracking-wide transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {CONTACT_EMAIL}
          </a>
        </motion.p>

        <motion.div variants={flicker} custom={0.2} className="mt-10 flex gap-3 lg:max-w-[460px]">
          <FrameButton href={`mailto:${CONTACT_EMAIL}`} className="flex-1">Send email</FrameButton>
          <FrameButton onClick={copy} className="flex-1">{copied ? 'Copied' : 'Copy address'}</FrameButton>
        </motion.div>

        {/* Announced to screen readers without moving anything on screen */}
        <p aria-live="polite" className="sr-only">
          {copied ? 'Address copied to clipboard' : ''}
        </p>
      </motion.div>
    </section>
  );
}
