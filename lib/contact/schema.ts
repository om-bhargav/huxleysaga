import { z } from 'zod';
import { CONTACT_MESSAGE_MAX, CONTACT_STATUSES, CONTACT_TOPICS } from './types';

const topics = CONTACT_TOPICS.map((t) => t.value) as [ContactTopicValue, ...ContactTopicValue[]];
type ContactTopicValue = (typeof CONTACT_TOPICS)[number]['value'];

/**
 * The contact form. Used by react-hook-form on the page (zodResolver) and by POST /api/contact,
 * so the visitor sees exactly the errors the server would give.
 */
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Tell us who you are').max(120, 'That name is a bit long'),
  email: z
    .string()
    .trim()
    .min(1, 'We need an address to reply to')
    .pipe(z.email('That address looks off').max(254, 'That address looks off')),
  topic: z.enum(topics, { error: 'Pick a topic' }),
  message: z
    .string()
    .trim()
    .min(10, 'A little more detail, please (10+ characters)')
    .max(CONTACT_MESSAGE_MAX, `Keep it under ${CONTACT_MESSAGE_MAX} characters`),
  /** Honeypot: hidden from people, bots fill it in */
  website: z.string().optional(),
});

export type ContactFormValues = z.input<typeof contactFormSchema>;

/** PATCH /api/contact-requests/[id]: the admin moves a request through the inbox */
export const contactUpdateSchema = z.object({
  status: z.enum(CONTACT_STATUSES),
});

/** Query for GET /api/contact-requests, e.g. ?status=NEW,READ&topic=PRESS&q=film */
export const contactQuerySchema = z.object({
  status: z
    .string()
    .transform((s) => s.split(',').map((v) => v.trim().toUpperCase()))
    .pipe(z.array(z.enum(CONTACT_STATUSES)))
    .optional(),
  topic: z.enum(topics).optional(),
  q: z.string().trim().optional(),
});
