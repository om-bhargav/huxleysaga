'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiChevronsDown } from 'react-icons/fi';
import { StretchText } from '../shared/StrechText';
import { SITE_NAME } from '@/config';
import { HOME_HERO_IMAGE } from '@/lib/assets';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type HeroProps = {
  /** Background image (used as the video poster too) */
  image?: string;
  /** Optional background video */
  video?: string;
  tagline?: string;
};
const word = SITE_NAME.toUpperCase();

/* 1-based character positions in reveal order.
   Letters are shuffled with a fixed seed, so the order is identical on server
   and client (no hydration mismatch). Spaces go last so they don't add empty gaps. */
const revealOrder = (() => {
  const letters: number[] = [];
  const spaces: number[] = [];
  [...word].forEach((ch, i) => (ch === ' ' ? spaces : letters).push(i + 1));

  // Seeded PRNG (mulberry32), seeded from the word itself
  let seed = [...word].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Fisher–Yates shuffle of the letter positions
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return [...letters, ...spaces];
})();

export default function Hero({
  image = HOME_HERO_IMAGE,
  video,
  tagline = 'A post-apocalyptic sci-fi universe',
}: HeroProps) {
  // As the page scrolls through the first screen, zoom the background slightly and darken it
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) =>
    typeof window === 'undefined' ? 0 : Math.min(y / window.innerHeight, 1),
  );
  const bgScale = useTransform(progress, [0, 1], [1, 1.08]);
  const dim = useTransform(progress, [0, 1], [0, 0.6]);
  // ...your existing progress / bgScale / dim lines...

  // Once scrolled past the first screen, the content fully covers the hero,
  // so hide it and let the footer show through at the bottom
  const visibility = useTransform(scrollY, (y) =>
    typeof window !== 'undefined' && y > window.innerHeight ? 'hidden' : 'visible',
  );
  return (
    <>
      <div aria-hidden="true" className="h-svh" />

      <motion.section style={{ visibility }} className="fixed inset-x-0 pt-16 top-0 z-3 h-svh overflow-hidden bg-black font-heading uppercase text-white">
        {/* Background */}
        <motion.div
          style={{ scale: bgScale }}
          initial={{ filter: 'brightness(0)' }}
          animate={{ filter: 'brightness(1)' }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {video ? (
            <video
              src={video}
              poster={image}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
          )}
        </motion.div>

        {/* Darkens as the page scrolls */}
        <motion.div style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-black" />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between px-4 pb-5 pt-2.5">
          <h1 className="sr-only">{"Six Worlds. One Studio"}</h1>

          {/* Wordmark rises in on load */}
          <div aria-hidden="true">
            <StretchText className="font-heading text-[11vw] leading-[0.8]">
              {Array.from(word).map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 1.6 + revealOrder.indexOf(i + 1) * 0.5 }}
                  className={char === "'" || char === '’' ? 'font-sans' : undefined}
                >
                  {char}
                </motion.span>
              ))}
            </StretchText>
          </div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.8 }}
            className="flex items-end justify-between gap-4 text-[11px] tracking-wider sm:text-[13px]"
          >
            <p>{tagline}</p>

            <a href="#main-content" className="flex shrink-0 items-center gap-1.5">
              <motion.span
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              >
                <FiChevronsDown className="size-3.5" />
              </motion.span>
              Scroll to explore
            </a>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
}