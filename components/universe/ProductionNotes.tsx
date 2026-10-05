'use client';

import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiX } from 'react-icons/fi';
import type { Universe } from '@/config/universes';
import Flicker from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

const line = 'color-mix(in srgb, var(--u-paper) 15%, transparent)';

/** Design direction from the spec, kept on the page while the bespoke motion is built. */
export function ProductionNotes({ universe }: { universe: Universe }) {
  const [open, setOpen] = useState(false);
  const panelId = `${useId()}-notes`;

  const notes = [
    { label: 'Type', value: universe.direction.type },
    { label: 'Motion', value: universe.direction.motion },
    { label: 'Cursor / sound', value: universe.direction.cursor },
    { label: 'Character reveal', value: universe.direction.reveal },
    { label: 'Gallery', value: universe.direction.gallery },
  ];

  return (
    <section className="px-3 pb-10">
      {/* The frame and its toggle flicker on as the section scrolls in */}
      <Flicker amount={0.6} className="border" style={{ borderColor: line }}>
        {/* A button instead of <details>, so the panel can animate open and closed */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 p-3.5 text-left font-heading text-[10px] uppercase tracking-widest focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-2 sm:text-[11px]"
        >
          <span className="opacity-60">Design direction from the spec — not yet built</span>
          {open ? (
            <FiX aria-hidden="true" className="size-3 shrink-0 opacity-60" />
          ) : (
            <FiPlus aria-hidden="true" className="size-3 shrink-0 opacity-60" />
          )}
        </button>

        {/* Height opens the space; each note then flickers its label on and unfolds its text in 3D */}
        <motion.div
          id={panelId}
          initial={false}
          animate={{ height: open ? 'auto' : 0 }}
          transition={{ duration: 0.45, ease }}
          className="overflow-hidden"
          aria-hidden={!open}
        >
          <dl className="grid gap-5 p-3.5 pt-0 lg:grid-cols-2">
            {notes.map((note, i) => (
              <div key={note.label}>
                <dt className="font-heading text-[10px] uppercase tracking-widest sm:text-[11px]">
                  {/* Flicker owns opacity, so the dimming sits on the span inside */}
                  <Flicker as="span" active={open} delay={0.15 + i * 0.08} className="block">
                    <span className="opacity-50">{note.label}</span>
                  </Flicker>
                </dt>
                <dd className="mt-1.5">
                  {/* No opacity animation in Reveal3D, so opacity-70 stays */}
                  <Reveal3D
                    as="span"
                    text={note.value}
                    active={open}
                    delay={0.25 + i * 0.08}
                    stagger={0.01}
                    className="block text-xs leading-relaxed opacity-70 sm:text-sm"
                  />
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </Flicker>
    </section>
  );
}