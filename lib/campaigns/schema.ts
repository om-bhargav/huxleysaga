import { z } from 'zod';
import { CAMPAIGN_STATUSES } from './types';

const text = (label: string) => z.string().trim().min(1, `${label} is required`);
const count = z.number().int().nonnegative();
/* '' from a cleared date input means "no date" */
const date = z.preprocess((v) => (v === '' ? null : v), z.coerce.date().nullable()).optional();

/** POST /api/campaigns. Defaults for status, raised, backers and sortOrder come from the database. */
export const campaignCreateSchema = z.object({
  title: text('Title'),
  description: text('Description'),
  image: text('Image'),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  raised: count.optional(),
  goal: z.number().int().positive('Goal must be more than 0'),
  backers: count.optional(),
  startsAt: date,
  endsAt: date,
  buttonLabel: text('Button label'),
  buttonHref: text('Button link'),
  universeSlug: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

/** PATCH /api/campaigns/[id]: any subset */
export const campaignUpdateSchema = campaignCreateSchema.partial();

/** Query for GET /api/campaigns, e.g. ?status=LIVE,UPCOMING&universe=venom-vixens&limit=6 */
export const campaignQuerySchema = z.object({
  status: z
    .string()
    .transform((s) => s.split(',').map((v) => v.trim().toUpperCase()))
    .pipe(z.array(z.enum(CAMPAIGN_STATUSES)))
    .optional(),
  universe: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
