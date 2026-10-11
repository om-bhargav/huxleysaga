'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion';
import { FaDiscord, FaInstagram, FaPatreon, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import { FiChevronDown } from 'react-icons/fi';
import { IoPlayForward } from 'react-icons/io5';
import { Divider } from '../shared/Divider';
import { HoverGroup, HoverHighlight } from '../shared/HoverHighlight';
import { universes } from '@/config/universes';
import { socialLinks } from '@/config/links';
import RevealImage from '../shared/RevealImage';

type Product = { label: string; href: string; description: string; image: string };
/* A plain link has an href; a world group has children instead and opens the panel */
type NavItem = { label: string; href?: string; children?: Product[] };

/* The worlds and which universes sit in each. Slugs match config/universes,
   so names, hooks and images stay in that one list. */
const worlds = [
  { label: 'Spy Files', slugs: ['agent-scarlett', 'silk-sting'] },
  { label: 'Wild West', slugs: ['venom-vixens'] },
  { label: 'Game World', slugs: ['boundless-loop'] },
  { label: 'Fantasy Land', slugs: ['chains-of-fate'] },
];

/* Specification 3.1: Home plus the universes, grouped by world, so a visitor
   can jump between them from any page. */
const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  ...worlds.map((world) => ({
    label: world.label,
    children: world.slugs.flatMap((slug) => {
      const universe = universes.find((u) => u.slug === slug);
      return universe
        ? [
          {
            label: universe.name,
            href: `/${universe.slug}`,
            description: universe.hook,
            image: universe.hero.poster,
          },
        ]
        : [];
    }),
  })),
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

/* ---------- Products panel ---------- */
const panelList: Variants = {
  closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  open: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const panelRow: Variants = {
  closed: { opacity: 0, y: -10, transition: { duration: 0.2, ease } },
  open: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const panelImage: Variants = {
  closed: { clipPath: 'inset(0 100% 0 0)' },
  open: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.6, ease, delay: 0.1 } },
};

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
  /* Label of the world whose panel is open, or null */
  const [openWorld, setOpenWorld] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const productsOpen = openWorld !== null;
  const products = navItems.find((item) => item.label === openWorld)?.children ?? [];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  /* A world counts as active when you're on one of its universes */
  const isItemActive = (item: NavItem) =>
    item.children ? item.children.some((child) => isActive(child.href)) : !!item.href && isActive(item.href);

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false);
    setOpenWorld(null);
  }, [pathname]);

  // Lock scroll + Escape to close while a menu is open
  useEffect(() => {
    if (!menuOpen && !productsOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      setOpenWorld(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, productsOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        initial={{ y: '-100%', opacity: 0, backgroundColor: 'rgba(0,0,0,0)' }}
        animate={{ y: 0, opacity: 1, backgroundColor: productsOpen ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)' }}
        transition={{ duration: 0.7, ease, backgroundColor: { duration: 0.3 } }}
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

          {/* Centre: Home and the worlds (desktop) */}
          <nav aria-label="Main" className="hidden justify-self-center lg:block">
            <ul className="flex items-center gap-5 xl:gap-8" onMouseLeave={() => setHovered(null)}>
              {navItems.map((item) => {
                const open = openWorld === item.label;
                return (
                  <li key={item.label} className="relative" onMouseEnter={() => setHovered(item.label)}>
                    {/* Always shown on the page you're on */}
                    {isItemActive(item) && <Marker />}

                    {/* Extra dot on the hovered link, or on a world while its panel is open */}
                    <AnimatePresence>
                      {!isItemActive(item) && (hovered === item.label || open) && <Marker hover />}
                    </AnimatePresence>

                    {item.children ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls="products-panel"
                        onClick={() => setOpenWorld((current) => (current === item.label ? null : item.label))}
                        className="flex items-center gap-2 uppercase tracking-wider"
                      >
                        {item.label}
                        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
                          <FiChevronDown className="size-3.5" aria-hidden="true" />
                        </motion.span>
                      </button>
                    ) : (
                      <Link
                        href={item.href ?? '/'}
                        aria-current={isItemActive(item) ? 'page' : undefined}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </Link>
                    )}
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

        {/* Header line: draws in on load, gets end ticks while the panel is open */}
        <div className="relative">
          <Divider />
          <AnimatePresence>{productsOpen && <Divider />}</AnimatePresence>
        </div>

        {/* Universes panel for the open world (desktop) */}
        <AnimatePresence>
          {productsOpen && (
            <motion.div
              id="products-panel"
              key="products-panel"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0, transition: { duration: 0.4, ease, delay: 0.1 } }}
              transition={{ duration: 0.5, ease }}
              className="hidden overflow-hidden lg:block"
            >
              {/* Keyed by world, so switching worlds swaps the rows with the same stagger */}
              <AnimatePresence mode="wait">
                <motion.ul
                  key={openWorld}
                  variants={panelList}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="pt-4"
                >
                  {products.map((p, i) => (
                    <motion.li key={p.label} variants={panelRow} className="border-b border-white/10 last:border-b-0">
                      <HoverGroup>
                        <Link
                          href={p.href}
                          aria-current={isActive(p.href) ? 'page' : undefined}
                          className="group grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 py-4"
                        >
                          <span className="flex items-center gap-6">
                            <RevealImage
                              src={p.image}
                              alt=""
                              sizes="80px"
                              unoptimized={false}
                              trigger="mount"
                              direction="left-right"
                              duration={0.6}
                              delay={0.3 + i * 0.08}
                              className="h-[50px] w-20 shrink-0"
                              imageClassName="transition-transform duration-500 group-hover:scale-110"
                            />
                            <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">
                              <HoverHighlight>{p.label}</HoverHighlight>
                            </span>
                          </span>

                          <span className="text-center text-sm">
                            <HoverHighlight delay={0.08}>{p.description}</HoverHighlight>
                          </span>

                          <span className="flex size-12 items-center justify-center justify-self-end border border-white/15 bg-white/5 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                            <IoPlayForward className="size-4" aria-hidden="true" />
                          </span>
                        </Link>
                      </HoverGroup>
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
              <Divider />
              <div className="h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Blur over the page while a world's panel is open */}
      <AnimatePresence>
        {productsOpen && (
          <motion.div
            key="page-blur"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setOpenWorld(null)}
            className="fixed inset-0 z-40 hidden bg-black/20 backdrop-blur-xl lg:block"
          />
        )}
      </AnimatePresence>

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
                {navItems.map((item) => (
                  <li key={item.label} className="overflow-hidden">
                    <motion.div variants={overlayItem}>
                      {item.children ? (
                        <>
                          <span className="block text-3xl font-bold text-white/50">{item.label}</span>
                          <ul className="mt-3 flex flex-col gap-3">
                            {item.children.map((child, i) => (
                              <li key={child.label}>
                                <Link
                                  href={child.href}
                                  aria-current={isActive(child.href) ? 'page' : undefined}
                                  className="flex items-center gap-3 text-sm tracking-wider"
                                >
                                  <RevealImage
                                    src={child.image}
                                    alt=""
                                    sizes="64px"
                                    unoptimized={false}
                                    trigger="mount"
                                    direction="left-right"
                                    duration={0.7}
                                    delay={0.55 + i * 0.08}
                                    className="h-10 w-16 shrink-0"
                                  />
                                  {isActive(child.href) && <span className="size-1.5 shrink-0 bg-white" aria-hidden="true" />}
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Link
                          href={item.href ?? '/'}
                          aria-current={isItemActive(item) ? 'page' : undefined}
                          className="flex items-center gap-3 text-3xl font-bold"
                        >
                          {isItemActive(item) && <span className="size-2 bg-white" aria-hidden="true" />}
                          {item.label}
                        </Link>
                      )}
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}