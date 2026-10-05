import { BlockLabel, UniverseHeading } from '@/components/universes/UniverseTheme';

export function Block({
  id,
  index,
  label,
  children,
  className = '',
}: {
  id: string;
  index: number;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-14 px-3 ${className}`}>
      <BlockLabel index={index}>{label}</BlockLabel>
      <div className="mt-8">{children}</div>
    </section>
  );
}