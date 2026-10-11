'use client';

import Image, { type ImageProps } from 'next/image';
import { forwardRef, useCallback, useEffect, useRef, useState, type ForwardedRef } from 'react';

/* Loads faster than this (ms) are treated as cached and shown without a fade */
const CACHED_MS = 100;

/* ------------------------------------------------------------------ */
/* LoadedImage                                                         */
/* ------------------------------------------------------------------ */

export type LoadedImageProps = ImageProps & {
  /** Fade length in ms for an image that wasn't ready yet. Default 500 */
  fadeMs?: number;
  /**
   * Called once the image is ready to be seen (cached or freshly loaded). Use it to
   * start an animation around the image, e.g. a zoom, only when there's a picture to show.
   */
  onReady?: () => void;
};

/**
 * A drop-in replacement for next/image that never shows a half-loaded picture.
 * - Already cached: it appears with no fade, so any reveal animation around it
 *   (a wipe, a clip-path, a slide) uncovers the full picture.
 * - Still downloading: it stays invisible, then fades in once it has loaded.
 * - Given a new src: it hides again until the new image is ready.
 *
 * Takes every next/image prop. Your own className, style, onLoad and ref still work.
 *
 *   <LoadedImage src={src} alt="" fill sizes="80px" className="object-cover" />
 */
export const LoadedImage = forwardRef(function LoadedImage(
  { fadeMs = 500, onReady, className = '', style, onLoad, ...props }: LoadedImageProps,
  forwardedRef: ForwardedRef<HTMLImageElement>,
) {
  // waiting: hidden · instant: was cached, shown with no fade · fade: arrived later, fades in
  const [state, setState] = useState<'waiting' | 'instant' | 'fade'>('waiting');
  const startedAt = useRef(0);

  // A new src starts over (compared by value, so an inline static import doesn't reset it)
  const srcKey = typeof props.src === 'string' ? props.src : JSON.stringify(props.src);
  const [shownKey, setShownKey] = useState(srcKey);
  if (shownKey !== srcKey) {
    setShownKey(srcKey);
    setState('waiting');
  }
  useEffect(() => {
    startedAt.current = performance.now();
  }, [srcKey]);

  // Tell the parent once there's a picture to show
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    if (state !== 'waiting') onReadyRef.current?.();
  }, [state, srcKey]);

  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img && !startedAt.current) startedAt.current = performance.now();
      // Finished before React attached onLoad
      if (img?.complete && img.naturalWidth > 0) setState((s) => (s === 'waiting' ? 'instant' : s));
      if (typeof forwardedRef === 'function') forwardedRef(img);
      else if (forwardedRef) forwardedRef.current = img;
    },
    [forwardedRef],
  );

  return (
    <Image
      {...props}
      ref={ref}
      onLoad={(e) => {
        // Arrived within a tenth of a second: it came from the cache, so skip the fade
        const fast = performance.now() - startedAt.current < CACHED_MS;
        setState((s) => (s === 'waiting' ? (fast ? 'instant' : 'fade') : s));
        onLoad?.(e);
      }}
      className={className}
      style={{
        ...style,
        opacity: state === 'waiting' ? 0 : style?.opacity ?? 1,
        transition: [state === 'fade' ? `opacity ${fadeMs}ms ease-out` : '', style?.transition]
          .filter(Boolean)
          .join(', ') || undefined,
      }}
    />
  );
});

/* ------------------------------------------------------------------ */
/* ImagePreloader                                                      */
/* ------------------------------------------------------------------ */

export type ImagePreloaderProps = {
  /** Images to download ahead of time */
  srcs: string[];
  /**
   * The `sizes` the visible images will use, so the browser requests exactly the same files.
   * Either a string, or a function that picks one per screen, e.g.
   * `(matches) => (matches('(min-width: 1024px)') ? '80px' : '64px')`
   */
  sizes: string | ((matches: (query: string) => boolean) => string);
  /** Match the visible images' `quality` and `unoptimized`, for the same reason */
  quality?: number;
  unoptimized?: boolean;
  /** Extra wait after the page has finished loading (ms), so it never competes with the page's own images. Default 800 */
  delay?: number;
};

/**
 * Quietly downloads images the visitor is likely to see soon (menu thumbnails,
 * the next slides, hover previews) once the page has finished loading, so they
 * appear instantly when they're needed. Renders nothing visible.
 *
 *   <ImagePreloader srcs={thumbs} sizes={(m) => (m('(min-width: 1024px)') ? '80px' : '64px')} />
 */
export function ImagePreloader({ srcs, sizes, quality, unoptimized, delay = 800 }: ImagePreloaderProps) {
  const [resolvedSizes, setResolvedSizes] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => {
        setResolvedSizes(
          typeof sizes === 'function' ? sizes((query) => window.matchMedia(query).matches) : sizes,
        );
      }, delay);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      window.clearTimeout(timer);
    };
    // `sizes` is often an inline function; it's only read once, so it doesn't need to restart this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);

  if (!resolvedSizes || !srcs.length) return null;

  const unique = [...new Set(srcs)];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 size-px overflow-hidden opacity-0">
      {unique.map((src) => (
        <div key={src} className="relative size-px">
          <Image
            src={src}
            alt=""
            fill
            sizes={resolvedSizes}
            quality={quality}
            unoptimized={unoptimized}
            loading="eager"
          />
        </div>
      ))}
    </div>
  );
}

export default LoadedImage;