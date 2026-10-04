import type { Metadata } from 'next';
import { SITE_NAME } from '@/config';
export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description:
    `Get in touch about press, licensing, wholesale or an order. One inbox, answered by the team behind the ${SITE_NAME}.`
};

export { default } from '@/components/pages/Contact';
