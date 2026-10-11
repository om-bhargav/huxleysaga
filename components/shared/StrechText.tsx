'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

type StretchTextProps = {
  children: ReactNode;
  className?: string;
};

const isHighSurrogate = (c: number) => c >= 0xd800 && c <= 0xdbff;
const isLowSurrogate = (c: number) => c >= 0xdc00 && c <= 0xdfff;

/**
 * Stretches its text horizontally so the visible letters run exactly
 * from the left edge to the right edge of the parent.
 * Works with mixed fonts and per-letter spans.
 */
export function StretchText({ children, className = '' }: StretchTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    const range = document.createRange();

    // Where one character's ink starts and ends, relative to the text's left edge.
    // The DOM gives its position in the layout; canvas gives how far the
    // letter shape reaches past that position, measured in that letter's own font.
    const measureChar = (node: Text, index: number, originLeft: number) => {
      const len = isHighSurrogate(node.data.charCodeAt(index)) ? 2 : 1;
      range.setStart(node, index);
      range.setEnd(node, index + len);
      const left = range.getBoundingClientRect().left - originLeft;

      const cs = getComputedStyle(node.parentElement!);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(node.data.slice(index, index + len));

      return {
        inkLeft: left - m.actualBoundingBoxLeft,
        inkRight: left + m.actualBoundingBoxRight,
      };
    };

    const fit = () => {
      // Collect the text nodes that contain visible characters
      const nodes: Text[] = [];
      const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode as Text;
        if (/\S/.test(n.data)) nodes.push(n);
      }
      if (!nodes.length) return;

      // Measure the natural, unstretched layout
      text.style.transform = 'none';
      const origin = text.getBoundingClientRect().left;

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      let lastIndex = lastNode.data.search(/\S\s*$/);
      if (isLowSurrogate(lastNode.data.charCodeAt(lastIndex))) lastIndex--;

      const inkStart = measureChar(firstNode, firstNode.data.search(/\S/), origin).inkLeft;
      const inkEnd = measureChar(lastNode, lastIndex, origin).inkRight;
      const inkWidth = inkEnd - inkStart;
      if (inkWidth <= 0) return;

      const scale = box.clientWidth / inkWidth;
      text.style.transform = `translateX(${-inkStart * scale}px) scaleX(${scale})`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);  // container resized
    observer.observe(text); // natural width changed (e.g. custom font loaded)
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