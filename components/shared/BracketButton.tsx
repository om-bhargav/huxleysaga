'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { useGlitchTrigger } from './GlitchImage'; // adjust path

type BracketButtonProps = {
  label: string;
  href: string;
  className?: string;
};

/* Label blinks out and back like a bad signal */
const flicker: Variants = {
  rest: { opacity: 1 },
  hover: {
    opacity: [1, 0, 1, 0, 0.6, 1],
    transition: { duration: 0.4, times: [0, 0.15, 0.3, 0.5, 0.7, 1] },
  },
};

/**
 * "[ LABEL ]" link. On hover the label flickers, and inside a <GlitchScope>
 * it also glitches the section's <GlitchImage>.
 */
export function BracketButton({ label, href, className = '' }: BracketButtonProps) {
  const glitch = useGlitchTrigger();

  return (
    <motion.div initial="rest" animate="rest" whileHover="hover" className={`inline-block ${className}`}>
      <Link
        href={href}
        {...glitch}
        className="flex items-center gap-3 px-1 py-2 font-heading text-[11px] uppercase tracking-widest text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[13px]"
      >
        <span aria-hidden="true" className="text-white/70">
          [
        </span>
        <motion.span variants={flicker}>{label}</motion.span>
        <span aria-hidden="true" className="text-white/70">
          ]
        </span>
      </Link>
    </motion.div>
  );
}