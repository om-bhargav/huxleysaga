/* Contact request shapes shared by the contact form, the API and the admin. Mirrors ContactRequest in prisma/schema.prisma. */

/* Placeholder hints: swap in your real copy */
export const CONTACT_TOPICS = [
  { value: 'PRESS', label: 'Press', hint: 'Interviews, features, press assets' },
  { value: 'LICENSING', label: 'Licensing', hint: 'Film, games, collaborations' },
  { value: 'WHOLESALE', label: 'Wholesale', hint: 'Stockists and bulk orders' },
  { value: 'ORDERS', label: 'Orders', hint: 'Shipping, returns, order issues' },
  { value: 'OTHER', label: 'Other', hint: 'Anything else' },
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value'];

export const topicLabel = (topic: ContactTopic) => CONTACT_TOPICS.find((t) => t.value === topic)?.label ?? topic;

export const CONTACT_STATUSES = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_MESSAGE_MAX = 2000;

/** A contact request as the admin API returns it */
export type ContactRequestDTO = {
  id: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
};
