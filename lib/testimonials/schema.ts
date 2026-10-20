import { z } from 'zod';

const text = (label: string) => z.string().trim().min(1, `${label} is required`);

/** POST /api/backer-testimonials */
export const testimonialCreateSchema = z.object({
  quote: text('Quote'),
  name: text('Name'),
  campaign: text('Campaign'),
  /* '' from a cleared input means "no image" */
  image: z.preprocess((v) => (v === '' ? null : v), z.string().trim().nullable()).optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** PATCH /api/backer-testimonials/[id]: any subset */
export const testimonialUpdateSchema = testimonialCreateSchema.partial();

/** Query for GET /api/backer-testimonials, e.g. ?published=true&limit=4 */
export const testimonialQuerySchema = z.object({
  published: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
