"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { GATE_IMAGES, GATE_IMAGE_SIZES } from "@/lib/assets";

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const BRAND = "Night O'Clock";
const BRAND_SUFFIX = "Studios";

const MAX_BOX = 240; // box width on large screens (px)
const BOX_VW = 0.42; // box width on small screens (fraction of viewport width)
const ZOOM_DURATION = 1.1; // seconds
const FLAP_OPEN_TIME = 450; // ms to wait for the flaps if they were closed on click

const zoomEase: [number, number, number, number] = [0.7, 0, 0.2, 1];

/* ------------------------------------------------------------------ */
/* THEME — built from shadcn CSS variables                             */
/* ------------------------------------------------------------------ */

// Darken any theme color by mixing in black (works the same in light & dark)
const shade = (color: string, pct: number) =>
  `color-mix(in oklch, ${color} ${100 - pct}%, black)`;

// Clapperboard stripes in the theme's two main colors
const clapper = (size: number) =>
  `repeating-linear-gradient(-45deg, var(--foreground) 0 ${size}px, var(--background) ${size}px ${size * 2}px)`;

const theme = {
  front: `linear-gradient(165deg, ${shade("var(--card)", 2)}, ${shade("var(--card)", 12)})`,
  right: `linear-gradient(90deg, ${shade("var(--card)", 18)}, ${shade("var(--card)", 28)})`,
  side: shade("var(--card)", 22),
  bottom: shade("var(--card)", 30),
  flap: `linear-gradient(180deg, var(--card), ${shade("var(--card)", 10)})`,
  inside: shade("var(--muted)", 40),
  insideFlap: shade("var(--muted)", 46),
  insideBottom: shade("var(--muted)", 58),
  edge: "inset 0 0 0 1px var(--border)",
};

/* ------------------------------------------------------------------ */
/* STATE                                                               */
/* ------------------------------------------------------------------ */

/**
 * idle     — box on screen, page not rendered
 * opening  — clicked: page mounts (hidden), flaps finish opening
 * zooming  — box zooms in, revealing the page through it
 * open     — gate removed
 */
type Stage = "idle" | "opening" | "zooming" | "open";

// Instant jump (ignores any `scroll-behavior: smooth` on the page).
const scrollToTop = () =>
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

/**
 * Wrap your page with this. A Night O'Clock Studios film box sits in the
 * middle of the screen.
 * - Hover (or keyboard focus): the clapper-striped lid opens and the images
 *   climb out of the box and orbit to spots all around it.
 * - Click: the page is rendered for the first time, then the box zooms in
 *   until it fills the screen and the page is revealed through it.
 *
 *   <UniverseGate images={[...]}>
 *     <YourPage />
 *   </UniverseGate>
 */
export default function UniverseGate({
  children,
  images = GATE_IMAGES,
  label = "Enter",
  onEnter,
}: {
  children: ReactNode;
  images?: string[];
  label?: string;
  onEnter?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>("idle");
  const [hovered, setHovered] = useState(false);
  const [box, setBox] = useState(MAX_BOX);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const [zoomScale, setZoomScale] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);
  const flapsWereOpen = useRef(false);

  const onEnterRef = useRef(onEnter);
  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  // Box size and image ring follow the viewport
  useEffect(() => {
    const update = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setBox(
        Math.round(
          Math.min(
            MAX_BOX,
            window.innerWidth * BOX_VW,
            window.innerHeight * 0.3,
          ),
        ),
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // While the page is mounted but still behind the gate, keep it inert
  useEffect(() => {
    if (pageRef.current) pageRef.current.inert = stage !== "open";
  }, [stage]);

  // Block ALL scrolling while the gate is up, without touching Lenis or the
  // page's overflow. Capture-phase listeners on window run before Lenis no
  // matter which element the wheel happens over. Removed once the gate opens.
  useEffect(() => {
    if (stage === "open") return;

    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const scrollKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ]);
    const blockKeys = (e: KeyboardEvent) => {
      if (!scrollKeys.has(e.key)) return;
      // Let Space still press the box
      if (e.key === " " && e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
    };

    const opts = { capture: true, passive: false } as const;
    window.addEventListener("wheel", block, opts);
    window.addEventListener("touchmove", block, opts);
    window.addEventListener("keydown", blockKeys, { capture: true });

    return () => {
      window.removeEventListener("wheel", block, opts);
      window.removeEventListener("touchmove", block, opts);
      window.removeEventListener("keydown", blockKeys, { capture: true });
    };
  }, [stage]);

  // Reveal the page from the top
  useEffect(() => {
    scrollToTop();
  }, []);

  // OPENING → ZOOMING: let the freshly mounted page render for a couple of
  // frames (so it doesn't stutter the zoom) and let the flaps finish opening.
  useEffect(() => {
    if (stage !== "opening") return;

    let raf1 = 0;
    let raf2 = 0;
    const wait = flapsWereOpen.current ? 0 : FLAP_OPEN_TIME;

    const t = window.setTimeout(() => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          scrollToTop();
          setStage("zooming");
        });
      });
    }, wait);

    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [stage]);

  const holeSize = box * 0.5;

  const enter = () => {
    if (stage !== "idle") return;

    if (reduceMotion) {
      setStage("open");
      onEnterRef.current?.();
      return;
    }

    flapsWereOpen.current = hovered;
    setZoomScale(
      (Math.max(window.innerWidth, window.innerHeight) / holeSize) * 1.15,
    );
    setStage("opening");
  };

  const finishZoom = () => {
    if (stage !== "zooming") return;
    setStage("open");
    onEnterRef.current?.();
  };

  const mounted = stage !== "idle";
  const zooming = stage === "zooming";
  const flapsOpen = hovered || stage !== "idle";

  // Ring of images around the box, kept inside the viewport
  const card = { w: box * 0.36, h: box * 0.48 };
  const ring = {
    cx: 0,
    cy: -box * 0.05, // the box's visual center sits a little above its middle
    rx: Math.min(box * 1.18, viewport.w / 2 - card.w / 2 - 12),
    ry: Math.min(box * 1.0, viewport.h / 2 - card.h / 2 - 48),
  };

  const zoomTransition: Transition = {
    duration: ZOOM_DURATION,
    ease: zoomEase,
  };

  return (
    <>
      {/* YOUR PAGE — not rendered at all until the box is clicked */}
      {mounted && <div ref={pageRef}>{children}</div>}

      <AnimatePresence>
        {stage !== "open" && (
          <motion.div
            key="universe-gate"
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* HOLE — transparent square (hidden behind the box) whose huge
                shadow fills the screen with the theme background. Scaling it
                up reveals the page. */}
            <motion.div
              aria-hidden="true"
              className="absolute"
              style={{
                width: holeSize,
                height: holeSize,
                boxShadow: "0 0 0 100vmax var(--background)",
              }}
              initial={false}
              animate={{ scale: zooming ? zoomScale : 1 }}
              transition={zoomTransition}
              onAnimationComplete={finishZoom}
            />

            {/* CINEMATIC ATMOSPHERE — overhead spotlight + vignette */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: zooming ? 0 : 1 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: box * 4.5,
                  height: box * 4.5,
                  background:
                    "radial-gradient(circle, color-mix(in oklch, var(--foreground) 8%, transparent) 0%, color-mix(in oklch, var(--foreground) 2%, transparent) 38%, transparent 65%)",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 45%, color-mix(in oklch, black 18%, transparent) 100%)",
                }}
              />
            </motion.div>

            {/* BRAND CAPTION */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 flex flex-col items-center gap-2 px-4 text-center"
              style={{ top: `calc(50% + ${ring.cy + ring.ry + card.h / 2 + 18}px)` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: zooming ? 0 : 1, y: 0 }}
              transition={{ duration: 0.6, delay: zooming ? 0 : 0.3 }}
            >
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground sm:text-xs sm:tracking-[0.5em]">
                {BRAND} {BRAND_SUFFIX}
              </span>
              <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] sm:tracking-[0.3em]">
                Hover to preview · Click to {label.toLowerCase()}
              </span>
            </motion.div>

            {/* FILM BOX — back half, images, front half. The images sit
                between the halves, so they start INSIDE the box (hidden by
                its front walls) and climb out of the opening. */}
            <motion.button
              type="button"
              aria-label={`${label} ${BRAND} ${BRAND_SUFFIX}`}
              onClick={enter}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onFocus={() => setHovered(true)}
              onBlur={() => setHovered(false)}
              disabled={stage !== "idle"}
              className="relative z-20 cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8 focus-visible:ring-offset-background"
              style={{ width: box, height: box * 0.7 }}
              initial={{ opacity: 0, y: 30 }}
              animate={
                zooming
                  ? { opacity: 0, y: 0, scale: zoomScale * 0.5 }
                  : { opacity: 1, y: hovered ? -6 : 0, scale: 1 }
              }
              transition={
                zooming
                  ? {
                      scale: zoomTransition,
                      opacity: { duration: 0.6, ease: "easeIn" },
                    }
                  : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <FilmBox part="back" width={box} open={flapsOpen} label={label} />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2"
              >
                {images.map((src, i) => (
                  <PopImage
                    key={src}
                    src={src}
                    index={i}
                    count={images.length}
                    box={box}
                    card={card}
                    ring={ring}
                    out={flapsOpen}
                    flyAway={zooming}
                  />
                ))}
              </div>

              <FilmBox part="front" width={box} open={flapsOpen} label={label} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 3D FILM BOX                                                         */
/* ------------------------------------------------------------------ */

const preserve3d: CSSProperties = { transformStyle: "preserve-3d" };

// Same view for both halves so they line up exactly
const VIEW = "rotateX(-24deg) rotateY(-34deg)";

/** A flat panel with a different look on each side. */
function Sided({
  outside,
  inside,
  children,
}: {
  outside: string;
  inside: string;
  children?: ReactNode;
}) {
  return (
    <>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: outside,
          boxShadow: theme.edge,
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: inside,
          boxShadow: theme.edge,
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      />
    </>
  );
}

/**
 * One wall plus the flap hinged on its top edge. Each wall's local +z points
 * outward, so for every flap rotateX(90°) = folded in (closed) and a small
 * negative angle = swung open and leaning outward.
 */
function Wall({
  width,
  height,
  left,
  transform,
  outside,
  flapLength,
  flapOutside = theme.flap,
  flapOpen,
  flapDelay,
  flapInset = 0,
  children,
}: {
  width: number;
  height: number;
  left: number;
  transform: string;
  outside: string;
  flapLength: number;
  flapOutside?: string;
  flapOpen: boolean;
  flapDelay: number;
  /** Inner flaps sit a hair lower so they tuck under the outer ones */
  flapInset?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className="absolute top-0"
      style={{ ...preserve3d, width, height, left, transform }}
    >
      <Sided outside={outside} inside={theme.inside}>
        {children}
      </Sided>

      <motion.div
        className="absolute left-0"
        style={{
          ...preserve3d,
          width,
          height: flapLength,
          top: -flapLength + flapInset,
          transformOrigin: "50% 100%",
        }}
        initial={false}
        animate={{ rotateX: flapOpen ? -38 : 90 }}
        transition={
          flapOpen
            ? { type: "spring", stiffness: 170, damping: 15, delay: flapDelay }
            : // wait for the images to drop back in before closing
              { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.55 + flapDelay }
        }
      >
        <Sided outside={flapOutside} inside={theme.insideFlap} />
      </motion.div>
    </div>
  );
}

/** Night O'Clock mark: a crescent moon with clock hands in its hollow. */
function MoonClockMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-foreground"
    >
      <path
        d="M20.5 13.6A8.6 8.6 0 1 1 10.4 3.5a6.8 6.8 0 0 0 10.1 10.1z"
        fill="currentColor"
      />
      <path
        d="M15.6 5.2v3.6l2.4 1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The box is drawn in two halves with an identical 3D view:
 * - "back":  bottom, back wall, left wall (+ their flaps) — the far side
 * - "front": front wall, right wall (+ their flaps) — the near side
 * Anything placed between them in the DOM appears to be inside the box.
 */
function FilmBox({
  part,
  width: w,
  open,
  label,
}: {
  part: "back" | "front";
  width: number;
  open: boolean;
  label: string;
}) {
  const h = w * 0.7; // height
  const d = w * 0.7; // depth
  const px = (n: number) => Math.max(1, Math.round(w * n));
  const f = (n: number) => `${Math.max(6, Math.round(w * n))}px`; // font size
  const stripe = px(0.045);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ perspective: w * 5 }}
    >
      <div className="absolute inset-0" style={{ ...preserve3d, transform: VIEW }}>
        {part === "back" ? (
          <>
            {/* BOTTOM */}
            <div
              className="absolute left-0"
              style={{
                ...preserve3d,
                width: w,
                height: d,
                top: (h - d) / 2,
                transform: `rotateX(-90deg) translateZ(${h / 2}px)`,
              }}
            >
              <Sided outside={theme.bottom} inside={theme.insideBottom} />
            </div>

            {/* BACK — clapper-striped lid flap */}
            <Wall
              width={w}
              height={h}
              left={0}
              transform={`rotateY(180deg) translateZ(${d / 2}px)`}
              outside={theme.side}
              flapLength={d / 2}
              flapOutside={clapper(stripe)}
              flapOpen={open}
              flapDelay={0.03}
            />

            {/* LEFT */}
            <Wall
              width={d}
              height={h}
              left={(w - d) / 2}
              transform={`rotateY(-90deg) translateZ(${w / 2}px)`}
              outside={theme.side}
              flapLength={w * 0.3}
              flapOpen={open}
              flapDelay={0.1}
              flapInset={1}
            />
          </>
        ) : (
          <>
            {/* RIGHT — 35mm film strip */}
            <Wall
              width={d}
              height={h}
              left={(w - d) / 2}
              transform={`rotateY(90deg) translateZ(${w / 2}px)`}
              outside={theme.right}
              flapLength={w * 0.3}
              flapOpen={open}
              flapDelay={0.12}
              flapInset={1}
            >
              <div
                className="absolute inset-x-0 flex flex-col justify-between"
                style={{
                  top: h * 0.3,
                  height: h * 0.4,
                  background: "var(--foreground)",
                  padding: `${px(0.012)}px 0`,
                }}
              >
                {[0, 1].map((row) => (
                  <div
                    key={row}
                    style={{
                      height: px(0.022),
                      background: `repeating-linear-gradient(90deg, var(--background) 0 ${px(0.022)}px, transparent ${px(0.022)}px ${px(0.045)}px)`,
                      backgroundPosition: `${px(0.012)}px 0`,
                    }}
                  />
                ))}
                {/* Frames */}
                <div
                  className="absolute flex"
                  style={{
                    top: "22%",
                    bottom: "22%",
                    left: px(0.02),
                    right: px(0.02),
                    gap: px(0.015),
                  }}
                >
                  {[0, 1, 2].map((k) => (
                    <div
                      key={k}
                      className="flex-1"
                      style={{
                        background:
                          "color-mix(in oklch, var(--background) 22%, var(--foreground))",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="absolute inset-x-0 text-center font-semibold uppercase text-muted-foreground"
                style={{
                  bottom: h * 0.1,
                  fontSize: f(0.028),
                  letterSpacing: "0.3em",
                }}
              >
                35mm · Reel 01
              </div>
            </Wall>

            {/* FRONT — slate band, studio branding, take info */}
            <Wall
              width={w}
              height={h}
              left={0}
              transform={`translateZ(${d / 2}px)`}
              outside={theme.front}
              flapLength={d / 2}
              flapOutside={clapper(stripe)}
              flapOpen={open}
              flapDelay={0}
            >
              {/* Clapper band along the top edge */}
              <div
                className="absolute inset-x-0 top-0"
                style={{ height: h * 0.16, background: clapper(stripe) }}
              />

              {/* Branding */}
              <div
                className="absolute inset-x-0 flex items-center justify-center text-foreground"
                style={{ top: h * 0.27, gap: px(0.03) }}
              >
                <MoonClockMark size={px(0.13)} />
                <div className="flex flex-col items-start leading-none">
                  <span
                    className="font-black uppercase"
                    style={{ fontSize: f(0.072), letterSpacing: "0.04em" }}
                  >
                    {BRAND}
                  </span>
                  <span
                    className="font-medium uppercase text-muted-foreground"
                    style={{
                      fontSize: f(0.034),
                      letterSpacing: "0.62em",
                      marginTop: px(0.012),
                    }}
                  >
                    {BRAND_SUFFIX}
                  </span>
                </div>
              </div>

              {/* Slate info */}
              <div
                className="absolute flex border-t border-border font-semibold uppercase text-muted-foreground"
                style={{
                  left: w * 0.07,
                  right: w * 0.07,
                  bottom: h * 0.1,
                  paddingTop: px(0.022),
                  fontSize: f(0.028),
                  letterSpacing: "0.18em",
                }}
              >
                <span className="flex-1">Scene 01</span>
                <span className="flex-1 text-center">Take 01</span>
                <span className="flex-1 text-right text-foreground">
                  ▶ {label}
                </span>
              </div>
            </Wall>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ONE POP-OUT IMAGE                                                   */
/* ------------------------------------------------------------------ */

type Ring = { cx: number; cy: number; rx: number; ry: number };

const DEG = Math.PI / 180;

function PopImage({
  src,
  index,
  count,
  box,
  card,
  ring,
  out,
  flyAway,
}: {
  src: string;
  index: number;
  count: number;
  box: number;
  card: { w: number; h: number };
  ring: Ring;
  out: boolean;
  flyAway: boolean;
}) {
  // Slots spread evenly all the way around the box. The half-step offset
  // keeps the spots straight above and below the box free.
  const target = -90 + (360 / count) * (index + 0.5);

  // Path: deep inside the box → straight up out of the opening → along the
  // ring (the shorter way round) to its slot. So every image visibly climbs
  // out of the box before travelling to its place.
  const insideY = -box * 0.04;
  const delta = ((((target + 90) % 360) + 540) % 360) - 180; // -180…180
  const steps = Math.max(1, Math.ceil(Math.abs(delta) / 30));
  const arc = Array.from({ length: steps + 1 }, (_, k) => {
    const a = (-90 + (delta * k) / steps) * DEG;
    return {
      x: ring.cx + Math.cos(a) * ring.rx,
      y: ring.cy + Math.sin(a) * ring.ry,
    };
  });
  const path = [{ x: 0, y: insideY }, ...arc];
  const final = path[path.length - 1];
  const tilt = Math.sin(target * DEG) * -4 + Math.cos(target * DEG) * 6;

  // Keyframes (all the same length so they share `times`)
  const n = path.length;
  const times = path.map((_, k) =>
    k === 0 ? 0 : 0.35 + (0.65 * (k - 1)) / (n - 2),
  );
  const scales = path.map((_, k) => (k === 0 ? 0.45 : k === n - 1 ? 1 : 0.85));
  const rotates = path.map((_, k) => (k === n - 1 ? tilt : 0));

  const shown = {
    x: [null, ...path.slice(1).map((p) => p.x)],
    y: [null, ...path.slice(1).map((p) => p.y)],
    scale: [null, ...scales.slice(1)],
    rotate: [null, ...rotates.slice(1)],
    opacity: 1,
  };

  const back = [...path].reverse();
  const hidden = {
    x: [null, ...back.slice(1).map((p) => p.x)],
    y: [null, ...back.slice(1).map((p) => p.y)],
    scale: [null, ...[...scales].reverse().slice(1)],
    rotate: [null, ...back.slice(1).map(() => 0)],
    opacity: [null, ...back.slice(1).map((_, k, arr) => (k === arr.length - 1 ? 0 : 1))],
  };
  const backTimes = [...times].reverse().map((t) => 1 - t);

  // Ease per segment: speed up out of the box, glide along the ring at an
  // even pace, settle into the slot (and the same in reverse)
  const eases: ("easeIn" | "easeOut" | "linear")[] = Array.from(
    { length: n - 1 },
    (_, k) => (k === 0 ? "easeIn" : k === n - 2 ? "easeOut" : "linear"),
  );

  const gone = {
    x: final.x * 2.4,
    y: final.y * 2.4,
    scale: 1.4,
    opacity: 0,
    rotate: tilt,
  };

  return (
    <motion.div
      className="absolute overflow-hidden bg-muted shadow-2xl shadow-black/40 ring-1 ring-border"
      style={{
        width: card.w,
        height: card.h,
        marginLeft: -card.w / 2,
        marginTop: -card.h / 2,
      }}
      initial={{ x: 0, y: insideY, scale: 0.45, rotate: 0, opacity: 0 }}
      animate={flyAway ? gone : out ? shown : hidden}
      transition={
        flyAway
          ? { duration: 0.7, ease: [0.55, 0, 0.45, 1] }
          : out
            ? {
                duration: 0.95,
                times,
                ease: eases,
                // lid opens first, then the images climb out one by one
                delay: 0.15 + index * 0.07,
                opacity: { duration: 0.01, delay: 0.15 + index * 0.07 },
              }
            : {
                duration: 0.55,
                times: backTimes,
                ease: eases,
                delay: (count - 1 - index) * 0.02,
              }
      }
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={GATE_IMAGE_SIZES}
        className="object-cover"
      />
    </motion.div>
  );
}