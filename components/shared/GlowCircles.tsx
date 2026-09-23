'use client';

import { useEffect, useRef } from 'react';

type GlowCirclesProps = {
  /** Distance between circle centers (px) */
  spacing?: number;
  /** Circle radius (px) */
  radius?: number;
  /** How far from the cursor circles still light up (px) */
  reach?: number;
  className?: string;
};

/**
 * A grid of empty ring circles covering its parent. Rings near the mouse glow,
 * then fade back out smoothly when it moves away. Place inside a relative box.
 */
export function GlowCircles({ spacing = 60, radius = 8, reach = 150, className = '' }: GlowCirclesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let offX = 0;
    let offY = 0;
    let glow = new Float32Array(0); // current brightness of each circle, 0–1
    let raf = 0;
    const mouse = { x: -9999, y: -9999, inside: false };

    // Draws one frame; returns true while any circle is still fading
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      let moving = false;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = offX + c * spacing;
          const y = offY + r * spacing;

          const d = Math.hypot(x - mouse.x, y - mouse.y);
          const target = mouse.inside ? Math.max(0, 1 - d / reach) ** 2 : 0;
          glow[i] += (target - glow[i]) * 0.12; // ease toward target for a soft fade
          if (Math.abs(target - glow[i]) > 0.002) moving = true;

          const g = glow[i];
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(255,255,255,${0.06 + g * 0.75})`;
          ctx.shadowColor = `rgba(255,255,255,${g})`;
          ctx.shadowBlur = g > 0.02 ? 14 * g : 0;
          ctx.stroke();
        }
      }
      return moving;
    };

    const loop = () => {
      raf = draw() ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / spacing) + 1;
      rows = Math.ceil(h / spacing) + 1;
      offX = (w - (cols - 1) * spacing) / 2; // center the grid
      offY = (h - (rows - 1) * spacing) / 2;
      glow = new Float32Array(cols * rows);
      draw();
    };

    // Listen on the window so the canvas itself can stay pointer-events: none
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= rect.width && mouse.y <= rect.height;
      kick();
    };
    const onLeave = () => {
      mouse.inside = false;
      kick();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [spacing, radius, reach]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 size-full ${className}`} />;
}