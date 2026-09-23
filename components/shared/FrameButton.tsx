'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type FrameButtonProps = {
  children: ReactNode;
  /** Renders a link when given, otherwise a <button> */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** Color class for the four corner brackets */
  cornerClassName?: string;
};

/* Background + border flickers like a failing light, then settles brighter */
const surface: Variants = {
  rest: { opacity: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' },
  hover: {
    opacity: [1, 0.3, 1, 0.15, 1, 0.6, 1],
    transition: { duration: 0.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1] },
  },
};

/* Text flickers on a slightly different rhythm so the two don't blink in sync */
const label: Variants = {
  rest: { opacity: 1 },
  hover: {
    opacity: [1, 0, 1, 0.4, 1, 0, 1],
    transition: { duration: 0.45, times: [0, 0.08, 0.18, 0.3, 0.45, 0.6, 1] },
  },
};

/* The four corners: where they sit, which way the bracket faces, and where they fly in from */
const corners = [
  { pos: '-left-1.5 -top-1.5', rotate: 'rotate-0', dx: -1, dy: -1 },
  { pos: '-right-1.5 -top-1.5', rotate: 'rotate-90', dx: 1, dy: -1 },
  { pos: '-bottom-1.5 -right-1.5', rotate: 'rotate-180', dx: 1, dy: 1 },
  { pos: '-bottom-1.5 -left-1.5', rotate: '-rotate-90', dx: -1, dy: 1 },
];

const cornerVariants = (dx: number, dy: number): Variants => ({
  rest: { opacity: 0, x: dx * 6, y: dy * 6, transition: { duration: 0.2 } },
  hover: { opacity: 1, x: 0, y: 0, transition: { duration: 0.35, ease, delay: 0.1 } },
});

/**
 * Full-width outlined button. On hover it flickers and four
 * camera-style corner brackets snap in around it.
 */
export function FrameButton({
  children,
  href,
  onClick,
  disabled = false,
  className = '',
  cornerClassName = 'bg-foreground',
}: FrameButtonProps) {
  const inner = (
    <>
      <motion.span aria-hidden="true" variants={surface} className="absolute inset-0 border" />
      <motion.span variants={label} className="relative">
        {children}
      </motion.span>
    </>
  );

  const base =
    'relative flex h-11 w-full items-center justify-center font-heading text-[11px] uppercase tracking-widest text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[13px]';

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover={disabled ? undefined : 'hover'}
      className={`relative ${className}`}
    >
      {href && !disabled ? (
        <Link href={href} className={base}>
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`${base} disabled:cursor-not-allowed`}
        >
          {inner}
        </button>
      )}

      {/* Corner brackets */}
      {corners.map(({ pos, rotate, dx, dy }) => (
        <motion.span
          key={pos}
          aria-hidden="true"
          variants={cornerVariants(dx, dy)}
          className={`pointer-events-none absolute size-2.5 ${pos}`}
        >
          <span className={`absolute inset-0 ${rotate}`}>
            <span className={`absolute left-0 top-0 h-px w-full ${cornerClassName}`} />
            <span className={`absolute left-0 top-0 h-full w-px ${cornerClassName}`} />
          </span>
        </motion.span>
      ))}
    </motion.div>
  );
}