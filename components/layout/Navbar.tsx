'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion';
import { FaDiscord, FaInstagram, FaPatreon, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { Divider } from '../shared/Divider';
import { socialLinks } from '@/config/links';

type NavItem = { label: string; href: string };

/* Specification 3.1: Home plus the worlds as plain links.
   Fill in each world's href; a blank one is never marked active. */
const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Spy Files', href: '/universes/spy-files' },
  { label: 'Wild West', href: '/universes/wild-west' },
  { label: 'Game World', href: '/universes/game-world' },
  { label: 'Fantasy Land', href: '/universes/fantasy-land' },
];

const socialIcons: Record<string, IconType> = {
  Instagram: FaInstagram,
  X: FaXTwitter,
  YouTube: FaYoutube,
  Discord: FaDiscord,
  Patreon: FaPatreon,
};

/* Master list lives in config/links so nav, footer, contact and the final CTA agree */
const socials = socialLinks.map((link) => ({ ...link, Icon: socialIcons[link.label] }));

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* ---------- Mobile menu ---------- */
const overlay: Variants = {
  closed: {
    clipPath: 'inset(0 0 100% 0)',
    transition: { duration: 0.5, ease, when: 'afterChildren', staggerChildren: 0.03, staggerDirection: -1 },
  },
  open: {
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 0.6, ease, staggerChildren: 0.06, delayChildren: 0.25 },
  },
};
const overlayItem: Variants = {
  closed: { y: '110%', transition: { duration: 0.25, ease } },
  open: { y: 0, transition: { duration: 0.5, ease } },
};

/* Small white square next to a link */
function Marker({ hover = false }: { hover?: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={hover ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease }}
      className="absolute -left-4 top-1/2 -mt-[3px] size-1.5 bg-white"
    />
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (!href) return false;
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  };

  // Close the mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock scroll + Escape to close while the mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        initial={{ y: '-100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="fixed inset-x-0 backdrop-blur-2xl top-0 z-50 font-heading text-[13px] uppercase tracking-wider text-white px-2 md:px-3"
      >
        <div className="grid h-10 grid-cols-[auto_1fr_auto] max-md:flex max-md:flex-row-reverse max-md:justify-between items-center gap-4">
          {/* Left: logo */}
          <Link
            href="/"
            aria-label="Night O'Clock home"
            className="whitespace-nowrap text-base font-bold tracking-tight max-md:order-last"
          >
            Night O&apos;Clock
          </Link>

          {/* Centre: Home and the universes (desktop) */}
          <nav aria-label="Main" className="hidden justify-self-center lg:block">
            <ul className="flex items-center gap-5 xl:gap-8" onMouseLeave={() => setHovered(null)}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.label} className="relative" onMouseEnter={() => setHovered(item.label)}>
                    {/* Always shown on the page you're on */}
                    {active && <Marker />}

                    {/* Extra dot on the hovered link */}
                    <AnimatePresence>{!active && hovered === item.label && <Marker hover />}</AnimatePresence>

                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Left: menu button (mobile) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="relative flex gap-2 items-center uppercase tracking-wider lg:hidden"
          >
            <span className="size-1.5 shrink-0 bg-white" aria-hidden="true" />

            <span className="relative block overflow-hidden">
              {/* Invisible longest label: sets the width so it fits both words, nothing extra */}
              <span className="invisible block" aria-hidden="true">Close</span>

              <AnimatePresence initial={false}>
                <motion.span
                  key={menuOpen ? 'close' : 'menu'}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={{ duration: 0.35, ease }}
                  className="absolute inset-0 flex items-center justify-end"
                >
                  {menuOpen ? 'Close' : 'Menu'}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>

          {/* Right: socials */}
          <ul className="max-md:hidden flex items-center gap-5 justify-self-end sm:gap-7">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <motion.a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  whileHover={{ y: -2, opacity: 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  <Icon className="size-[17px]" aria-hidden="true" />
                </motion.a>
              </li>
            ))}
          </ul>
        </div>

        {/* Header line: draws in on load */}
        <Divider />
      </motion.header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            variants={overlay}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-40 overflow-y-auto bg-black px-4 pb-10 pt-24 font-heading uppercase text-white lg:hidden"
          >
            <nav aria-label="Mobile">
              <ul className="flex flex-col gap-6">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.label} className="overflow-hidden">
                      <motion.div variants={overlayItem}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className="flex items-center gap-3 text-3xl font-bold"
                        >
                          {active && <span className="size-2 bg-white" aria-hidden="true" />}
                          {item.label}
                        </Link>
                      </motion.div>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}