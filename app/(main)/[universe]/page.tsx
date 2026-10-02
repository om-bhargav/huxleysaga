import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import UniversePage from '@/components/pages/Universe';
import { getUniverse, universes } from '@/config/universes';

/* The six universe paths from specification section 2, served at the root as listed there. */
export function generateStaticParams() {
  return universes.map((universe) => ({ universe: universe.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[universe]'>): Promise<Metadata> {
  const { universe: slug } = await params;
  const universe = getUniverse(slug);
  if (!universe) return {};

  const title = universe.overline ? `${universe.overline}: ${universe.name}` : universe.name;
  return {
    title: `${title} | Night O'Clock Studios`,
    description: universe.hook,
  };
}

export default async function Page({ params }: PageProps<'/[universe]'>) {
  const { universe: slug } = await params;
  const universe = getUniverse(slug);
  if (!universe) notFound();

  return <UniversePage universe={universe} />;
}
