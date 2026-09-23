'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion';
import { FaInstagram, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { FiChevronDown } from 'react-icons/fi';
import { IoPlayForward } from 'react-icons/io5';
import { Divider } from '../shared/Divider';
import { HoverGroup, HoverHighlight } from '../shared/HoverHighlight';

type NavLink = { label: string; href: string };
type Product = NavLink & { description: string; image: string };
type NavItem = NavLink & { children?: Product[] };

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Story', href: '/story' },
  {
    label: 'Products',
    href: '/products',
    children: [
      {
        label: 'Huxley: The Oracle',
        href: '/products/the-oracle',
        description: 'The epic next chapter in the Huxley universe.',
        image: 'https://picsum.photos/seed/huxley-oracle/800/600', // replace with your image
      },
      {
        label: 'Huxley: Graphic Novel',
        href: '/products/huxley',
        description: 'The original graphic novel that started it all!',
        image: 'https://picsum.photos/seed/huxley-oracle/800/600', // replace with your image
      },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Shop', href: '/shop' },
];

const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/huxleysaga/', Icon: FaInstagram },
  { label: 'YouTube', href: 'https://www.youtube.com/@HUXLEYSAGA', Icon: FaYoutube },
  { label: 'X', href: 'https://x.com/huxleysaga', Icon: FaXTwitter },
];

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
  const [productsOpen, setProductsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const products = navItems.find((item) => item.children)?.children ?? [];

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false);
    setProductsOpen(false);
  }, [pathname]);

  // Lock scroll + Escape to close while a menu is open
  useEffect(() => {
    if (!menuOpen && !productsOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      setProductsOpen(false);
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
        className="fixed inset-x-0 top-0 z-50 font-heading text-[13px] uppercase tracking-wider text-white px-2 md:px-3"
      >
        <div className="grid h-12 grid-cols-[1fr_auto_1fr] max-md:flex max-md:flex-row-reverse max-md:justify-between items-center">
          {/* Left: links (desktop) */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8 pl-4" onMouseLeave={() => setHovered(null)}>
              {navItems.map((item) => (
                <li key={item.label} className="relative" onMouseEnter={() => setHovered(item.label)}>
                  {/* Always shown on the page you're on */}
                  {isActive(item.href) && <Marker />}

                  {/* Extra dot on the hovered link, or on Products while its panel is open */}
                  <AnimatePresence>
                    {!isActive(item.href) &&
                      (hovered === item.label || (item.children && productsOpen)) && <Marker hover />}
                  </AnimatePresence>

                  {item.children ? (
                    <button
                      type="button"
                      aria-expanded={productsOpen}
                      aria-controls="products-panel"
                      onClick={() => setProductsOpen((o) => !o)}
                      className="flex items-center gap-2 uppercase tracking-wider"
                    >
                      {item.label}
                      <motion.span animate={{ rotate: productsOpen ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
                        <FiChevronDown className="size-3.5" aria-hidden="true" />
                      </motion.span>
                    </button>
                  ) : (
                    <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Left: menu button (mobile) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="relative flex h-5 w-20 items-center gap-2.5 overflow-hidden uppercase tracking-wider lg:hidden"
          >
            <span className="size-1.5 shrink-0 bg-white" aria-hidden="true" />
            <span className="relative h-full flex-1">
              <AnimatePresence initial={false}>
                <motion.span
                  key={menuOpen ? 'close' : 'menu'}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={{ duration: 0.35, ease }}
                  className="absolute inset-0 flex items-center"
                >
                  {menuOpen ? 'Close' : 'Menu'}
                </motion.span>
              </AnimatePresence>
            </span>
          </button>

          {/* Center: logo */}
          <Link href="/" aria-label="Huxley home" className="justify-self-center text-base font-bold tracking-tight">
            HUXLEY
          </Link>

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
          <AnimatePresence>
            {productsOpen && (
              <Divider />
            )}
          </AnimatePresence>
        </div>

        {/* Products panel (desktop) */}
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
              <motion.ul variants={panelList} initial="closed" animate="open" exit="closed" className="pt-4">
                {products.map((p) => (
                  <motion.li key={p.label} variants={panelRow} className="border-b border-white/10 last:border-b-0">
                    <HoverGroup>
                      <Link
                        href={p.href}
                        className="group grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 py-4"
                      >
                        <span className="flex items-center gap-6">
                          <motion.span
                            variants={panelImage}
                            className="relative block h-[50px] w-20 shrink-0 overflow-hidden"
                          >
                            <Image
                              src={p.image}
                              alt=""
                              fill
                              sizes="80px"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </motion.span>
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
              <Divider />
              <div className="h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Blur over the page while the products panel is open */}
      <AnimatePresence>
        {productsOpen && (
          <motion.div
            key="page-blur"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setProductsOpen(false)}
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
            className="fixed inset-0 z-40 bg-black px-4 pt-24 font-heading uppercase text-white lg:hidden"
          >
            <nav aria-label="Mobile">
              <ul className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <li key={item.label} className="overflow-hidden">
                    <motion.div variants={overlayItem}>
                      {item.children ? (
                        <>
                          <span className="block text-3xl font-bold text-white/50">{item.label}</span>
                          <ul className="mt-3 flex flex-col gap-3">
                            {item.children.map((child) => (
                              <li key={child.label}>
                                <Link href={child.href} className="flex items-center gap-3 text-sm tracking-wider">
                                  <span className="relative block h-10 w-16 shrink-0 overflow-hidden">
                                    <Image src={child.image} alt="" fill sizes="64px" className="object-cover" />
                                  </span>
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                          className="flex items-center gap-3 text-3xl font-bold"
                        >
                          {isActive(item.href) && <span className="size-2 bg-white" aria-hidden="true" />}
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