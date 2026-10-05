'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Block } from '@/components/universe/Block';
import { RevealImage, type RevealDirection } from '@/components/shared/RevealImage';
import type { Universe } from '@/config/universes';
import { UniverseHeading } from '../universes/UniverseTheme';
import Flicker from '../shared/FlickerText';
import Reveal3D from '../shared/Reveal3d';

type Character = Universe['characters'][number];

const line = 'color-mix(in srgb, var(--u-paper) 15%, transparent)';

/* Wipe direction by column, so a row reads left, up, right instead of all the same way */
const directions: RevealDirection[] = ['left-right', 'bottom-up', 'right-left'];

export function MeetCharacters({ universe }: { universe: Universe }) {
  return (
    <Block id="characters" index={3} label="Meet the characters">
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {universe.characters.map((character, i) => (
          <CharacterCard
            key={character.name}
            character={character}
            direction={directions[i % directions.length]}
            delay={(i % 3) * 0.1}
          />
        ))}
      </ul>
    </Block>
  );
}

function CharacterCard({
  character,
  direction,
  delay,
}: {
  character: Character;
  direction: RevealDirection;
  delay: number;
}) {
  // One trigger per card, so its image and text play in order off the same moment
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <li ref={ref} className="group/char flex flex-col border" style={{ borderColor: line }}>
      {/* Portrait wipes in, glitches as it lands, and glitches again when hovered */}
      <RevealImage
        glitch
        glitchOnHover
        src={character.image}
        alt={character.name}
        direction={direction}
        delay={delay}
        sizes="(min-width: 1280px) 30vw, (min-width: 768px) 46vw, 94vw"
        className="aspect-3/4"
        imageClassName="transition-transform duration-700"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, var(--u-ink), transparent 55%)' }}
        />

        {character.alias && (
          <Flicker
            as="span"
            active={inView}
            delay={delay + 0.9}
            className="absolute left-3 top-3 border px-2 py-1 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]"
            style={{ borderColor: 'var(--u-accent)', color: 'var(--u-accent)' }}
          >
            {character.alias}
          </Flicker>
        )}
      </RevealImage>

      <div className="flex flex-1 flex-col p-3.5 lg:p-5">
        {/* Name blinks on in the universe's display face */}
        <UniverseHeading as="h3" className="text-xl lg:text-2xl">
          <Flicker as="span" active={inView} delay={delay + 0.4} className="block">
            {character.name}
          </Flicker>
        </UniverseHeading>

        {/* Bio: each word unfolds upright in 3D (no opacity animation, so opacity-70 stays) */}
        <Reveal3D
          as="p"
          text={character.copy}
          active={inView}
          delay={delay + 0.55}
          stagger={0.012}
          className="mt-3 flex-1 text-xs leading-relaxed opacity-70 sm:text-sm"
        />

        {/* Stats flicker on last */}
        <Flicker
          as="div"
          active={inView}
          delay={delay + 1}
          className="mt-5 border-t pt-3"
          style={{ borderColor: line }}
        >
          <dl className="grid grid-cols-2 gap-3 font-heading text-[10px] uppercase tracking-widest sm:text-[11px]">
            <div>
              <dt className="opacity-50">Role</dt>
              <dd className="mt-1.5">{character.role}</dd>
            </div>
            {character.power && (
              <div>
                <dt className="opacity-50">Power</dt>
                <dd className="mt-1.5">{character.power}</dd>
              </div>
            )}
          </dl>
        </Flicker>
      </div>
    </li>
  );
}

export default MeetCharacters;