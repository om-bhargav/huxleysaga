'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiChevronsDown } from 'react-icons/fi';
import { StretchText } from '../shared/StrechText';
import { SITE_NAME } from '@/config';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

type HeroProps = {
  /** Background image (used as the video poster too) */
  image?: string;
  /** Optional background video */
  video?: string;
  tagline?: string;
};
const word = SITE_NAME;
/* Letter positions (1 = H ... 6 = Y) in the order they appear: H, E, U, Y, L, X */
const revealOrder = [3, 10, 1, 7, 13, 4, 11, 2, 9, 5, 12, 8, 6];
/**
 * Full-screen hero fixed behind the page, like a reveal footer but at the top.
 * It reserves its own space with a spacer, so the page scrolls normally,
 * and the content after it slides up over it.
 */
export default function Hero({
  image = 'https://picsum.photos/seed/huxley/1920/1080', // placeholder, swap for your own image later
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
          <h1 className="sr-only">{SITE_NAME}</h1>

          {/* Wordmark rises in on load */}
          <div aria-hidden="true">
            <StretchText className="text-[14vw] font-bold leading-[0.78]">
              {word.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 1.6 + revealOrder.indexOf(i + 1) * 0.50 }}
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