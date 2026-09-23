'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* Shares "is this group hovered?" with every HoverHighlight inside it */
const HoverGroupContext = createContext<boolean | null>(null);

/**
 * Wrap a row, card or link in this. Hovering (or focusing) anywhere inside it
 * activates every <HoverHighlight> inside, with no state needed in your component.
 */
export function HoverGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <HoverGroupContext.Provider value={hovered}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className={className}
      >
        {children}
      </div>
    </HoverGroupContext.Provider>
  );
}

type HoverHighlightProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before sweeping in, for staggering several highlights. */
  delay?: number;
};

/**
 * A bg-foreground block sweeps in behind the text from left to right,
 * and sweeps out to the right when it deactivates.
 * Inside a <HoverGroup> it follows the group's hover; on its own it follows its own hover.
 */
export function HoverHighlight({ children, className = '', delay = 0 }: HoverHighlightProps) {
  const groupHovered = useContext(HoverGroupContext);
  const [selfHovered, setSelfHovered] = useState(false);
  const inGroup = groupHovered !== null;
  const on = inGroup ? groupHovered : selfHovered;

  const selfHandlers = inGroup
    ? {}
    : {
        onHoverStart: () => setSelfHovered(true),
        onHoverEnd: () => setSelfHovered(false),
        onFocus: () => setSelfHovered(true),
        onBlur: () => setSelfHovered(false),
      };

  return (
    <motion.span {...selfHandlers} className={`relative inline-block px-1 ${className}`}>
      {/* Normal text */}
      <span>{children}</span>

      {/* Highlight layer: same text, inverted colors, revealed by the sweep */}
      <AnimatePresence>
        {on && (
          <motion.span
            aria-hidden="true"
            initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.4, ease, delay } }}
            exit={{ clipPath: 'inset(0% 0% 0% 100%)', transition: { duration: 0.4, ease } }}
            className="pointer-events-none absolute inset-0 bg-foreground px-1 text-background"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}