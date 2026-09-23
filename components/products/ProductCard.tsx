'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { FrameButton } from '@/components/shared/FrameButton'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

export type Edition = {
  name: string;
  image: string;
  pages: number;
  href: string;
  soldOut?: boolean;
};

export type Product = {
  title: string;
  description: string;
  editions: Edition[];
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
};

/* Four short lines with a gap in the middle, like a crosshair */
function CrosshairIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
      <path d="M8 1v4M8 11v4M1 8h4M11 8h4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const [editionIndex, setEditionIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const edition = product.editions[editionIndex];
  const hasChoices = product.editions.length > 1;

  // Close the edition picker on outside click or Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPickerOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  return (
    <motion.article
      variants={cardReveal}
      className="group/card flex flex-col border border-white/10 bg-neutral-950 p-3.5 font-heading uppercase text-white"
    >
      {/* Edition picker */}
      <div className="flex items-center gap-4 text-[11px] tracking-widest sm:text-[13px]">
        <span className="text-white/50">Edition</span>
        <span className="text-white/50">/</span>

        {hasChoices ? (
          <div ref={pickerRef} className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((o) => !o)}
              className="flex items-center gap-2 font-medium uppercase tracking-widest"
            >
              {edition.name}
              <motion.span animate={{ rotate: pickerOpen ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
                <FiChevronDown className="size-3.5" aria-hidden="true" />
              </motion.span>
            </button>

            <AnimatePresence>
              {pickerOpen && (
                <motion.ul
                  role="listbox"
                  initial={{ opacity: 0, y: -6, clipPath: 'inset(0 0 100% 0)' }}
                  animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                  exit={{ opacity: 0, y: -6, clipPath: 'inset(0 0 100% 0)' }}
                  transition={{ duration: 0.3, ease }}
                  className="absolute left-0 top-full z-20 mt-2 min-w-[150px] border border-white/15 bg-black p-2"
                >
                  {product.editions.map((ed, i) => (
                    <li key={ed.name} role="option" aria-selected={i === editionIndex}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditionIndex(i);
                          setPickerOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left uppercase tracking-widest transition-colors hover:text-white ${
                          i === editionIndex ? 'text-white' : 'text-white/50'
                        }`}
                      >
                        <span className={`size-1.5 ${i === editionIndex ? 'bg-white' : 'bg-transparent'}`} />
                        {ed.name}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <span className="font-semibold">{edition.name}</span>
        )}
      </div>

      {/* Cover image, crossfades when the edition changes */}
      <div className="flex flex-1 items-center justify-center py-12 lg:py-14">
        <div className="relative aspect-[4/5] w-[56%] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          <AnimatePresence initial={false}>
            <motion.div
              key={edition.image}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              className="absolute inset-0"
            >
              <Image
                src={edition.image}
                alt={`${product.title}, ${edition.name}`}
                fill
                sizes="(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 56vw"
                className="object-cover transition-transform duration-700 group-hover/card:scale-105"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Title */}
      <h3 className="border-b border-white/10 pb-3 text-lg tracking-wide lg:text-xl">{product.title}</h3>

      {/* Description with expand toggle */}
      <div className="flex items-start gap-6 border-b border-white/10 py-3">
        <motion.p
          layout
          transition={{ duration: 0.4, ease }}
          className={`flex-1 text-xs leading-relaxed tracking-wider text-white/60 sm:text-sm ${
            expanded ? '' : 'line-clamp-2'
          }`}
        >
          {product.description}
        </motion.p>
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? 'Show less' : 'Show more'}
          onClick={() => setExpanded((e) => !e)}
          className="grid size-11 shrink-0 place-items-center border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
        >
          <motion.span animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: 0.3, ease }}>
            <CrosshairIcon />
          </motion.span>
        </button>
      </div>

      {/* Pages */}
      <p className="flex gap-8 py-3 text-[11px] tracking-widest sm:text-[13px]">
        <span className="text-white/50">Pages</span>
        <span className="text-white/50">/</span>
        <span className="font-semibold">{edition.pages}</span>
      </p>

      <FrameButton href={edition.href} disabled={edition.soldOut}>
        {edition.soldOut ? 'Sold out' : 'Buy now'}
      </FrameButton>
    </motion.article>
  );
}