import { getImageProps } from "next/image";
import { getUniverse } from "@/config/universes";

/* ------------------------------------------------------------------ */
/* MANIFEST — everything the loader waits for                          */
/* ------------------------------------------------------------------ */

export type Asset =
  | {
      type: "image";
      src: string;
      /** Must match the `sizes` the <Image> is rendered with, so the same file is fetched */
      sizes: string;
    }
  | { type: "video"; src: string };

const image = (src: string, sizes = "100vw"): Asset => ({
  type: "image",
  src,
  sizes,
});
const video = (src: string): Asset => ({ type: "video", src });

// Slideshow in the loader itself
export const LOADER_IMAGES = [
  "https://picsum.photos/seed/shatter-1/1200/1200",
  "https://picsum.photos/seed/shatter-2/1200/1200",
  "https://picsum.photos/seed/shatter-3/1200/1200",
  "https://picsum.photos/seed/shatter-4/1200/1200",
  "https://picsum.photos/seed/shatter-5/1200/1200",
];
export const LOADER_IMAGE_SIZES = "(max-width: 525px) 80vw, 420px";

// Cards that climb out of the film box (UniverseGate)
export const GATE_IMAGES = [
  "https://picsum.photos/seed/universe-1/600/800",
  "https://picsum.photos/seed/universe-2/600/800",
  "https://picsum.photos/seed/universe-3/600/800",
  "https://picsum.photos/seed/universe-4/600/800",
  "https://picsum.photos/seed/universe-5/600/800",
  "https://picsum.photos/seed/universe-6/600/800",
];
// Widest a card ever gets (36% of the 240px box)
export const GATE_IMAGE_SIZES = "90px";

// Full-bleed banners at the top of each page. Placeholders, swap for your own.
export const HOME_HERO_IMAGE = "https://picsum.photos/seed/huxley/1920/1080";
export const ABOUT_BANNER =
  "https://picsum.photos/seed/huxley-about-1/1920/1080";
export const CONTACT_BANNER =
  "https://picsum.photos/seed/huxley-contact-1/1920/1080";
export const UNIVERSES_BANNER =
  "https://picsum.photos/seed/huxley-universes-1/1920/1080";

// Needed on every page
const SHARED_ASSETS: Asset[] = [
  ...LOADER_IMAGES.map((src) => image(src, LOADER_IMAGE_SIZES)),
  ...GATE_IMAGES.map((src) => image(src, GATE_IMAGE_SIZES)),
];

// Needed only on one page. Add images or videos here as the pages grow.
const PAGE_ASSETS: Record<string, Asset[]> = {
  "/": [image(HOME_HERO_IMAGE)],
  "/about": [image(ABOUT_BANNER)],
  "/contact": [image(CONTACT_BANNER)],
  "/universes": [image(UNIVERSES_BANNER)],
};

/** Everything to load before showing the page at `pathname`. */
export function getAssets(pathname: string): Asset[] {
  const page = PAGE_ASSETS[pathname];
  if (page) return [...SHARED_ASSETS, ...page];

  // Universe pages (/venom-vixens …): the intro video, or its poster if there is none
  const universe = getUniverse(pathname.slice(1));
  if (!universe) return SHARED_ASSETS;

  const { video: heroVideo, poster } = universe.hero;
  return [...SHARED_ASSETS, heroVideo ? video(heroVideo) : image(poster)];
}

/* ------------------------------------------------------------------ */
/* PRELOADING                                                          */
/* ------------------------------------------------------------------ */

// A slow or broken asset is given up on after this long, so it can never
// hold the site behind the loader. Also covers phones that refuse to buffer
// video before the user has touched the page.
const ASSET_TIMEOUT = 10_000; // ms

function loadImage(src: string, sizes: string) {
  return new Promise<void>((resolve) => {
    // Same URLs next/image will request, so the page gets them from cache
    const { props } = getImageProps({ src, alt: "", fill: true, sizes });

    const img = new window.Image();
    img.onload = img.onerror = () => resolve();
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  });
}

function loadVideo(src: string) {
  return new Promise<void>((resolve) => {
    const el = document.createElement("video");
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    // Enough is buffered to play through without stopping
    el.oncanplaythrough = el.onerror = () => resolve();
    el.src = src;
    el.load();
  });
}

/**
 * Loads every asset and reports progress as a fraction (0…1) each time one
 * finishes. Failed assets count as finished. Returns a function that stops
 * further progress reports.
 */
export function preloadAssets(
  assets: Asset[],
  onProgress: (fraction: number) => void,
) {
  let cancelled = false;
  let done = 0;

  if (assets.length === 0) onProgress(1);

  assets.forEach((asset) => {
    const load =
      asset.type === "video"
        ? loadVideo(asset.src)
        : loadImage(asset.src, asset.sizes);
    const timeout = new Promise<void>((resolve) =>
      setTimeout(resolve, ASSET_TIMEOUT),
    );

    Promise.race([load, timeout]).then(() => {
      done += 1;
      if (!cancelled) onProgress(done / assets.length);
    });
  });

  return () => {
    cancelled = true;
  };
}
