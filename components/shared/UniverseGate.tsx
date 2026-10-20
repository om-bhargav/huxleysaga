"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Transition,
  type Variants,
} from "framer-motion";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GATE_IMAGES, GATE_IMAGE_SIZES } from "@/lib/assets";

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */

const BRAND = "Night O'Clock";
const BRAND_SUFFIX = "Studios";
const TAGLINE = "Enter after dark.";

const AGE_KEY = "noc-age-verified"; // localStorage key for a confirmed 18+ answer
const LEAVE_HREF = "https://www.google.com"; // where "Leave" sends people by default

const MAX_BOX = 240; // box width on large screens (px)
const BOX_VW = 0.42; // box width on small screens (fraction of viewport width)
const ZOOM_DURATION = 1.1; // seconds
const FLAP_OPEN_TIME = 450; // ms to wait for the flaps if they were closed on click
const MAX_CARDS = 9; // more than this and the fan gets too crowded to read
const TOUCH_PREVIEW_DELAY = 900; // ms before touch screens get the preview on their own

type Bezier = [number, number, number, number];
const zoomEase: Bezier = [0.7, 0, 0.2, 1];
const easeOutSoft: Bezier = [0.22, 1, 0.36, 1];
const RISE: Bezier = [0.5, 0, 0.9, 0.4]; // speeding up out of the box
const SETTLE: Bezier = [0.16, 1, 0.3, 1]; // gliding into place
const SINK: Bezier = [0.5, 0, 0.75, 0]; // dropping back in

const DEG = Math.PI / 180;
const pad = (n: number) => String(n).padStart(2, "0");

/* Fine film grain, drawn once as an SVG noise tile */
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>")`;

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

/**
 * checking  — reading a saved answer (nothing shown yet, so no flash)
 * ask       — the 18+ question is on screen
 * confirmed — answered yes, the question is fading out
 * ok        — the box is shown
 */
type AgeState = "checking" | "ask" | "confirmed" | "ok";

/** Where the cards are: inside the box, fanned out above it, or flying past the camera */
type CardState = "rest" | "out" | "gone";

// Instant jump (ignores any `scroll-behavior: smooth` on the page).
const scrollToTop = () =>
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

/* ------------------------------------------------------------------ */
/* FAN LAYOUT                                                          */
/* ------------------------------------------------------------------ */

type Slot = {
  /** Resting spot in the fan, relative to the box's centre */
  x: number;
  y: number;
  rotate: number;
  /** translateZ: the middle of the fan sits closest to the viewer */
  depth: number;
  /** Reveal order: middle card first, then outwards */
  order: number;
  /** Where it flies to when the box zooms in */
  gx: number;
  gy: number;
};

/**
 * The cards fan out above the box like a hand of cards held from inside it:
 * every card is rotated around a pivot below the opening. The radius shrinks
 * on small screens so the whole fan always fits.
 */
function fanLayout(count: number, box: number, viewport: { w: number; h: number }) {
  const card = { w: box * 0.4, h: box * 0.54 };
  const pivotY = box * 0.3;
  const minRadius = box * 0.85;
  const maxRadius = box * 1.3;

  // Largest radius that keeps the top card on screen
  const fitTop = viewport.h / 2 - 24 - card.h / 2 + pivotY;

  // Largest radius that keeps the outermost (rotated) cards on screen
  const fitSide = (spread: number) => {
    const half = (spread / 2) * DEG;
    if (half <= 0) return Infinity;
    const cardReach = (card.w / 2) * Math.cos(half) + (card.h / 2) * Math.sin(half);
    return (viewport.w / 2 - 12 - cardReach) / Math.sin(half);
  };

  // Start with a generous spread and close the fan until it fits the width
  let step = count > 1 ? Math.min(14, 84 / (count - 1)) : 0; // degrees between cards
  while (count > 1 && step > 4 && fitSide(step * (count - 1)) < minRadius) step *= 0.9;
  const spread = step * (count - 1);
  const radius = Math.max(minRadius, Math.min(maxRadius, fitTop, fitSide(spread)));

  const ranked = Array.from({ length: count }, (_, i) => i).sort((a, b) => {
    const da = Math.abs(a - (count - 1) / 2);
    const db = Math.abs(b - (count - 1) / 2);
    return da - db || a - b;
  });

  const slots: Slot[] = Array.from({ length: count }, (_, i) => {
    const angle = -spread / 2 + step * i;
    const a = angle * DEG;
    const t = count > 1 ? (i / (count - 1)) * 2 - 1 : 0; // -1 … 1 across the fan
    const x = Math.sin(a) * radius;
    const y = pivotY - Math.cos(a) * radius;
    return {
      x,
      y,
      rotate: angle,
      depth: (1 - Math.abs(t)) * 60,
      order: ranked.indexOf(i),
      gx: x + Math.sin(a) * viewport.w * 0.7,
      gy: y - Math.cos(a) * viewport.h * 0.7,
    };
  });

  return { card, slots, riseY: -box * 0.55, insideY: box * 0.02 };
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

/**
 * Wrap your page with this. First an age check asks the visitor to confirm
 * they are 18+ (or leave). Once confirmed, a Night O'Clock Studios film box
 * sits in the middle of the screen.
 * - Hover (or keyboard focus; on touch screens it happens by itself): the
 *   clapper-striped lid opens and the images rise out of the box and fan out
 *   above it like a hand of film frames. The fan tilts with the pointer, and
 *   hovering one frame lifts it while the others dim.
 * - Click (the box or any frame): the page is rendered for the first time,
 *   then the box zooms in until it fills the screen and the page is revealed
 *   through it, while the frames fly past the camera.
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
  ageGate = true,
  rememberAge = true,
  tagline = TAGLINE,
  leaveHref = LEAVE_HREF,
  onLeave,
}: {
  children: ReactNode;
  images?: string[];
  label?: string;
  onEnter?: () => void;
  /** Ask "are you 18+?" before showing the box */
  ageGate?: boolean;
  /** Remember a "yes" in localStorage so returning visitors go straight to the box */
  rememberAge?: boolean;
  /** Line under the brand on the age check */
  tagline?: string;
  /** Where "Leave" sends the visitor (ignored if `onLeave` is given) */
  leaveHref?: string;
  /** Custom handler for "Leave" */
  onLeave?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>("idle");
  const [age, setAge] = useState<AgeState>(ageGate ? "checking" : "ok");
  const [preview, setPreview] = useState(false);
  const [touch, setTouch] = useState(false);
  const [focusCard, setFocusCard] = useState<number | null>(null);
  const [box, setBox] = useState(MAX_BOX);
  const [viewport, setViewport] = useState({ w: 1280, h: 800 });
  const [zoomScale, setZoomScale] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);
  const flapsWereOpen = useRef(false);

  const verified = age === "ok";

  const onEnterRef = useRef(onEnter);
  useEffect(() => {
    onEnterRef.current = onEnter;
  }, [onEnter]);

  // AGE CHECK — skip the question if this browser already said yes
  useEffect(() => {
    if (!ageGate) {
      setAge("ok");
      return;
    }
    let saved = false;
    if (rememberAge) {
      try {
        saved = window.localStorage.getItem(AGE_KEY) === "1";
      } catch {
        // storage blocked (private mode etc.) — just ask
      }
    }
    setAge(saved ? "ok" : "ask");
  }, [ageGate, rememberAge]);

  const confirmAge = () => {
    if (rememberAge) {
      try {
        window.localStorage.setItem(AGE_KEY, "1");
      } catch {
        // not remembered, but still let them in
      }
    }
    setAge("confirmed");
  };

  const leave = () => {
    if (onLeave) onLeave();
    else window.location.href = leaveHref;
  };

  // Box size and fan follow the viewport
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

  // Touch screens can't hover, so they get the preview on their own —
  // but only once the box is actually on screen.
  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches) return;
    setTouch(true);
    if (!verified) return;
    const t = window.setTimeout(() => setPreview(true), TOUCH_PREVIEW_DELAY);
    return () => window.clearTimeout(t);
  }, [verified]);

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
      // Let Space still press buttons (the box, the age-check buttons)
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

  // The fan leans gently towards the pointer
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 90, damping: 18, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 90, damping: 18, mass: 0.6 });
  const fanRotateY = useTransform(springX, [-1, 1], [-12, 12]);
  const fanRotateX = useTransform(springY, [-1, 1], [9, -9]);

  useEffect(() => {
    if (reduceMotion || stage === "open") return;
    const move = (e: PointerEvent) => {
      pointerX.set((e.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [reduceMotion, stage, pointerX, pointerY]);

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
    if (stage !== "idle" || !verified) return;

    if (reduceMotion) {
      setStage("open");
      onEnterRef.current?.();
      return;
    }

    flapsWereOpen.current = preview;
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
  const flapsOpen = verified && (preview || stage !== "idle");

  const cards = images.slice(0, MAX_CARDS);
  const fan = useMemo(() => fanLayout(cards.length, box, viewport), [cards.length, box, viewport]);
  const cardState: CardState = zooming ? "gone" : flapsOpen ? "out" : "rest";

  // How far the open fan reaches above and to the sides of the box's centre
  const reach = useMemo(() => {
    if (!fan.slots.length) return { top: 0, side: 0 };
    return {
      top: Math.min(...fan.slots.map((s) => s.y)) - fan.card.h * 0.75,
      side: Math.max(...fan.slots.map((s) => Math.abs(s.x))) + fan.card.w * 0.85,
    };
  }, [fan]);
  const activeCard = cardState === "out" ? focusCard : null;

  const zoomTransition: Transition = {
    duration: ZOOM_DURATION,
    ease: zoomEase,
  };

  // Pen and mouse hover; touch is handled by the automatic preview
  const hoverStart = (e: ReactPointerEvent) => {
    if (e.pointerType !== "touch") setPreview(true);
  };
  const hoverEnd = (e: ReactPointerEvent) => {
    if (e.pointerType === "touch") return;
    setPreview(false);
    setFocusCard(null);
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

            {/* CINEMATIC ATMOSPHERE — overhead spotlight + vignette. The
                spotlight brightens while the fan is out. */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              animate={{ opacity: zooming ? 0 : 1 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: box * 5,
                  height: box * 5,
                  marginLeft: -box * 2.5,
                  marginTop: -box * 2.9,
                  background:
                    "radial-gradient(circle, color-mix(in oklch, var(--foreground) 9%, transparent) 0%, color-mix(in oklch, var(--foreground) 2%, transparent) 38%, transparent 65%)",
                }}
                animate={{ opacity: flapsOpen ? 1 : 0.6, scale: flapsOpen ? 1.08 : 1 }}
                transition={{ duration: 0.8, ease: easeOutSoft }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 40%, color-mix(in oklch, black 30%, transparent) 100%)",
                }}
              />
            </motion.div>

            {/* AGE CHECK — shown before the box. Once it has faded out, the
                box rises in. */}
            <AnimatePresence
              onExitComplete={() => setAge((a) => (a === "confirmed" ? "ok" : a))}
            >
              {age === "ask" && (
                <AgeCheck
                  key="age-check"
                  tagline={tagline}
                  flicker={!reduceMotion}
                  onConfirm={confirmAge}
                  onLeave={leave}
                />
              )}
            </AnimatePresence>

            {verified && (
              <>
                {/* BRAND CAPTION — below the box, clear of the fan */}
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 flex flex-col items-center gap-2 px-4 text-center"
                  style={{ top: `calc(50% + ${box * 0.62}px)` }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: zooming ? 0 : 1, y: 0 }}
                  transition={{ duration: 0.6, delay: zooming ? 0 : 0.3 }}
                >
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground sm:text-xs sm:tracking-[0.5em]">
                    {BRAND} {BRAND_SUFFIX}
                  </span>
                  <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] sm:tracking-[0.3em]">
                    {touch
                      ? `Tap the box to ${label.toLowerCase()}`
                      : `Hover to preview · Click to ${label.toLowerCase()}`}
                  </span>
                </motion.div>

                {/* HOVER ZONE — a still element, so the box lifting on hover can't
                    pull itself out from under the pointer. The cards are inside it,
                    so pointing at them keeps the preview open. */}
                <div
                  className="relative z-20"
                  style={{ width: box, height: box * 0.7 }}
                  onPointerEnter={hoverStart}
                  onPointerLeave={hoverEnd}
                >
                  {/* While the fan is open, an arch over it keeps the preview open in
                      the gap between the box and the cards. Hit-testing follows the
                      rounded corners, so the empty corners of the screen don't count. */}
                  <div
                    aria-hidden="true"
                    className="absolute"
                    style={{
                      left: box / 2 - reach.side,
                      width: reach.side * 2,
                      top: box * 0.35 + reach.top,
                      height: box * 0.35 - reach.top,
                      borderRadius: "50% 50% 0 0 / 70% 70% 0 0",
                      pointerEvents: flapsOpen ? "auto" : "none",
                    }}
                  />

                  {/* Contact shadow: grounds the box, shrinks as it lifts */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 rounded-[50%]"
                    style={{
                      width: box * 1.15,
                      height: box * 0.2,
                      marginLeft: -box * 0.575,
                      bottom: -box * 0.16,
                      background:
                        "radial-gradient(closest-side, color-mix(in oklch, black 60%, transparent), transparent)",
                      filter: "blur(8px)",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: zooming ? 0 : flapsOpen ? 0.55 : 0.85, scale: flapsOpen ? 0.88 : 1 }}
                    transition={{ duration: 0.6, ease: easeOutSoft }}
                  />

                  {/* FILM BOX — back half, cards, front half. The cards sit
                      between the halves, so they start INSIDE the box (hidden by
                      its front walls) and rise out of the opening. */}
                  <motion.button
                    type="button"
                    aria-label={`${label} ${BRAND} ${BRAND_SUFFIX}`}
                    onClick={enter}
                    onFocus={() => setPreview(true)}
                    onBlur={() => {
                      if (!touch) setPreview(false);
                    }}
                    disabled={stage !== "idle"}
                    className="relative cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8 focus-visible:ring-offset-background"
                    style={{ width: box, height: box * 0.7 }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                      zooming
                        ? { opacity: 0, y: 0, scale: zoomScale * 0.5 }
                        : { opacity: 1, y: flapsOpen ? -4 : 0, scale: 1 }
                    }
                    transition={
                      zooming
                        ? {
                            scale: zoomTransition,
                            opacity: { duration: 0.6, ease: "easeIn" },
                          }
                        : { duration: 0.6, ease: easeOutSoft }
                    }
                  >
                    <FilmBox part="back" width={box} open={flapsOpen} label={label} />

                    {/* The fan: a 3D layer that leans towards the pointer */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2"
                      style={{ perspective: box * 4.5 }}
                    >
                      <motion.div
                        className="absolute left-0 top-0"
                        style={{
                          transformStyle: "preserve-3d",
                          rotateX: reduceMotion ? 0 : fanRotateX,
                          rotateY: reduceMotion ? 0 : fanRotateY,
                        }}
                      >
                        {cards.map((src, i) => (
                          <FanCard
                            key={`${i}-${src}`}
                            src={src}
                            index={i}
                            count={cards.length}
                            slot={fan.slots[i]}
                            card={fan.card}
                            riseY={fan.riseY}
                            insideY={fan.insideY}
                            state={cardState}
                            focused={activeCard === i}
                            dimmed={activeCard !== null && activeCard !== i}
                            float={!reduceMotion}
                            onFocusCard={setFocusCard}
                          />
                        ))}
                      </motion.div>
                    </div>

                    <FilmBox part="front" width={box} open={flapsOpen} label={label} />
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* AGE CHECK                                                           */
/* ------------------------------------------------------------------ */

const ageList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

const ageItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutSoft } },
};

/** The brand title stutters on like a projector warming up */
const ageFlicker: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: [0, 1, 0.25, 1, 0.6, 1],
    transition: { duration: 1, times: [0, 0.15, 0.25, 0.4, 0.5, 1], ease: "linear" },
  },
};

/**
 * NIGHT O'CLOCK STUDIOS · Enter after dark. · [ I'm 18+ ] [ Leave ]
 * Sits where the box will be. "I'm 18+" fades it out and brings the box in.
 */
function AgeCheck({
  tagline,
  flicker,
  onConfirm,
  onLeave,
}: {
  tagline: string;
  flicker: boolean;
  onConfirm: () => void;
  onLeave: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-check-title"
      aria-describedby="age-check-desc"
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
      variants={ageList}
      initial="hidden"
      animate="show"
      exit={{
        opacity: 0,
        scale: 0.96,
        filter: "blur(6px)",
        transition: { duration: 0.4, ease: "easeIn" },
      }}
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <motion.div variants={ageItem}>
          <MoonClockMark size={40} />
        </motion.div>

        <motion.h1
          id="age-check-title"
          variants={flicker ? ageFlicker : ageItem}
          className="mt-5 flex flex-col items-center leading-none text-foreground"
        >
          <span className="text-2xl font-black uppercase tracking-[0.06em] sm:text-3xl">
            {BRAND}
          </span>
          <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.6em] text-muted-foreground sm:text-xs">
            {BRAND_SUFFIX}
          </span>
        </motion.h1>

        {/* Clapper stripe divider */}
        <motion.div
          aria-hidden="true"
          variants={ageItem}
          className="mt-6 h-1.5 w-24 rounded-[1px]"
          style={{ background: clapper(4) }}
        />

        <motion.p
          variants={ageItem}
          className="mt-6 text-base italic text-foreground sm:text-lg"
        >
          {leaving ? "See you after dark." : tagline}
        </motion.p>

        <motion.p
          id="age-check-desc"
          variants={ageItem}
          className="mt-2 text-xs text-muted-foreground"
        >
          This site is for adults only. Please confirm you are 18 or older.
        </motion.p>

        <motion.div
          variants={ageItem}
          className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <button
            type="button"
            autoFocus
            disabled={leaving}
            onClick={onConfirm}
            className="h-11 cursor-pointer rounded-md bg-foreground px-7 text-xs font-semibold uppercase tracking-[0.25em] text-background transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:opacity-40"
          >
            I&rsquo;m 18+
          </button>
          <button
            type="button"
            disabled={leaving}
            onClick={() => {
              setLeaving(true);
              onLeave();
            }}
            className="h-11 cursor-pointer rounded-md border border-border bg-transparent px-7 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:opacity-40"
          >
            {leaving ? "Leaving…" : "Leave"}
          </button>
        </motion.div>

        <motion.p
          variants={ageItem}
          className="mt-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70"
        >
          By entering you confirm you are of legal age where you live
        </motion.p>
      </div>
    </motion.div>
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
            : // wait for the cards to drop back in before closing
              { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: 0.65 + flapDelay }
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
  // Font size, never below 8px so the small print on the box stays legible
  const f = (n: number) => `${Math.max(8, Math.round(w * n))}px`;
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
                  top: h * 0.26,
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
                  bottom: h * 0.08,
                  fontSize: f(0.03),
                  letterSpacing: "0.25em",
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
                style={{ top: h * 0.3, gap: px(0.03) }}
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
                      letterSpacing: "0.5em",
                      marginTop: px(0.014),
                    }}
                  >
                    {BRAND_SUFFIX}
                  </span>
                </div>
              </div>

              {/* Slate info */}
              <div
                className="absolute flex whitespace-nowrap border-t border-border font-semibold uppercase text-muted-foreground"
                style={{
                  left: w * 0.07,
                  right: w * 0.07,
                  bottom: h * 0.09,
                  paddingTop: px(0.022),
                  fontSize: f(0.03),
                  letterSpacing: "0.14em",
                }}
              >
                <span className="flex-1">Scene 01</span>
                {w >= 200 && <span className="flex-1 text-center">Take 01</span>}
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
/* ONE FAN CARD                                                        */
/* ------------------------------------------------------------------ */

type CardCustom = { slot: Slot; riseY: number; insideY: number; count: number };

/**
 * rest — inside the box, invisible. With `initial={false}` the card simply
 *        starts here, so nothing plays on first load.
 * out  — straight up out of the opening, then glides into its place in the fan.
 * gone — flies outwards past the camera, blurring, as the box zooms in.
 */
const cardVariants: Variants = {
  rest: ({ slot, riseY, insideY, count }: CardCustom) => ({
    x: [null, 0, 0],
    y: [null, riseY, insideY],
    rotate: [null, 0, 0],
    scale: [null, 0.78, 0.5],
    opacity: [null, 1, 0],
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      times: [0, 0.55, 1],
      ease: [SINK, SINK],
      delay: (count - 1 - slot.order) * 0.03,
    },
  }),
  out: ({ slot, riseY }: CardCustom) => ({
    x: [null, 0, slot.x],
    y: [null, riseY, slot.y],
    rotate: [null, 0, slot.rotate],
    scale: [null, 0.78, 1],
    opacity: [null, 1, 1],
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      times: [0, 0.36, 1],
      ease: [RISE, SETTLE],
      delay: 0.16 + slot.order * 0.06,
    },
  }),
  gone: ({ slot }: CardCustom) => ({
    x: slot.gx,
    y: slot.gy,
    rotate: slot.rotate * 1.6,
    scale: 1.7,
    opacity: 0,
    filter: "blur(10px)",
    transition: { duration: 0.75, ease: [0.55, 0, 0.45, 1], delay: slot.order * 0.025 },
  }),
};

function FanCard({
  src,
  index,
  count,
  slot,
  card,
  riseY,
  insideY,
  state,
  focused,
  dimmed,
  float,
  onFocusCard,
}: {
  src: string;
  index: number;
  count: number;
  slot: Slot;
  card: { w: number; h: number };
  riseY: number;
  insideY: number;
  state: CardState;
  focused: boolean;
  dimmed: boolean;
  float: boolean;
  onFocusCard: (index: number | null) => void;
}) {
  const out = state === "out";
  // When this card has finished landing in the fan
  const landed = 0.16 + slot.order * 0.06 + 0.8;
  const floating = float && out && !focused;

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{
        width: card.w,
        height: card.h,
        marginLeft: -card.w / 2,
        marginTop: -card.h / 2,
        z: focused ? 160 : slot.depth,
        pointerEvents: out ? "auto" : "none",
      }}
      custom={{ slot, riseY, insideY, count } satisfies CardCustom}
      variants={cardVariants}
      initial={false}
      animate={state}
      onPointerEnter={() => {
        if (out) onFocusCard(index);
      }}
      onPointerLeave={() => onFocusCard(null)}
    >
      {/* Slow idle drift once it has landed */}
      <motion.div
        className="size-full"
        animate={floating ? { y: [0, -5, 0] } : { y: 0 }}
        transition={
          floating
            ? { duration: 3.2 + (index % 3) * 0.6, repeat: Infinity, ease: "easeInOut", delay: landed }
            : { duration: 0.4 }
        }
      >
        {/* The frame itself: lifts when pointed at, dims when another one is */}
        <motion.div
          className="relative size-full overflow-hidden rounded-[3px] bg-neutral-900"
          style={{
            boxShadow:
              "0 22px 45px -14px rgb(0 0 0 / 0.75), 0 0 0 1px rgb(255 255 255 / 0.08)",
          }}
          animate={{
            scale: focused ? 1.14 : 1,
            y: focused ? -12 : 0,
            filter: dimmed ? "brightness(0.4) saturate(0.5)" : "brightness(1) saturate(1)",
          }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={GATE_IMAGE_SIZES}
            className={`object-cover transition-transform duration-700 ease-out ${focused ? "scale-110" : "scale-100"}`}
          />

          {/* Film grain */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px" }}
          />

          {/* Vignette, darker at the foot for the frame number */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgb(0 0 0 / 0.65), transparent 45%), radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.35))",
            }}
          />

          <span className="absolute bottom-1.5 left-2 font-mono text-[9px] tracking-[0.2em] text-white/85">
            {pad(index + 1)}
            <span className="text-white/40">/{pad(count)}</span>
          </span>

          {/* A streak of light sweeps across once it lands */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/2 w-1/2"
            style={{
              background:
                "linear-gradient(105deg, transparent, rgb(255 255 255 / 0.32), transparent)",
            }}
            initial={false}
            animate={{ x: out ? "400%" : "0%" }}
            transition={out ? { duration: 0.9, ease: "easeOut", delay: landed } : { duration: 0 }}
          />

          {/* Frame edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[3px] ring-1 ring-inset ring-white/15"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}