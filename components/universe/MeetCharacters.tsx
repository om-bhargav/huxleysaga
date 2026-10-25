'use client';

import { Block } from '@/components/universe/Block';
import {
  CharactersSection,
  characterNameClass,
  type ShowcaseCharacter,
} from '@/components/shared/CharactersSection';
import type { Universe } from '@/config/universes';
import { UniverseHeading } from '../universes/UniverseTheme';

type Character = Universe['characters'][number];

/* Universe character → the shared showcase shape */
const toShowcase = (c: Character): ShowcaseCharacter => ({
  name: c.name,
  alias: c.alias,
  description: c.copy,
  images: c.images,
  stats: [
    { label: 'Role', value: c.role },
    ...(c.power ? [{ label: 'Power', value: c.power }] : []),
  ],
});

export function MeetCharacters({ universe }: { universe: Universe }) {
  // Universes still waiting on their cast (e.g. The Living Library) skip the section
  if (!universe.characters.length) return null;

  return (
    <Block id="characters" index={3} label="Meet the characters">
      <CharactersSection
        characters={universe.characters.map(toShowcase)}
        colors={{ ink: 'var(--u-ink)', paper: 'var(--u-paper)', accent: 'var(--u-accent)' }}
        renderName={(c) => (
          <UniverseHeading as="h3" className={characterNameClass}>
            {c.name}
          </UniverseHeading>
        )}
      />
    </Block>
  );
}

export default MeetCharacters;