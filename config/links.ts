/**
 * Master list of external links (specification section 3.3).
 * The notes list socials in four places with different sets; this is the one list
 * the nav, footer, contact page and final CTA all read from.
 *
 * TODO: every URL is [URL] in the spec — drop in the real ones here and nowhere else.
 */
export type ExternalLink = { label: string; href: string };

export const socialLinks: ExternalLink[] = [
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
  { label: 'YouTube', href: '#' },
  { label: 'Discord', href: '#' },
  { label: 'Patreon', href: '#' },
];

export const communityLinks: ExternalLink[] = [
  { label: 'Facebook Group', href: '#' },
  { label: 'Kickstarter', href: '#' },
  { label: 'Shop', href: '#' },
];
