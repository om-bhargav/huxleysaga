'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

type StretchTextProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Stretches its text horizontally so the visible letters run exactly
 * from the left edge to the right edge of the parent.
 * Font size controls the height; the width is scaled to fit.
 */
export function StretchText({ children, className = '' }: StretchTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fit = () => {
      const cs = getComputedStyle(text);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;

      // Measure the actual ink of the letters, not the spacing around them
      const m = ctx.measureText(text.textContent ?? '');
      const inkStart = -m.actualBoundingBoxLeft; // gap before the first letter
      const inkWidth = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      if (!inkWidth) return;

      const scale = box.clientWidth / inkWidth;
      text.style.transform = `translateX(${-inkStart * scale}px) scaleX(${scale})`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);  // container resized (window resize)
    observer.observe(text); // text's natural width changed (e.g. custom font swapped in)
    document.fonts?.ready.then(fit);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={`w-full overflow-hidden ${className}`}>
      <span ref={textRef} className="inline-block origin-left whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}