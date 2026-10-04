import type { Metadata } from 'next';
import { SITE_NAME } from '@/config';
export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description:
    'An independent sci-fi universe from concept artist Ben Mauro, published without a studio and funded by its readers.',
};

export { default } from '@/components/pages/About';
