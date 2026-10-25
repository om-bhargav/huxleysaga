/* Public universe shapes: comics from the database, handed back the way config/universes writes them,
   so the universe page blocks and cards read API data without any remapping. */

import type { Universe } from '@/config/universes';

/** GET /api/universes/:slug: one published comic, with its characters and campaigns */
export type UniverseDTO = Universe;

/** GET /api/universes: one card per published comic, in config/worlds order */
export type UniverseSummary = Pick<Universe, 'slug' | 'name' | 'overline' | 'shortName' | 'genre' | 'hook' | 'display' | 'palette'> & {
  hero: { poster: string };
  /** Slug of a world in config/worlds, or null when unassigned */
  worldSlug: string | null;
};
