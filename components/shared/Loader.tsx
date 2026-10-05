"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AppStore } from "@/store/AppContext";

/* ------------------------------------------------------------------ */
/* PROGRESS DIGITS — odometer made for this loader                     */
/* ------------------------------------------------------------------ */

// Height of one digit cell, in em (a bit over 1 so glyphs never clip)
const CELL = 1.1;

/**
 * One digit place (ones, tens, hundreds). Instead of mounting/unmounting a
 * span per change, each place is a single vertical strip of digits that just
 * slides. A new value retargets the same CSS transition, so rapid updates
 * never queue up, lag behind or stack on top of each other.
 *
 * The strip counts continuously (0,1,…,9,0,1,…) up to the max, so the digits
 * always roll upward — e.g. 47 → 53 rolls the ones place 7→8→9→0→1→2→3.
 */
function DigitPlace({
  value,
  max,
  place,
}: {
  value: number;
  max: number;
  place: number; // 1, 10, 100…
}) {
  const count = Math.floor(value / place);
  const total = Math.floor(max / place) + 1;
  // Leading places (e.g. the "1" in 100) stay hidden until they're needed
  const visible = value >= place || place === 1;

  return (
    <span
      className="relative inline-block overflow-hidden transition-opacity duration-200"
      style={{ height: `${CELL}em`, opacity: visible ? 1 : 0 }}
    >
      {/* Invisible "0" sets the width (pair with tabular-nums) */}
      <span className="invisible block" style={{ lineHeight: `${CELL}em` }}>
        0
      </span>

      <span
        className="absolute inset-x-0 top-0 flex flex-col text-center transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none"
        style={{ transform: `translateY(-${count * CELL}em)` }}
      >
        {Array.from({ length: total }, (_, k) => (
          <span
            key={k}
            className="block"
            style={{ height: `${CELL}em`, lineHeight: `${CELL}em` }}
          >
            {k % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Shows `value` (0…max) as rolling digits with a fixed width. */
function ProgressDigits({
  value,
  max = 100,
  suffix = "%",
}: {
  value: number;
  max?: number;
  suffix?: string;
}) {
  const places = String(max).length;
  const clamped = Math.max(0, Math.min(max, Math.round(value)));

  return (
    <span className="inline-flex items-start">
      <span className="sr-only">
        {clamped}
        {suffix}
      </span>

      <span aria-hidden="true" className="inline-flex">
        {Array.from({ length: places }, (_, i) => {
          const place = 10 ** (places - 1 - i);
          return (
            <DigitPlace key={place} value={clamped} max={max} place={place} />
          );
        })}
        <span style={{ lineHeight: `${CELL}em` }}>{suffix}</span>
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* LOADER                                                              */
/* ------------------------------------------------------------------ */

// Images shown in the center while loading. Cycles every IMAGE_INTERVAL ms,
// wrapping back to the first after the last.
const IMAGES = [
  "https://picsum.photos/seed/shatter-1/1200/1200",
  "https://picsum.photos/seed/shatter-2/1200/1200",
  "https://picsum.photos/seed/shatter-3/1200/1200",
  "https://picsum.photos/seed/shatter-4/1200/1200",
  "https://picsum.photos/seed/shatter-5/1200/1200",
];
const IMAGE_INTERVAL = 200;

// Black boxes on the image. Positions snap to a grid of GRID_STEPS cells per
// side so they look like tiles; each box covers BOX_CELLS cells.
const BOX_COUNT = 5;
const GRID_STEPS = 15;
const BOX_CELLS = 4;
const cellPct = (cells: number) => `${(cells / GRID_STEPS) * 100}%`;

type BoxPos = { x: number; y: number };

// Deterministic, non-overlapping first layout so server and client render the
// same markup. Also used as a fallback if random placement ever fails.
const INITIAL_BOXES: BoxPos[] = [
  { x: 0, y: 0 },
  { x: 5, y: 1 },
  { x: 11, y: 0 },
  { x: 2, y: 5 },
  { x: 9, y: 6 },
  { x: 0, y: 11 },
  { x: 5, y: 10 },
  { x: 11, y: 11 },
];

const overlaps = (a: BoxPos, b: BoxPos) =>
  Math.abs(a.x - b.x) < BOX_CELLS && Math.abs(a.y - b.y) < BOX_CELLS;

// Random positions with no two boxes overlapping.
const randomBoxes = (): BoxPos[] => {
  const max = GRID_STEPS - BOX_CELLS + 1;

  for (let layout = 0; layout < 50; layout++) {
    const placed: BoxPos[] = [];

    for (let tries = 0; tries < 200 && placed.length < BOX_COUNT; tries++) {
      const candidate = {
        x: Math.floor(Math.random() * max),
        y: Math.floor(Math.random() * max),
      };
      if (!placed.some((p) => overlaps(p, candidate))) placed.push(candidate);
    }

    if (placed.length === BOX_COUNT) return placed;
  }

  return INITIAL_BOXES;
};

const FADE_DURATION = 0.6; // seconds

export default function ShatterLoader({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageBoxes, setImageBoxes] = useState<BoxPos[]>(INITIAL_BOXES);
  const { makeReady } = AppStore();

  // Keep the latest callbacks in refs so parent re-renders don't matter
  const onCompleteRef = useRef(onComplete);
  const makeReadyRef = useRef(makeReady);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    makeReadyRef.current = makeReady;
  }, [onComplete, makeReady]);

  // 1. SIMULATED LOADING (single interval)
  useEffect(() => {
    let value = 0;

    const interval = setInterval(() => {
      value = Math.min(100, value + Math.random() * 8);
      setProgress(Math.floor(value));
      if (value >= 100) clearInterval(interval);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // 2. IMAGE SLIDESHOW + NEW BOX POSITIONS
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setImageIndex((i) => (i + 1) % IMAGES.length);
      setImageBoxes(randomBoxes());
    }, IMAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [visible]);

  // 3. HOLD AT 100% FOR A MOMENT, THEN FADE OUT
  useEffect(() => {
    if (progress < 100 || !visible) return;

    const t = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(t);
  }, [progress, visible]);

  // 4. COMPLETE — runs once the fade-out has finished
  const handleExitComplete = () => {
    makeReadyRef.current();
    onCompleteRef.current?.();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
        >
          {/* CENTER IMAGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square overflow-hidden bg-black"
            // Fits the screen both ways: never wider than 80% of the width or
            // taller than ~60% of the height (so it clears the progress row
            // in landscape phones too)
            style={{ width: "min(420px, 80vw, 60dvh)" }}
          >
            {/* All images are mounted (so they preload) and only the
                current one is visible — switches instantly. */}
            {IMAGES.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 525px) 80vw, 420px"
                className={`object-cover ${
                  i === imageIndex ? "visible" : "invisible"
                }`}
              />
            ))}

            {/* BLACK BOXES — jump to new random spots with each image */}
            {imageBoxes.map((b, i) => (
              <div
                key={i}
                className="absolute bg-black"
                style={{
                  left: cellPct(b.x),
                  top: cellPct(b.y),
                  width: cellPct(BOX_CELLS),
                  height: cellPct(BOX_CELLS),
                }}
              />
            ))}

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          {/* PROGRESS ROW
              Phones: bar on the left, number on the right, in one row so
              they can never overlap. Larger screens: bar centered at the
              bottom, number in the bottom-right corner. Padding includes
              the safe area so nothing sits under a notch or home bar. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-5 sm:px-8"
            style={{
              paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
              paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
              paddingRight: "max(1.25rem, env(safe-area-inset-right))",
            }}
          >
            {/* BAR */}
            <div
              className="mb-[0.45em] h-[2px] min-w-0 max-w-[200px] flex-1 overflow-hidden bg-white/10 sm:absolute sm:left-1/2 sm:mb-0 sm:w-[200px] sm:flex-none sm:-translate-x-1/2"
              style={{ bottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>

            {/* NUMBER — scales with both width and height */}
            <div
              className="ml-auto shrink-0 font-black tabular-nums tracking-tight text-white sm:mb-3"
              style={{ fontSize: "clamp(2.25rem, min(10vw, 11dvh), 4.5rem)" }}
            >
              <ProgressDigits value={progress} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}