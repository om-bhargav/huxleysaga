'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import type Lenis from 'lenis';
import type { Universe } from '@/config/universes';
import { Block } from './Block';
import { UniverseHeading } from '../universes/UniverseTheme';
import { RevealImage, type RevealDirection } from '@/components/shared/RevealImage';
import Flicker from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';

const line = 'color-mix(in srgb, var(--u-paper) 15%, transparent)';

/* 4 ─ Gallery. Click to enlarge, arrows to move through. */
export function Gallery({ universe }: { universe: Universe }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Which way the lightbox image should wipe: Next comes in from the right, Prev from the left
  const [travel, setTravel] = useState<RevealDirection>('right-left');
  const closeRef = useRef<HTMLButtonElement>(null);

  const images = universe.gallery.images;
  const open = openIndex === null ? null : images[openIndex];

  const close = () => setOpenIndex(null);
  const step = (delta: number) => {
    setTravel(delta > 0 ? 'right-left' : 'left-right');
    setOpenIndex((i) => (i === null ? null : (i + delta + images.length) % images.length));
  };

  // While the lightbox is open: freeze the page (Lenis and native), keyboard controls, focus on Close
  useEffect(() => {
    if (openIndex === null) return;

    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.stop();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      lenis?.start();
    };
    // Only re-run when it opens or closes, not on every image change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex === null]);

  return (
    <Block id="gallery" index={4} label="Gallery">
      {/* Title blinks on in the universe's display face */}
      <UniverseHeading className="text-[clamp(1.5rem,3.5vw,3rem)]">
        <Flicker as="span" className="block">
          {universe.gallery.title}
        </Flicker>
      </UniverseHeading>

      {/* Note: each word unfolds upright in 3D (no opacity animation, so opacity-50 stays) */}
      {universe.gallery.note && (
        <Reveal3D
          as="p"
          text={universe.gallery.note}
          delay={0.3}
          stagger={0.012}
          className="mt-3 max-w-[70ch] text-xs leading-relaxed opacity-50 sm:text-sm"
        />
      )}

      <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={() => {
                setTravel('bottom-up');
                setOpenIndex(i);
              }}
              aria-label={`Enlarge: ${image.caption}`}
              className="group/shot relative block w-full border focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4"
              style={{ borderColor: line }}
            >
              {/* Alternating wipe directions, offset across the row; glitches as it lands and on hover */}
              <RevealImage
                glitch
                glitchOnHover
                src={image.src}
                alt={image.caption}
                direction={i % 2 ? 'right-left' : 'left-right'}
                delay={(i % 4) * 0.08}
                amount={0.2}
                sizes="(min-width: 1024px) 23vw, 46vw"
                className="aspect-4/5 w-full"
                imageClassName="transition-transform duration-700"
              >
                <Flicker
                  as="span"
                  delay={0.9 + (i % 4) * 0.08}
                  amount={0.2}
                  className="absolute inset-x-0 bottom-0 p-2 text-left font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
                  style={{ background: 'linear-gradient(to top, var(--u-ink), transparent)' }}
                >
                  {image.caption}
                </Flicker>
              </RevealImage>
            </button>
          </li>
        ))}
      </ul>

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={open.caption}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="fixed inset-0 z-50 flex flex-col bg-black/90 p-3 backdrop-blur-sm lg:p-8"
            onClick={close}
          >
            <div className="flex items-center justify-between gap-4 font-heading text-[11px] uppercase tracking-widest text-white">
              {/* Keyed by caption, so it blinks on again for every image */}
              <Flicker key={open.caption} as="span" trigger="mount" className="min-w-0 truncate">
                {open.caption}
              </Flicker>
              <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="shrink-0 p-2">
                <FiX aria-hidden="true" className="size-5" />
              </button>
            </div>

            {/* Each new image wipes in over the last, from the side you moved towards */}
            <div className="relative min-h-0 flex-1" onClick={(e) => e.stopPropagation()}>
              <div className="absolute inset-0">
                {/* No glitch here: GlitchImage always crops to cover, and the lightbox must show the whole shot */}
                <RevealImage
                  src={open.src}
                  alt={open.caption}
                  direction={travel}
                  trigger="mount"
                  duration={0.8}
                  sizes="100vw"
                  className="size-full"
                  /* object-contain so the whole shot shows; ! beats RevealImage's default object-cover */
                  imageClassName="object-contain!"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-center gap-6 pt-3 font-heading text-[11px] uppercase tracking-widest text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => step(-1)} className="px-3 py-2 transition-opacity hover:opacity-60">
                ← Prev
              </button>
              <span className="tabular-nums opacity-50">
                {(openIndex ?? 0) + 1} / {images.length}
              </span>
              <button type="button" onClick={() => step(1)} className="px-3 py-2 transition-opacity hover:opacity-60">
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Block>
  );
}