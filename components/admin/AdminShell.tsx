'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  BookOpenIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MegaphoneIcon,
  MenuIcon,
  InboxIcon,
  MessageSquareQuoteIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { SITE_NAME } from '@/config';
import { useContactRequests } from '@/hooks/useContactRequests';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

type NavLink = { label: string; href: string; Icon: LucideIcon };

const nav: NavLink[] = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboardIcon },
  { label: 'Comics', href: '/admin/comics', Icon: BookOpenIcon },
  { label: 'Characters', href: '/admin/characters', Icon: UsersIcon },
  { label: 'Live Campaigns', href: '/admin/live-campaigns', Icon: MegaphoneIcon },
  { label: 'Backer Testimonials', href: '/admin/backer-testimonials', Icon: MessageSquareQuoteIcon },
  { label: 'Contact Requests', href: '/admin/contact-requests', Icon: InboxIcon },
];

const isActive = (pathname: string, href: string) =>
  href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

const PAGE_TITLES = Object.fromEntries(nav.map((n) => [n.href, n.label]));

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 px-5">
      <span className="grid size-8 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">N</span>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-wide">{SITE_NAME}</p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Studio admin</p>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const item = 'w-full justify-start gap-3 px-3';
  /* Unread count next to Contact Requests */
  const { requests: unread } = useContactRequests({ status: 'NEW' });
  return (
    <div className="flex h-full flex-col">
      <Brand />
      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Manage</p>
        {nav.map(({ label, href, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Button
              key={href}
              variant={active ? 'secondary' : 'ghost'}
              size="lg"
              className={cn(item, !active && 'text-muted-foreground')}
              nativeButton={false}
              render={<Link href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} />}
            >
              <Icon />
              {label}
              {href === '/admin/contact-requests' && unread.length > 0 && (
                <Badge className="ml-auto h-5 min-w-5 px-1.5 tabular-nums">{unread.length}</Badge>
              )}
            </Button>
          );
        })}
      </nav>

      <Separator />
      <div className="space-y-1 p-3">
        <Button
          variant="ghost"
          size="lg"
          className={cn(item, 'text-muted-foreground')}
          nativeButton={false}
          render={<Link href="/" target="_blank" />}
        >
          <ExternalLinkIcon /> View site
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={cn(item, 'text-muted-foreground')}
          nativeButton={false}
          render={<Link href="/admin/login" />}
        >
          <LogOutIcon /> Log out
        </Button>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = PAGE_TITLES[nav.find((n) => isActive(pathname, n.href))?.href ?? ''] ?? 'Admin';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 data-[side=left]:sm:max-w-72">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="outline" size="icon" aria-label="Open menu" className="lg:hidden" onClick={() => setOpen(true)}>
            <MenuIcon />
          </Button>
          <p className="text-sm text-muted-foreground">
            Admin <span className="mx-1.5">/</span>
            <span className="text-foreground">{title}</span>
          </p>

          <div className="ml-auto flex items-center gap-2.5 rounded-lg border py-1 pl-1 pr-3">
            <span className="grid size-7 place-items-center rounded-md bg-linear-to-br from-[#C4122F] to-[#6B1E3F] text-xs font-bold text-white">
              A
            </span>
            <span className="hidden text-sm sm:block">Admin</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
