import { z } from 'zod';

const text = (label: string) => z.string().trim().min(1, `${label} is required`);
/* '' from a cleared input means "none" */
const optionalText = z.preprocess((v) => (v === '' ? null : v), z.string().trim().nullable()).optional();

/** POST /api/characters */
export const characterCreateSchema = z.object({
  name: text('Name'),
  alias: optionalText,
  copy: text('Bio'),
  power: optionalText,
  role: text('Role'),
  image: text('Image'),
  sortOrder: z.number().int().optional(),
  comics: z
    /* Slugs of comics in the database; an unknown one comes back as a 422 from the foreign key */
    .array(z.string().trim().min(1))
    .min(1, 'Pick at least one comic')
    .transform((slugs) => [...new Set(slugs)]),
});

/** PATCH /api/characters/[id]: any subset */
export const characterUpdateSchema = characterCreateSchema.partial();

/** Query for GET /api/characters, e.g. ?comic=silk-sting&q=kat&limit=20 */
export const characterQuerySchema = z.object({
  comic: z.string().optional(),
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
