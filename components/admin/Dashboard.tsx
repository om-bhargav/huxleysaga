'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  InboxIcon,
  DollarSignIcon,
  MessageSquareQuoteIcon,
  PlusIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  UsersIcon,
} from 'lucide-react';
import { worlds, displayFontClass } from '@/config/worlds';
import { useDashboard } from '@/hooks/useStats';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Bone, Loading, PageHeader, Stat, times } from './ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/** "View all →" link in a card header */
function SeeAll({ href, children = 'View all' }: { href: string; children?: ReactNode }) {
  return (
    <CardAction>
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={href} />}>
        {children} <ArrowUpRightIcon />
      </Button>
    </CardAction>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

/* Skeleton bar widths, so placeholder rows don't all look the same */
const WIDTHS = ['w-full', 'w-3/4', 'w-1/2', 'w-1/3'];

export default function Dashboard() {
  const { dashboard: d, error, isLoading, isValidating, refresh } = useDashboard();

  const header = (
    <PageHeader
      eyebrow="Overview"
      title="Dashboard"
      description="The studio's comics, characters, campaigns and backers at a glance."
      actions={
        <>
          <Button variant="outline" size="lg" onClick={() => refresh()}>
            <RefreshCwIcon className={cn(isValidating && 'animate-spin')} /> Refresh
          </Button>
          <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/" target="_blank" />}>
            <ArrowUpRightIcon /> View site
          </Button>
          <Button size="lg" nativeButton={false} render={<Link href="/admin/comics" />}>
            <PlusIcon /> New comic
          </Button>
        </>
      }
    />
  );

  if (error) {
    return (
      <>
        {header}
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t load the dashboard</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }

  /* Until the data lands, every card renders with its real heading and skeletons where the numbers go */
  const loading = isLoading || !d;
  const stats = d?.stats;
  const totals = d?.totals;
  const maxRaised = Math.max(1, ...(d?.topCampaigns ?? []).map((c) => c.raised));
  const unassigned = d?.comicsByWorld.none ?? [];

  return (
    <>
      {header}

      {totals && totals.newContactRequests > 0 && (
        <Alert className="mb-6">
          <InboxIcon />
          <AlertTitle>
            {totals.newContactRequests} new contact request{totals.newContactRequests === 1 ? '' : 's'}
          </AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" nativeButton={false} render={<Link href="/admin/contact-requests" />}>
              Open the inbox <ArrowUpRightIcon />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total raised"
          value={stats && formatMoney(stats.raised)}
          hint={stats && `${stats.fundedIssues} issue${stats.fundedIssues === 1 ? '' : 's'} funded`}
          Icon={DollarSignIcon}
          loading={loading}
        />
        <Stat
          label="Backer pledges"
          value={stats?.backers.toLocaleString('en-US')}
          hint={stats && totals && `${totals.campaigns} campaigns · ${stats.liveIssues} live · ${stats.upcomingIssues} upcoming`}
          Icon={TrendingUpIcon}
          loading={loading}
        />
        <Stat
          label="Comics"
          value={totals?.comics}
          hint={totals && `${totals.publishedComics} published · ${unassigned.length} unassigned`}
          Icon={BookOpenIcon}
          loading={loading}
        />
        <Stat
          label="Characters"
          value={totals?.characters}
          hint={totals && `${totals.publishedTestimonials}/${totals.testimonials} testimonials published`}
          Icon={UsersIcon}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Campaign performance */}
        <Card className="xl:col-span-2" aria-busy={loading}>
          <CardHeader>
            <CardTitle className="font-body font-bold">Campaign performance</CardTitle>
            <CardDescription>Biggest campaigns by amount raised.</CardDescription>
            <SeeAll href="/admin/live-campaigns" />
          </CardHeader>
          <CardContent className="space-y-5">
            {!d ? (
              <Loading label="Loading campaigns" className="space-y-5">
                {times(4, (i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Bone className="size-2 rounded-full" />
                        <Bone className={cn('h-3.5', i % 2 ? 'w-28' : 'w-40')} />
                      </div>
                      <div className="flex items-center gap-4">
                        <Bone className="h-3 w-20" />
                        <Bone className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="h-8 w-full rounded-md bg-muted/50">
                      <Bone className={cn('h-full', WIDTHS[i])} />
                    </div>
                  </div>
                ))}
              </Loading>
            ) : d.topCampaigns.length === 0 ? (
              <Empty>No money raised yet.</Empty>
            ) : (
              d.topCampaigns.map((c) => {
                const accent = c.comic?.palette.accent ?? 'var(--foreground)';
                return (
                  <div key={c.id} className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
                        <span className="text-sm font-medium">{c.title}</span>
                        {c.status === 'LIVE' && <Badge variant="destructive">Live</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-xs tabular-nums text-muted-foreground">
                        <span>{c.backers.toLocaleString('en-US')} backers</span>
                        <span className="text-foreground">{formatMoney(c.raised)}</span>
                      </div>
                    </div>
                    <div className="h-8 w-full overflow-hidden rounded-md bg-muted/50">
                      <div
                        className="flex h-full min-w-12 items-center justify-end rounded-md px-2 text-[11px] font-bold text-black"
                        style={{ width: `${(c.raised / maxRaised) * 100}%`, backgroundColor: accent }}
                      >
                        {c.funded}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
          <CardFooter className="grid grid-cols-3 border-t p-0 text-center">
            {[
              { label: 'Funded', value: stats?.fundedIssues },
              { label: 'Live', value: stats?.liveIssues },
              {
                label: 'Avg. per funded issue',
                value: stats && (stats.fundedIssues ? formatMoney(Math.round(stats.raised / stats.fundedIssues)) : '—'),
              },
            ].map((item, i) => (
              <div key={item.label} className={cn('p-4', i === 1 && 'border-x')}>
                {loading ? (
                  <Bone className="mx-auto my-1 h-5 w-12" />
                ) : (
                  <p className="text-xl font-bold tabular-nums">{item.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </CardFooter>
        </Card>

        {/* Content gaps */}
        <Card aria-busy={loading}>
          <CardHeader>
            <CardTitle className="font-body font-bold">Content to finish</CardTitle>
            <CardDescription>Comics with [PLACEHOLDER] text, theirs and their characters&apos;.</CardDescription>
          </CardHeader>
          <CardContent>
            {!d ? (
              <Loading label="Loading content gaps" className="divide-y">
                {times(5, (i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <Bone className="size-9 shrink-0 rounded-lg" />
                      <div className="space-y-1.5">
                        <Bone className={cn('h-3.5', i % 2 ? 'w-24' : 'w-32')} />
                        <Bone className="h-3 w-16" />
                      </div>
                    </div>
                    <Bone className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </Loading>
            ) : d.contentGaps.length === 0 ? (
              <Empty>Nothing marked as placeholder.</Empty>
            ) : (
              <ul className="divide-y">
                {d.contentGaps.map(({ comic, placeholders }) => (
                  <li key={comic.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold"
                        style={{ backgroundColor: comic.palette.ink, color: comic.palette.accent }}
                      >
                        {comic.shortName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{comic.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{comic.genre.replace('[PLACEHOLDER] ', '')}</p>
                      </div>
                    </div>
                    <Badge variant={placeholders > 5 ? 'destructive' : 'secondary'}>{placeholders} to fill</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Worlds: labels from config/worlds, comics from the database */}
      <Card className="mt-6 gap-0 pb-0" aria-busy={loading}>
        <CardHeader className="pb-4">
          <CardTitle className="font-body font-bold">Worlds</CardTitle>
          <CardDescription>Which comics sit in each world.</CardDescription>
          <SeeAll href="/admin/comics">Manage comics</SeeAll>
        </CardHeader>
        <div className="grid gap-px border-t bg-border sm:grid-cols-2 xl:grid-cols-4">
          {worlds.map((world) => {
            const comics = d?.comicsByWorld[world.slug] ?? [];
            return (
              <div key={world.slug} className="bg-card p-5">
                <h3 className={cn('text-2xl', displayFontClass[world.display])}>{world.label}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{world.line}</p>
                <div className="mt-4 space-y-2">
                  {!d ? (
                    times(2, (i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/40 p-2">
                        <Bone className="h-10 w-14 shrink-0 rounded" />
                        <div className="flex-1 space-y-1.5">
                          <Bone className={cn('h-3.5', i ? 'w-1/2' : 'w-3/4')} />
                          <Bone className="h-2.5 w-20" />
                        </div>
                      </div>
                    ))
                  ) : comics.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No comics yet.</p>
                  ) : (
                    comics.map((c) => (
                      <div key={c.id} className={cn('flex items-center gap-3 rounded-lg bg-muted/40 p-2', !c.published && 'opacity-60')}>
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
                          <Image src={c.poster} alt="" fill sizes="56px" unoptimized className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {c.characters} character{c.characters === 1 ? '' : 's'}
                            {!c.published && ' · hidden'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Latest characters */}
        <Card className="xl:col-span-2" aria-busy={loading}>
          <CardHeader>
            <CardTitle className="font-body font-bold">Latest characters</CardTitle>
            <SeeAll href="/admin/characters" />
          </CardHeader>
          <CardContent>
            {!d ? (
              <Loading label="Loading characters" className="flex gap-4 overflow-hidden pb-1">
                {times(6, (i) => (
                  <div key={i} className="w-28 shrink-0">
                    <Bone className="aspect-3/4 rounded-lg" />
                    <Bone className={cn('mt-2.5 h-3.5', i % 2 ? 'w-16' : 'w-20')} />
                    <Bone className="mt-1.5 h-2.5 w-12" />
                  </div>
                ))}
              </Loading>
            ) : d.recentCharacters.length === 0 ? (
              <Empty>No characters yet.</Empty>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {d.recentCharacters.map((c) => (
                  <div key={c.id} className="w-28 shrink-0">
                    <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
                      <Image src={c.image} alt={c.name} fill sizes="112px" unoptimized className="object-cover" />
                      {c.comic && (
                        <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: c.comic.palette.accent }} />
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm">{c.alias ?? c.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{c.comic?.shortName ?? 'No comic'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest testimonials */}
        <Card aria-busy={loading}>
          <CardHeader>
            <CardTitle className="font-body font-bold">Latest testimonials</CardTitle>
            <SeeAll href="/admin/backer-testimonials" />
          </CardHeader>
          <CardContent>
            {!d ? (
              <Loading label="Loading testimonials" className="space-y-4">
                {times(3, (i) => (
                  <div key={i} className="flex gap-3">
                    <MessageSquareQuoteIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                    <div className="flex-1 space-y-1.5">
                      <Bone className="h-3.5 w-full" />
                      <Bone className={cn('h-3.5', i % 2 ? 'w-1/2' : 'w-2/3')} />
                      <Bone className="mt-2 h-3 w-28" />
                    </div>
                  </div>
                ))}
              </Loading>
            ) : d.recentTestimonials.length === 0 ? (
              <Empty>No testimonials yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {d.recentTestimonials.map((t) => (
                  <li key={t.id} className="flex gap-3">
                    <MessageSquareQuoteIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm">&ldquo;{t.quote}&rdquo;</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.name} · {t.campaign}
                        {!t.published && ' · hidden'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
