'use client';

import type { ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* The four corners: where they sit, which way the bracket faces, and where they fly in from */
const corners = [
  { pos: '-left-1.5 -top-1.5', rotate: 'rotate-0', dx: -1, dy: -1 },
  { pos: '-right-1.5 -top-1.5', rotate: 'rotate-90', dx: 1, dy: -1 },
  { pos: '-bottom-1.5 -right-1.5', rotate: 'rotate-180', dx: 1, dy: 1 },
  { pos: '-bottom-1.5 -left-1.5', rotate: '-rotate-90', dx: -1, dy: 1 },
];

const cornerVariants = (dx: number, dy: number, distance: number, delay: number): Variants => ({
  rest: { opacity: 0, x: dx * distance, y: dy * distance, transition: { duration: 0.2 } },
  hover: { opacity: 1, x: 0, y: 0, transition: { duration: 0.45, ease, delay } },
});

/**
 * Camera-style corner brackets. They follow the parent's "rest" / "hover" variant state,
 * so put them inside any motion element that switches between those two.
 */
export function Corners({
  size = 'size-2.5',
  distance = 6,
  delay = 0.1,
  color = 'var(--u-accent)',
}: {
  size?: string;
  distance?: number;
  delay?: number;
  color?: string;
}) {
  return (
    <>
      {corners.map(({ pos, rotate, dx, dy }) => (
        <motion.span
          key={pos}
          aria-hidden="true"
          variants={cornerVariants(dx, dy, distance, delay)}
          className={`pointer-events-none absolute ${size} ${pos}`}
        >
          <span className={`absolute inset-0 ${rotate}`}>
            <span className="absolute left-0 top-0 h-px w-full" style={{ backgroundColor: color }} />
            <span className="absolute left-0 top-0 h-full w-px" style={{ backgroundColor: color }} />
          </span>
        </motion.span>
      ))}
    </>
  );
}

/* Fill flickers like a failing light, then settles (FrameButton surface) */
const surface: Variants = {
  rest: { opacity: 1 },
  hover: {
    opacity: [1, 0.3, 1, 0.15, 1, 0.6, 1],
    transition: { duration: 0.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1] },
  },
};

/* Label on a different rhythm so the two don't blink in sync (FrameButton label) */
const label: Variants = {
  rest: { opacity: 1 },
  hover: {
    opacity: [1, 0, 1, 0.4, 1, 0, 1],
    transition: { duration: 0.45, times: [0, 0.08, 0.18, 0.3, 0.45, 0.6, 1] },
  },
};

type AccentButtonProps = {
  children: ReactNode;
  /** Renders a link when given, otherwise a <button> */
  href?: string;
  /** Link only: open in a new tab. Default true for links */
  external?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Filled accent button in the universe's colours. On hover or keyboard focus the fill and
 * label flicker and corner brackets snap in around it, like FrameButton.
 */
export function AccentButton({
  children,
  href,
  external = true,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}: AccentButtonProps) {
  const motionProps = {
    initial: 'rest',
    animate: 'rest',
    whileHover: disabled ? undefined : 'hover',
    whileFocus: disabled ? undefined : 'hover',
    className: `relative inline-flex items-center justify-center gap-2 px-6 py-3 font-heading text-[11px] uppercase tracking-widest focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 disabled:cursor-not-allowed sm:text-[13px] ${className}`,
    style: { color: 'var(--u-ink)', outlineColor: 'var(--u-accent)' },
  };

  const inner = (
    <>
      <motion.span
        aria-hidden="true"
        variants={surface}
        className="absolute inset-0 border"
        style={{ borderColor: 'var(--u-accent)', backgroundColor: 'var(--u-accent)' }}
      />
      <motion.span variants={label} className="relative">
        {children}
      </motion.span>
      <Corners />
    </>
  );

  if (href && !disabled) {
    return (
      <motion.a
        href={href}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...motionProps}
      >
        {inner}
        {external && <span className="sr-only">(opens in a new tab)</span>}
      </motion.a>
    );
  }

  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} {...motionProps}>
      {inner}
    </motion.button>
  );
}

export default AccentButton;