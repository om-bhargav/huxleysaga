import type { Character, CharacterComic } from '@/lib/generated/prisma/client';
import type { CharacterDTO } from './types';

/** Pass to findMany/create/update so `comics` comes back with the character */
export const characterInclude = { comics: { select: { comicSlug: true } } } as const;

export const toCharacterDTO = (
  character: Character & { comics: Pick<CharacterComic, 'comicSlug'>[] },
): CharacterDTO => ({
  ...character,
  comics: character.comics.map((c) => c.comicSlug),
  createdAt: character.createdAt.toISOString(),
  updatedAt: character.updatedAt.toISOString(),
});
