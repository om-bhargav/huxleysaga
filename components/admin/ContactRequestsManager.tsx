'use client';

import { useDeferredValue, useState, useSyncExternalStore } from 'react';
import { useSWRConfig } from 'swr';
import {
  ArchiveIcon,
  CheckCheckIcon,
  InboxIcon,
  MailIcon,
  MailOpenIcon,
  RefreshCwIcon,
  ReplyIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import {
  contactRequestsKey,
  deleteContactRequest,
  updateContactRequest,
  useContactRequests,
} from '@/hooks/useContactRequests';
import { formatDateTime, formatRelative } from '@/lib/format';
import {
  CONTACT_STATUSES,
  CONTACT_TOPICS,
  topicLabel,
  type ContactRequestDTO,
  type ContactStatus,
  type ContactTopic,
} from '@/lib/contact/types';
import { cn } from '@/lib/utils';
import { removeRow, replaceRow, useOptimisticList } from './optimistic';
import { Bone, Loading, PageHeader, Saving, TabCount, times } from './ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusLabel: Record<ContactStatus, string> = {
  NEW: 'New',
  READ: 'Read',
  REPLIED: 'Replied',
  ARCHIVED: 'Archived',
};

/* "Inbox" is everything still open; archived requests get their own tab */
type Tab = 'INBOX' | ContactStatus;
const tabs: { value: Tab; label: string }[] = [
  { value: 'INBOX', label: 'Inbox' },
  ...CONTACT_STATUSES.map((s) => ({ value: s as Tab, label: statusLabel[s] })),
];
const inTab = (r: ContactRequestDTO, tab: Tab) => (tab === 'INBOX' ? r.status !== 'ARCHIVED' : r.status === tab);

/* Matches Tailwind's lg breakpoint, where the reading pane sits beside the list */
const DESKTOP_QUERY = '(min-width: 1024px)';

/** True on lg screens and up. Updates live when the window is resized. */
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(DESKTOP_QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

const ALL_TOPICS = 'all';
const topicItems: Record<string, string> = {
  [ALL_TOPICS]: 'All topics',
  ...Object.fromEntries(CONTACT_TOPICS.map((t) => [t.value, t.label])),
};

/** A pre-filled reply in the admin's own mail app */
const replyHref = (r: ContactRequestDTO) => {
  const subject = `Re: [${topicLabel(r.topic)}] Your message to us`;
  const quoted = r.message
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
  return `mailto:${r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`\n\n${quoted}`)}`;
};

function StatusBadge({ status }: { status: ContactStatus }) {
  if (status === 'NEW') return <Badge>New</Badge>;
  if (status === 'REPLIED') return <Badge variant="secondary">Replied</Badge>;
  return <Badge variant="outline">{statusLabel[status]}</Badge>;
}

/* ---------- Detail ---------- */

function RequestDetail({
  request,
  pending,
  onStatus,
  onDelete,
}: {
  request: ContactRequestDTO;
  /** A change is with the server: the actions are locked until it answers */
  pending: boolean;
  onStatus: (status: ContactStatus) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{topicLabel(request.topic)}</Badge>
          <StatusBadge status={request.status} />
          {pending && <Saving className="ml-auto" />}
        </div>
        <CardTitle className="mt-2 font-body text-xl font-bold">{request.name}</CardTitle>
        <CardDescription>
          <a href={`mailto:${request.email}`} className="underline-offset-4 hover:text-foreground hover:underline">
            {request.email}
          </a>
          <span className="mx-1.5">·</span>
          <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-y-auto py-6" data-lenis-prevent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{request.message}</p>
      </CardContent>

      <CardFooter inert={pending} className={cn('flex-wrap gap-2 border-t', pending && 'opacity-60')}>
        <Button
          nativeButton={false}
          render={<a href={replyHref(request)} />}
          onClick={() => request.status !== 'REPLIED' && onStatus('REPLIED')}
        >
          <ReplyIcon /> Reply by email
        </Button>
        {request.status !== 'REPLIED' && (
          <Button variant="outline" onClick={() => onStatus('REPLIED')}>
            <CheckCheckIcon /> Mark replied
          </Button>
        )}
        {request.status === 'ARCHIVED' ? (
          <Button variant="outline" onClick={() => onStatus('READ')}>
            <InboxIcon /> Move to inbox
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onStatus('ARCHIVED')}>
            <ArchiveIcon /> Archive
          </Button>
        )}
        {request.status !== 'NEW' && (
          <Button variant="ghost" onClick={() => onStatus('NEW')}>
            <MailIcon /> Mark unread
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete"
          className="ml-auto hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      </CardFooter>
    </div>
  );
}

/** Same frame as a list row, so nothing jumps when the data lands */
function ListSkeleton() {
  return (
    <Loading label="Loading contact requests" className="divide-y">
      {times(6, (i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5">
          <Bone className="mt-1.5 size-2 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Bone className={cn('h-3.5', i % 2 ? 'w-24' : 'w-32')} />
              <Bone className="h-3 w-14" />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Bone className="h-4 w-14 rounded-full" />
              <Bone className="h-3 w-36" />
            </div>
            <div className="mt-2 space-y-1.5">
              <Bone className="h-3 w-full" />
              <Bone className={cn('h-3', i % 3 ? 'w-3/4' : 'w-1/2')} />
            </div>
          </div>
        </div>
      ))}
    </Loading>
  );
}

/* ---------- Page ---------- */

export default function ContactRequestsManager() {
  const [tab, setTab] = useState<Tab>('INBOX');
  const [topic, setTopic] = useState(ALL_TOPICS);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /* Phones show the open request in a sheet instead of beside the list. On desktop the sheet must
     never open: its blurred backdrop would cover the page even with the panel itself hidden. */
  const isDesktop = useIsDesktop();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState<ContactRequestDTO | null>(null);

  /* Topic and search go to the API; tabs filter what came back so their counts stay right */
  const q = useDeferredValue(query.trim());
  const { requests, error, isLoading, isValidating, refresh } = useContactRequests({
    topic: topic === ALL_TOPICS ? undefined : (topic as ContactTopic),
    q: q || undefined,
  });
  const { run, isPending } = useOptimisticList(refresh);

  /* The sidebar's unread badge reads its own list; move it in step with each change, and back if it fails */
  const { mutate: mutateCache } = useSWRConfig();
  const withUnread = <R,>(request: Promise<R>, update: (unread: ContactRequestDTO[]) => ContactRequestDTO[]) => {
    void mutateCache<ContactRequestDTO[]>(
      contactRequestsKey({ status: 'NEW' }),
      async () => {
        await request;
        return undefined;
      },
      { optimisticData: (unread) => update(unread ?? []), rollbackOnError: true, populateCache: false },
    ).catch(() => undefined);
    return request;
  };

  const rows = requests.filter((r) => inTab(r, tab));
  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const unread = requests.filter((r) => r.status === 'NEW').length;

  /* Every change lands in the list straight away and rolls back if the server says no */

  const setStatus = (r: ContactRequestDTO, status: ContactStatus, quiet = false) => {
    if (status === r.status) return;
    const next = { ...r, status };
    void run({
      id: r.id,
      update: (list) => replaceRow(list, next),
      request: () =>
        withUnread(updateContactRequest(r.id, status), (unread) =>
          status === 'NEW' ? [next, ...removeRow(unread, r.id)] : removeRow(unread, r.id),
        ),
      notify: !quiet,
      failure: 'Could not update',
    });
  };

  /* Opening a new request marks it read */
  const open = (r: ContactRequestDTO) => {
    setSelectedId(r.id);
    if (!isDesktop) setSheetOpen(true);
    if (r.status === 'NEW') void setStatus(r, 'READ', true);
  };

  const onDelete = () => {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    if (selectedId === id) {
      setSelectedId(null);
      setSheetOpen(false);
    }
    void run({
      id,
      update: (list) => removeRow(list, id),
      request: () => withUnread(deleteContactRequest(id), (unread) => removeRow(unread, id)),
      failure: 'Could not delete',
    });
  };

  const detail = selected && (
    <RequestDetail
      request={selected}
      pending={isPending(selected.id)}
      onStatus={(s) => setStatus(selected, s)}
      onDelete={() => setDeleting(selected)}
    />
  );

  let list;
  if (error) {
    list = (
      <div className="p-4">
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t load contact requests</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  } else if (isLoading) {
    list = <ListSkeleton />;
  } else if (rows.length === 0) {
    list = (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <InboxIcon className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {q || topic !== ALL_TOPICS ? 'Nothing matches these filters.' : tab === 'INBOX' ? 'Inbox zero.' : `No ${statusLabel[tab as ContactStatus].toLowerCase()} requests.`}
        </p>
      </div>
    );
  } else {
    list = (
      <ul className="divide-y">
        {rows.map((r) => {
          const active = r.id === selectedId;
          const isNew = r.status === 'NEW';
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => open(r)}
                aria-current={active}
                className={cn(
                  'flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50',
                  active && 'bg-muted',
                )}
              >
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', isNew ? 'bg-primary' : 'bg-transparent')} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-sm', isNew ? 'font-bold' : 'font-medium')}>{r.name}</span>
                    <time dateTime={r.createdAt} className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(r.createdAt)}
                    </time>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {topicLabel(r.topic)}
                    </Badge>
                    <span className="truncate text-xs text-muted-foreground">{r.email}</span>
                  </span>
                  <span className={cn('mt-1.5 line-clamp-2 text-xs', isNew ? 'text-foreground/80' : 'text-muted-foreground')}>
                    {r.message}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Contact Requests"
        description="Messages sent from the contact page. Opening one marks it read."
        actions={
          <Button variant="outline" size="lg" onClick={() => refresh()}>
            <RefreshCwIcon className={cn(isValidating && 'animate-spin')} /> Refresh
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="h-auto flex-wrap justify-start">
            {tabs.map((t) => {
              const count = requests.filter((r) => inTab(r, t.value)).length;
              return (
                <TabsTrigger key={t.value} value={t.value} className="flex-none">
                  {t.label} <TabCount value={count} loading={isLoading} />
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto">
          <Select items={topicItems} value={topic} onValueChange={(v) => setTopic(v ?? ALL_TOPICS)}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by topic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(topicItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, message"
              className="pl-8"
              aria-label="Search contact requests"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-3">
            <CardTitle className="font-body text-sm font-bold">{tabs.find((t) => t.value === tab)?.label}</CardTitle>
            <CardAction>
              {unread > 0 && <Badge>{unread} unread</Badge>}
            </CardAction>
          </CardHeader>
          <div className="max-h-[70vh] overflow-y-auto" data-lenis-prevent>
            {list}
          </div>
        </Card>

        {/* Desktop: reading pane beside the list */}
        <Card className="hidden min-h-[50vh] gap-0 py-0 lg:flex">
          {detail ?? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
              <MailOpenIcon className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Pick a request to read it.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Phones: the request opens in a sheet */}
      <Sheet open={sheetOpen && !!selected && !isDesktop} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-lg">
          <SheetTitle className="sr-only">{selected?.name ?? 'Contact request'}</SheetTitle>
          {detail}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-body font-bold">Delete this request?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name}&apos;s message will be removed for good. To keep it out of the inbox instead, archive it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
