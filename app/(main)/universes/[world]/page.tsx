import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import WorldPage from '@/components/pages/World';
import { getWorld, worlds } from '@/config/worlds';

/* One page per world: /universes/spy-files, /universes/wild-west, ... */
export function generateStaticParams() {
  return worlds.map((world) => ({ world: world.slug }));
}
 
export async function generateMetadata({ params }: PageProps<'/universes/[world]'>): Promise<Metadata> {
  const { world: slug } = await params;
  const world = getWorld(slug);
  if (!world) return {};

  return {
    title: `${world.label} | Night O'Clock Studios`,
    description: world.line,
  };
}

export default async function Page({ params }: PageProps<'/universes/[world]'>) {
  const { world: slug } = await params;
  const world = getWorld(slug);
  if (!world) notFound();

  return <WorldPage world={world} />;
}