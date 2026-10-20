/* Character shapes shared by the API and the browser. Mirrors the Character model in prisma/schema.prisma. */

/** A character as the API returns it */
export type CharacterDTO = {
  id: string;
  name: string;
  alias: string | null;
  /** Bio */
  copy: string;
  power: string | null;
  role: string;
  image: string;
  sortOrder: number;
  /** Slugs of the comics this character appears in */
  comics: string[];
  createdAt: string;
  updatedAt: string;
};

/** Body for POST /api/characters. PATCH takes any subset; `comics` there replaces the whole list. */
export type CharacterInput = {
  name: string;
  alias?: string | null;
  copy: string;
  power?: string | null;
  role: string;
  image: string;
  sortOrder?: number;
  comics: string[];
};
