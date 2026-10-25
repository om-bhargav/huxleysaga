'use client';

import type { CSSProperties } from 'react';
import styled from 'styled-components';

/* Animation step for each cell in grid order, so the light snakes:
   top row left→right, middle row right→left, bottom row left→right */
const STEPS = [0, 1, 2, 5, 4, 3, 6, 7, 8];
const STEP = 0.2; // seconds between cells; 9 × 0.2 = one 1.8s loop

type LoaderProps = {
  /** Outer size in px */
  size?: number;
  /** Optional text beside the loader, e.g. "Loading" */
  label?: string;
  className?: string;
};

/**
 * Signal loader: corner brackets around a 3×3 grid of squares that flicker on in a snake,
 * like a feed coming back. Uses currentColor, so it's white on dark pages and dark on light ones.
 */
const Loader = ({ size = 28, label, className }: LoaderProps) => {
  return (
    <StyledWrapper
      role="status"
      aria-label={label ?? 'Loading'}
      className={className}
      style={{ '--s': `${size}px` } as CSSProperties}
    >
      <span className="frame" aria-hidden="true">
        {STEPS.map((step, i) => (
          <i key={i} style={{ animationDelay: `${step * STEP}s` }} />
        ))}
      </span>
      {label && <span className="label">{label}</span>}
    </StyledWrapper>
  );
};

const corner = 'linear-gradient(var(--c), var(--c))';

const StyledWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 14px;

  .frame {
    --c: color-mix(in srgb, currentColor 55%, transparent);

    position: relative;
    box-sizing: border-box;
    width: var(--s);
    height: var(--s);
    padding: calc(var(--s) * 0.2);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: calc(var(--s) * 0.08);

    /* Four L-shaped corner brackets */
    background:
      ${corner} top left / 25% 1px no-repeat,
      ${corner} top left / 1px 25% no-repeat,
      ${corner} top right / 25% 1px no-repeat,
      ${corner} top right / 1px 25% no-repeat,
      ${corner} bottom left / 25% 1px no-repeat,
      ${corner} bottom left / 1px 25% no-repeat,
      ${corner} bottom right / 25% 1px no-repeat,
      ${corner} bottom right / 1px 25% no-repeat;
  }

  .frame i {
    background: currentColor;
    opacity: 0.1;
    animation: signal 1.8s linear infinite;
  }

  .label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  /* Blinking cursor block after the label */
  .label::after {
    content: '';
    width: 5px;
    height: 5px;
    background: currentColor;
    animation: blink 1s steps(1) infinite;
  }

  /* Each cell flickers on like a bad signal, then fades back */
  @keyframes signal {
    0%,
    100% {
      opacity: 0.1;
    }
    6% {
      opacity: 1;
    }
    10% {
      opacity: 0.35;
    }
    14% {
      opacity: 1;
    }
    40% {
      opacity: 0.1;
    }
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .frame i,
    .label::after {
      animation: none;
      opacity: 0.5;
    }
  }
`;

export default Loader;