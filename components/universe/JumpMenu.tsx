import { Universe } from "@/config/universes";
import { Marquee } from '@/components/shared/Marquee';
 
export function JumpMenu({ universe }: { universe: Universe }) {
  const links = [
    { label: 'Story', href: '#story' },
    { label: 'Characters', href: '#characters' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Campaign', href: '#campaign' },
    { label: 'Back it', href: '#back' },
  ];

  return (
    <nav
      aria-label={`${universe.name} sections`}
      className="sticky top-10 z-30 border-y backdrop-blur-sm"
      style={{
        borderColor: 'color-mix(in srgb, var(--u-paper) 15%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--u-ink) 85%, transparent)',
      }}
    >
      <Marquee className="md:hidden" speed={24} fadeEdges={false}>
        {links.map((link) => (
          <a key={link.label} href={link.href} className="px-3 py-3 font-heading text-[10px] uppercase tracking-widest">
            {link.label}
          </a>
        ))}
      </Marquee>

      <ul className="hidden gap-8 px-3 py-3 font-heading text-[10px] uppercase tracking-widest md:flex sm:text-[11px]">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="transition-opacity hover:opacity-60">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}