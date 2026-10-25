import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import UniversePage from '@/components/pages/Universe';
import { getUniverseMeta } from '@/lib/universes/queries';

/* Universe pages are served at the root, e.g. /venom-vixens, one per published comic in the database.
   The server only checks the comic exists (for a real 404 and the page title);
   the page itself loads the full comic from /api/universes/:slug behind a spinner. */

/** One lookup per request, shared by the metadata and the page */
const getMeta = cache(getUniverseMeta);

export async function generateMetadata({ params }: PageProps<'/[universe]'>): Promise<Metadata> {
  const { universe: slug } = await params;
  const universe = await getMeta(slug);
  if (!universe) return {};

  const title = universe.overline ? `${universe.overline}: ${universe.name}` : universe.name;
  return {
    title: `${title} | Night O'Clock Studios`,
    description: universe.hook,
  };
}

export default async function Page({ params }: PageProps<'/[universe]'>) {
  const { universe: slug } = await params;
  if (!(await getMeta(slug))) notFound();

  return <UniversePage slug={slug} />;
}
