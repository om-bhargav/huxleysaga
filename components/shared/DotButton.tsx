'use client';

import Link from 'next/link';
import { HoverGroup, HoverHighlight } from './HoverHighlight'; // adjust path
import { useMorphTrigger } from './MorphImage'; // adjust path

type DotButtonProps = {
  label: string;
  href: string;
  className?: string;
};

/**
 * Small square dot above an uppercase label.
 * Hover: the dot grows and the label highlight sweeps in.
 * Inside a <MorphScope>, hovering it also morphs the section's <MorphImage>.
 */
export function DotButton({ label, href, className = '' }: DotButtonProps) {
  const morph = useMorphTrigger();

  return (
    <HoverGroup className={`inline-block ${className}`}>
      <Link
        href={href}
        {...morph}
        className="group/dot flex flex-col items-center gap-5 font-heading text-[11px] uppercase tracking-widest text-white sm:text-[13px]"
      >
        <span
          aria-hidden="true"
          className="size-1.5 bg-white transition-transform duration-300 group-hover/dot:scale-150"
        />
        <HoverHighlight>{label}</HoverHighlight>
      </Link>
    </HoverGroup>
  );
}