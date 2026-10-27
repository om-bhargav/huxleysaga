'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  CalendarIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  ImageIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
  TrendingUpIcon,
  TriangleAlertIcon,
  UsersIcon,
} from 'lucide-react';
import { useComics } from '@/hooks/useComics';
import { createCampaign, deleteCampaign, updateCampaign, useCampaigns } from '@/hooks/useCampaigns';
import { CAMPAIGN_STATUSES, type CampaignDTO, type CampaignInput, type CampaignStatus } from '@/lib/campaigns/types';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  errorMessage,
  removeRow,
  replaceRow,
  sortRows,
  tempId,
  useEditor,
  useOptimisticList,
  useRejectedErrors,
  type Rejected,
} from './optimistic';
import { Bone, Loading, PageHeader, Saving, Stat, TabCount, times } from './ui';
import { ImageInput, SubmitButton, UploadScope } from './upload';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const statusColor: Record<CampaignStatus, string> = {
  DRAFT: '#8A8F98',
  UPCOMING: '#F2B705',
  LIVE: '#FF3B5C',
  FUNDED: '#3BD67F',
  ENDED: '#6B7280',
};

const statusLabel = (status: CampaignStatus) => status.charAt(0) + status.slice(1).toLowerCase();

/** Base UI Select shows the label for the chosen value from these */
const statusItems = Object.fromEntries(CAMPAIGN_STATUSES.map((s) => [s, statusLabel(s)])) as Record<CampaignStatus, string>;

const NO_COMIC = 'none';

/* ---------- Small pieces ---------- */

function StatusBadge({ status }: { status: CampaignStatus }) {
  const color = statusColor[status];
  return (
    <Badge variant="outline" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}1A` }}>
      {status === 'LIVE' && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {statusLabel(status)}
    </Badge>
  );
}

/** shadcn Progress tinted with the comic's accent */
function FundedBar({ value, color }: { value: number; color: string }) {
  return (
    <Progress
      value={Math.min(value, 100)}
      aria-label="Funded"
      className="flex-1 **:data-[slot=progress-indicator]:bg-(--bar)"
      style={{ '--bar': color } as CSSProperties}
    />
  );
}

/* ---------- Form ---------- */

/** Everything as strings, the way inputs hold them; converted to a CampaignInput on submit */
type FormValues = Record<
  | 'title'
  | 'description'
  | 'image'
  | 'status'
  | 'raised'
  | 'goal'
  | 'backers'
  | 'startsAt'
  | 'endsAt'
  | 'buttonLabel'
  | 'buttonHref'
  | 'universeSlug'
  | 'sortOrder',
  string
>;

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

const toFormValues = (c?: CampaignDTO): FormValues => ({
  title: c?.title ?? '',
  description: c?.description ?? '',
  image: c?.image ?? '',
  status: c?.status ?? 'DRAFT',
  raised: String(c?.raised ?? 0),
  goal: c ? String(c.goal) : '',
  backers: String(c?.backers ?? 0),
  startsAt: toDateInput(c?.startsAt ?? null),
  endsAt: toDateInput(c?.endsAt ?? null),
  buttonLabel: c?.buttonLabel ?? '',
  buttonHref: c?.buttonHref ?? '',
  universeSlug: c?.universeSlug ?? NO_COMIC,
  sortOrder: String(c?.sortOrder ?? 0),
});

const toInput = (v: FormValues): CampaignInput => ({
  title: v.title,
  description: v.description,
  image: v.image,
  status: v.status as CampaignStatus,
  raised: Number(v.raised) || 0,
  goal: Number(v.goal) || 0,
  backers: Number(v.backers) || 0,
  startsAt: v.startsAt || null,
  endsAt: v.endsAt || null,
  buttonLabel: v.buttonLabel,
  buttonHref: v.buttonHref,
  universeSlug: v.universeSlug === NO_COMIC ? null : v.universeSlug,
  sortOrder: Number(v.sortOrder) || 0,
});

const DAY = 24 * 60 * 60 * 1000;
const toIso = (date: string | null | undefined) => (date ? new Date(date).toISOString() : null);

/** The row to show until the server answers, worked out the same way as lib/campaigns/serialize */
const toOptimistic = (input: CampaignInput, id: string, current?: CampaignDTO): CampaignDTO => {
  const now = new Date().toISOString();
  const raised = input.raised ?? 0;
  const endsAt = toIso(input.endsAt);
  return {
    id,
    title: input.title,
    description: input.description,
    image: input.image,
    status: input.status ?? 'DRAFT',
    raised,
    goal: input.goal,
    backers: input.backers ?? 0,
    funded: input.goal > 0 ? Math.round((raised / input.goal) * 100) : 0,
    daysLeft: endsAt ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / DAY)) : null,
    startsAt: toIso(input.startsAt),
    endsAt,
    buttonLabel: input.buttonLabel,
    buttonHref: input.buttonHref,
    universeSlug: input.universeSlug ?? null,
    sortOrder: input.sortOrder ?? 0,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
};

function CampaignForm({
  campaign,
  rejected,
  onSave,
  onCancel,
}: {
  campaign?: CampaignDTO;
  /** A save the server turned down, to pick up where it left off */
  rejected?: Rejected<FormValues>;
  onSave: (values: FormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: rejected?.values ?? toFormValues(campaign) });
  useRejectedErrors(rejected, setError);

  const { comics } = useComics();
  const comicItems: Record<string, string> = {
    [NO_COMIC]: 'None',
    ...Object.fromEntries(comics.map((c) => [c.slug, c.name])),
  };

  const [image, raisedValue, goalValue] = useWatch({ control, name: ['image', 'raised', 'goal'] });
  const raised = Number(raisedValue) || 0;
  const goal = Number(goalValue) || 0;
  const funded = goal > 0 ? Math.round((raised / goal) * 100) : 0;

  const onSubmit = handleSubmit(onSave);

  /** Wires an input to the form and marks it invalid for the field styles */
  const field = (name: keyof FormValues, rules?: Parameters<typeof register>[1]) => ({
    id: name,
    'aria-invalid': !!errors[name],
    ...register(name, rules),
  });

  return (
    <UploadScope>
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <fieldset disabled={isSubmitting} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4" data-lenis-prevent>
            {rejected && (
              <Alert variant="destructive" className="mb-5">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t save</AlertTitle>
                <AlertDescription>{errorMessage(rejected.error, 'Could not reach the server')}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <div className="relative aspect-3/2 overflow-hidden rounded-xl border border-dashed bg-muted/30">
                {image ? (
                  // Plain img: the URL can point anywhere while it's being typed
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="size-5" /> Image preview
                  </span>
                )}
              </div>

              <Field data-invalid={!!errors.image}>
                <FieldLabel htmlFor="image">Image</FieldLabel>
                <Controller
                  control={control}
                  name="image"
                  rules={{ required: 'Image is required' }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <ImageInput
                      id="image"
                      folder="campaigns"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      invalid={!!errors.image}
                      disabled={isSubmitting}
                    />
                  )}
                />
                <FieldError errors={[errors.image]} />
              </Field>

              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input placeholder="Venom Vixens #2" {...field('title', { required: 'Title is required' })} />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea className="min-h-24" {...field('description', { required: 'Description is required' })} />
                <FieldDescription>Short line under the title on the card.</FieldDescription>
                <FieldError errors={[errors.description]} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field: { value, onChange } }) => (
                      <Select items={statusItems} value={value} onValueChange={(v) => onChange(v)} disabled={isSubmitting}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPAIGN_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel>Comic</FieldLabel>
                  <Controller
                    control={control}
                    name="universeSlug"
                    render={({ field: { value, onChange } }) => (
                      <Select items={comicItems} value={value} onValueChange={(v) => onChange(v)} disabled={isSubmitting}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(comicItems).map(([slug, name]) => (
                            <SelectItem key={slug} value={slug}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field data-invalid={!!errors.raised}>
                  <FieldLabel htmlFor="raised">Raised ($)</FieldLabel>
                  <Input type="number" min={0} {...field('raised')} />
                  <FieldError errors={[errors.raised]} />
                </Field>
                <Field data-invalid={!!errors.goal}>
                  <FieldLabel htmlFor="goal">Goal ($)</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    {...field('goal', { required: 'Goal is required', min: { value: 1, message: 'Goal must be more than 0' } })}
                  />
                  <FieldError errors={[errors.goal]} />
                </Field>
                <Field data-invalid={!!errors.backers}>
                  <FieldLabel htmlFor="backers">Backers</FieldLabel>
                  <Input type="number" min={0} {...field('backers')} />
                  <FieldError errors={[errors.backers]} />
                </Field>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Funded</span>
                  <span className="font-medium tabular-nums">{funded}%</span>
                </div>
                <FundedBar value={funded} color="var(--foreground)" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="startsAt">Starts</FieldLabel>
                  <Input type="date" className="scheme-dark" {...field('startsAt')} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="endsAt">Ends</FieldLabel>
                  <Input type="date" className="scheme-dark" {...field('endsAt')} />
                  <FieldDescription>Days left on the card count down to this.</FieldDescription>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.buttonLabel}>
                  <FieldLabel htmlFor="buttonLabel">Button label</FieldLabel>
                  <Input placeholder="Back the campaign" {...field('buttonLabel', { required: 'Button label is required' })} />
                  <FieldError errors={[errors.buttonLabel]} />
                </Field>
                <Field data-invalid={!!errors.buttonHref}>
                  <FieldLabel htmlFor="buttonHref">Button link</FieldLabel>
                  <Input placeholder="https://kickstarter.com/…" {...field('buttonHref', { required: 'Button link is required' })} />
                  <FieldError errors={[errors.buttonHref]} />
                </Field>
              </div>

              <Field className="sm:w-40">
                <FieldLabel htmlFor="sortOrder">Sort order</FieldLabel>
                <Input type="number" {...field('sortOrder')} />
                <FieldDescription>Lower shows first.</FieldDescription>
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <SubmitButton>{campaign ? 'Save changes' : 'Create campaign'}</SubmitButton>
          </SheetFooter>
        </fieldset>
      </form>
    </UploadScope>
  );
}

/* ---------- Table ---------- */

function TableHeadings() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="pl-4">Campaign</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Raised</TableHead>
        <TableHead>Backers</TableHead>
        <TableHead className="w-52">Funded</TableHead>
        <TableHead>Days left</TableHead>
        <TableHead className="pr-4 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** The real table with skeleton cells, so nothing jumps when the rows arrive */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Loading label="Loading campaigns">
      <Table className="min-w-240">
        <TableHeadings />
        <TableBody>
          {times(rows, (i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Bone className="h-10 w-14 shrink-0 rounded" />
                  <div className="space-y-1.5">
                    <Bone className={cn('h-3.5', i % 2 ? 'w-36' : 'w-48')} />
                    <Bone className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Bone className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Bone className="h-3.5 w-28" />
              </TableCell>
              <TableCell>
                <Bone className="h-3.5 w-10" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Bone className="h-1 flex-1 rounded-full" />
                  <Bone className="h-3 w-12" />
                </div>
              </TableCell>
              <TableCell>
                <Bone className="h-3.5 w-6" />
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex justify-end gap-1">
                  {times(3, (j) => (
                    <Bone key={j} className="size-7" />
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Loading>
  );
}

/* ---------- Page ---------- */

type Tab = 'ALL' | CampaignStatus;
const tabs: Tab[] = ['ALL', ...CAMPAIGN_STATUSES];

export default function CampaignsManager() {
  const { campaigns, error, isLoading, isValidating, refresh } = useCampaigns();
  const { run, isPending } = useOptimisticList(refresh);
  const { editor, open, close, closeForSave, reopen } = useEditor<CampaignDTO, FormValues>();
  const [tab, setTab] = useState<Tab>('ALL');
  const [deleting, setDeleting] = useState<CampaignDTO | null>(null);
  const { bySlug } = useComics();

  const rows = tab === 'ALL' ? campaigns : campaigns.filter((c) => c.status === tab);
  const countFor = (t: Tab) => (t === 'ALL' ? campaigns.length : campaigns.filter((c) => c.status === t).length);
  const raised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const backers = campaigns.reduce((sum, c) => sum + c.backers, 0);

  /* Every change lands in the list straight away and rolls back if the server says no */

  const onSave = (campaign: CampaignDTO | undefined, values: FormValues) => {
    /* A double click submits twice: only the first one is sent */
    if (!closeForSave()) return;
    const input = toInput(values);
    const row = toOptimistic(input, campaign?.id ?? tempId(), campaign);
    void run({
      id: row.id,
      update: (list) => sortRows(campaign ? replaceRow(list, row) : [...list, row], 'desc'),
      request: () => (campaign ? updateCampaign(campaign.id, input) : createCampaign(input)),
      onError: (e) => reopen(campaign, values, e),
    });
  };

  const onDelete = () => {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    void run({ id, update: (list) => removeRow(list, id), request: () => deleteCampaign(id), failure: 'Could not delete' });
  };

  const onStatusChange = (campaign: CampaignDTO, status: CampaignStatus) => {
    if (status === campaign.status) return;
    void run({
      id: campaign.id,
      update: (list) => replaceRow(list, { ...campaign, status }),
      request: () => updateCampaign(campaign.id, { status }),
      failure: 'Could not update',
    });
  };

  const editing = editor?.item;

  return (
    <>
      <PageHeader
        eyebrow="Kickstarter"
        title="Live Campaigns"
        description="Campaigns marked Live show in the campaigns section on the home page."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => refresh()}>
              <RefreshCwIcon className={cn(isValidating && 'animate-spin')} /> Refresh
            </Button>
            <Button size="lg" onClick={() => open()}>
              <PlusIcon /> New campaign
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Raised" value={formatMoney(raised)} hint="All campaigns" Icon={DollarSignIcon} loading={isLoading} />
        <Stat
          label="Backers"
          value={backers.toLocaleString('en-US')}
          hint="All campaigns"
          Icon={UsersIcon}
          loading={isLoading}
        />
        <Stat label="Live now" value={countFor('LIVE')} hint="Showing on the home page" Icon={TrendingUpIcon} loading={isLoading} />
        <Stat label="Total" value={campaigns.length} hint="Every status" Icon={CalendarIcon} loading={isLoading} />
      </div>

      <Card className="mt-8 gap-0 py-0">
        <CardHeader className="border-b py-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList variant="line" className="h-auto flex-wrap justify-start">
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t} className="flex-none px-2.5">
                  {t === 'ALL' ? 'All' : statusLabel(t)}
                  <TabCount value={countFor(t)} loading={isLoading} />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="px-0">
          {error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t load campaigns</AlertTitle>
                <AlertDescription>
                  <p>{error.message}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <InboxIcon className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {tab === 'ALL' ? 'No campaigns yet.' : `No ${statusLabel(tab).toLowerCase()} campaigns.`}
              </p>
              <Button onClick={() => open()}>
                <PlusIcon /> New campaign
              </Button>
            </div>
          ) : (
            <Table className="min-w-240">
              <TableHeadings />
              <TableBody>
                {rows.map((c) => {
                  const universe = bySlug(c.universeSlug);
                  const accent = universe?.palette.accent ?? '#ffffff';
                  /* Locked while its change is with the server */
                  const pending = isPending(c.id);
                  return (
                    <TableRow key={c.id} inert={pending} className={cn(pending && 'opacity-60')}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
                            <Image src={c.image} alt="" fill sizes="56px" className="object-cover" unoptimized />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{universe?.name ?? 'No comic'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          items={statusItems}
                          value={c.status}
                          disabled={pending}
                          onValueChange={(v) => onStatusChange(c, v as CampaignStatus)}
                        >
                          <SelectTrigger size="sm" aria-label="Change status" className="border-none bg-transparent! p-0 pr-1">
                            <StatusBadge status={c.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMPAIGN_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {statusLabel(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className="font-semibold">{formatMoney(c.raised)}</span>
                        <span className="text-xs text-muted-foreground"> / {formatMoney(c.goal)}</span>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{c.backers.toLocaleString('en-US')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FundedBar value={c.funded} color={accent} />
                          <span className="w-12 text-right text-xs font-bold tabular-nums" style={{ color: accent }}>
                            {c.funded}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{c.daysLeft ?? '—'}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {pending ? (
                            <Saving className="h-7" />
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Open link"
                                nativeButton={false}
                                render={<a href={c.buttonHref} target="_blank" rel="noreferrer" />}
                              >
                                <ExternalLinkIcon />
                              </Button>
                              <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => open(c)}>
                                <PencilIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete"
                                className="hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleting(c)}
                              >
                                <Trash2Icon />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / edit */}
      <Sheet open={!!editor} onOpenChange={(isOpen) => !isOpen && close()}>
        <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle className="font-body text-lg font-bold">{editing ? editing.title : 'New campaign'}</SheetTitle>
            <SheetDescription>
              {editing ? 'Edit the campaign card and its numbers.' : 'Add a campaign. Set it to Live to show it on the home page.'}
            </SheetDescription>
          </SheetHeader>
          {editor && (
            <CampaignForm
              key={editing?.id ?? 'new'}
              campaign={editing}
              rejected={editor.rejected}
              onSave={(values) => onSave(editing, values)}
              onCancel={close}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(isOpen) => !isOpen && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-body font-bold">Delete this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be removed for good. This can&apos;t be undone.
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
