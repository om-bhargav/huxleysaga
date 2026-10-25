'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm, useWatch, Controller, type RegisterOptions } from 'react-hook-form';
import {
  EyeIcon,
  EyeOffIcon,
  MessageSquareQuoteIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { createTestimonial, deleteTestimonial, updateTestimonial, useTestimonials } from '@/hooks/useTestimonials';
import type { TestimonialDTO, TestimonialInput } from '@/lib/testimonials/types';
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
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

/* ---------- Form ---------- */

type FormValues = {
  quote: string;
  name: string;
  campaign: string;
  image: string;
  published: boolean;
  sortOrder: string;
};

const toFormValues = (t?: TestimonialDTO): FormValues => ({
  quote: t?.quote ?? '',
  name: t?.name ?? '',
  campaign: t?.campaign ?? '',
  image: t?.image ?? '',
  published: t?.published ?? true,
  sortOrder: String(t?.sortOrder ?? 0),
});

const toInput = (v: FormValues): TestimonialInput => ({
  quote: v.quote,
  name: v.name,
  campaign: v.campaign,
  image: v.image || null,
  published: v.published,
  sortOrder: Number(v.sortOrder) || 0,
});

/** The card to show until the server answers */
const toOptimistic = (input: TestimonialInput, id: string, current?: TestimonialDTO): TestimonialDTO => {
  const now = new Date().toISOString();
  return {
    id,
    quote: input.quote,
    name: input.name,
    campaign: input.campaign,
    image: input.image ?? null,
    published: input.published ?? true,
    sortOrder: input.sortOrder ?? 0,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
};

function TestimonialForm({
  testimonial,
  campaigns,
  rejected,
  onSave,
  onCancel,
}: {
  testimonial?: TestimonialDTO;
  /** Suggestions for the campaign field */
  campaigns: string[];
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
  } = useForm<FormValues>({ defaultValues: rejected?.values ?? toFormValues(testimonial) });
  useRejectedErrors(rejected, setError);

  const [quote, name, campaign, image] = useWatch({ control, name: ['quote', 'name', 'campaign', 'image'] });

  const onSubmit = handleSubmit(onSave);

  type TextField = Exclude<keyof FormValues, 'published'>;
  /** Wires an input to the form and marks it invalid for the field styles */
  const field = (key: TextField, rules?: RegisterOptions<FormValues, TextField>) => ({
    id: key,
    'aria-invalid': !!errors[key],
    ...register(key, rules),
  });

  return (
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
            {/* Live preview, styled like the card on the home page */}
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">Preview</p>
              <TestimonialPreview
                quote={quote || 'The backer’s comment shows here.'}
                name={name || 'Backer name'}
                campaign={campaign || 'Campaign'}
                image={image || null}
              />
            </div>

            <Field data-invalid={!!errors.quote}>
              <FieldLabel htmlFor="quote">Quote</FieldLabel>
              <Textarea className="min-h-28" {...field('quote', { required: 'Quote is required' })} />
              <FieldDescription>Paste the backer&apos;s comment as written, with their permission.</FieldDescription>
              <FieldError errors={[errors.quote]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Backer name</FieldLabel>
                <Input placeholder="Alex R." {...field('name', { required: 'Name is required' })} />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field data-invalid={!!errors.campaign}>
                <FieldLabel htmlFor="campaign">Campaign backed</FieldLabel>
                <Input
                  placeholder="Agent Scarlett #1"
                  list="campaign-suggestions"
                  {...field('campaign', { required: 'Campaign is required' })}
                />
                <datalist id="campaign-suggestions">
                  {campaigns.map((title) => (
                    <option key={title} value={title} />
                  ))}
                </datalist>
                <FieldDescription>Shown as &ldquo;Backed …&rdquo;.</FieldDescription>
                <FieldError errors={[errors.campaign]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="image">Image URL</FieldLabel>
              <Input placeholder="Optional screenshot or artwork" {...field('image')} />
            </Field>

            <Controller
              control={control}
              name="published"
              render={({ field: { value, onChange } }) => (
                <FieldLabel htmlFor="published">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <span className="font-medium">Published</span>
                      <FieldDescription>Show this on the home page.</FieldDescription>
                    </FieldContent>
                    <Switch id="published" checked={value} onCheckedChange={onChange} disabled={isSubmitting} />
                  </Field>
                </FieldLabel>
              )}
            />

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
          <Button type="submit">{testimonial ? 'Save changes' : 'Add testimonial'}</Button>
        </SheetFooter>
      </fieldset>
    </form>
  );
}

/** Same look as TestimonialCard in components/home/BackersSection */
function TestimonialPreview({ quote, name, campaign, image }: Pick<TestimonialDTO, 'quote' | 'name' | 'campaign' | 'image'>) {
  return (
    <figure className="relative flex min-h-56 flex-col border border-white/10 bg-black p-3 uppercase text-white">
      {image && (
        <div className="relative mb-4 aspect-4/3 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
        </div>
      )}
      <blockquote className="text-sm leading-relaxed tracking-wide text-white/80">&ldquo;{quote}&rdquo;</blockquote>
      <figcaption className="mt-auto pt-10">
        <span className="block font-heading text-lg tracking-wide">{name}</span>
        <span className="mt-2 block text-[10px] tracking-wider text-white/50">Backed {campaign}</span>
      </figcaption>
    </figure>
  );
}

/* ---------- Page ---------- */

const GRID = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

/** Same frame as a testimonial card, so nothing jumps when the data lands */
function CardsSkeleton() {
  return (
    <Loading label="Loading testimonials" className={GRID}>
      {times(8, (i) => (
        <Card key={i} className="gap-0 pb-0">
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-18 rounded-full" />
              <Bone className="h-3 w-5" />
            </div>
            <div className="space-y-2">
              <Bone className="h-3.5 w-full" />
              <Bone className="h-3.5 w-full" />
              <Bone className="h-3.5 w-11/12" />
              <Bone className={cn('h-3.5', i % 2 ? 'w-1/2' : 'w-3/4')} />
            </div>
            <div className="mt-auto space-y-1.5">
              <Bone className="h-4 w-28" />
              <Bone className="h-3 w-36" />
            </div>
          </CardContent>
          <CardFooter className="mt-4 justify-between gap-2 border-t py-2">
            <Bone className="h-7 w-20" />
            <div className="flex gap-1">
              <Bone className="size-7" />
              <Bone className="size-7" />
            </div>
          </CardFooter>
        </Card>
      ))}
    </Loading>
  );
}

type Tab = 'all' | 'published' | 'hidden';

export default function TestimonialsManager() {
  const { testimonials, error, isLoading, isValidating, refresh } = useTestimonials();
  const { run, isPending } = useOptimisticList(refresh);
  const { editor, open, close, closeForSave, reopen } = useEditor<TestimonialDTO, FormValues>();
  const { campaigns } = useCampaigns();
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<TestimonialDTO | null>(null);

  /* Campaign names to suggest, from the campaigns in the database */
  const campaignSuggestions = [...new Set(campaigns.map((c) => c.title))];

  const published = testimonials.filter((t) => t.published).length;
  const q = query.trim().toLowerCase();
  const rows = testimonials.filter(
    (t) =>
      (tab === 'all' || (tab === 'published' ? t.published : !t.published)) &&
      (!q || `${t.quote} ${t.name} ${t.campaign}`.toLowerCase().includes(q)),
  );

  /* Every change lands in the list straight away and rolls back if the server says no */

  const onSave = (testimonial: TestimonialDTO | undefined, values: FormValues) => {
    /* A double click submits twice: only the first one is sent */
    if (!closeForSave()) return;
    const input = toInput(values);
    const row = toOptimistic(input, testimonial?.id ?? tempId(), testimonial);
    void run({
      id: row.id,
      update: (list) => sortRows(testimonial ? replaceRow(list, row) : [...list, row], 'desc'),
      request: () => (testimonial ? updateTestimonial(testimonial.id, input) : createTestimonial(input)),
      onError: (e) => reopen(testimonial, values, e),
    });
  };

  const onTogglePublished = (t: TestimonialDTO) =>
    void run({
      id: t.id,
      update: (list) => replaceRow(list, { ...t, published: !t.published }),
      request: async () => {
        await updateTestimonial(t.id, { published: !t.published });
        return { message: t.published ? 'Hidden from the home page' : 'Published to the home page' };
      },
      failure: 'Could not update',
    });

  const onDelete = () => {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    void run({ id, update: (list) => removeRow(list, id), request: () => deleteTestimonial(id), failure: 'Could not delete' });
  };

  const editing = editor?.item;

  return (
    <>
      <PageHeader
        eyebrow="Social proof"
        title="Backer Testimonials"
        description="Comments from backers. Published ones show in the “Our backers” section on the home page."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => refresh()}>
              <RefreshCwIcon className={cn(isValidating && 'animate-spin')} /> Refresh
            </Button>
            <Button size="lg" onClick={() => open()}>
              <PlusIcon /> New testimonial
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="all">
              All <TabCount value={testimonials.length} loading={isLoading} />
            </TabsTrigger>
            <TabsTrigger value="published">
              Published <TabCount value={published} loading={isLoading} />
            </TabsTrigger>
            <TabsTrigger value="hidden">
              Hidden <TabCount value={testimonials.length - published} loading={isLoading} />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative md:ml-auto md:w-72">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quote, name, campaign"
            className="pl-8"
            aria-label="Search testimonials"
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t load testimonials</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <CardsSkeleton />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquareQuoteIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {testimonials.length ? 'Nothing matches.' : 'No testimonials yet.'}
            </p>
            {testimonials.length ? (
              <Button
                variant="outline"
                onClick={() => {
                  setTab('all');
                  setQuery('');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => open()}>
                <PlusIcon /> New testimonial
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={GRID}>
          {rows.map((t) => {
            /* Locked while its change is with the server */
            const pending = isPending(t.id);
            return (
            <Card key={t.id} inert={pending} className={cn('gap-0 pb-0', (!t.published || pending) && 'opacity-60')}>
              {t.image && (
                <div className="relative -mt-4 mb-4 aspect-4/3 overflow-hidden">
                  <Image src={t.image} alt="" fill unoptimized sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" />
                </div>
              )}
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between">
                  {t.published ? (
                    <Badge variant="secondary">Published</Badge>
                  ) : (
                    <Badge variant="outline">Hidden</Badge>
                  )}
                  {pending ? (
                    <Saving />
                  ) : (
                    <span className="text-xs tabular-nums text-muted-foreground">#{t.sortOrder}</span>
                  )}
                </div>
                <blockquote className="line-clamp-6 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                <div className="mt-auto">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Backed {t.campaign}</p>
                </div>
              </CardContent>
              <CardFooter className="mt-4 justify-between gap-2 border-t py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePublished(t)}
                  aria-label={t.published ? 'Hide' : 'Publish'}
                >
                  {t.published ? <EyeOffIcon /> : <EyeIcon />}
                  {t.published ? 'Hide' : 'Publish'}
                </Button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => open(t)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(t)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </CardFooter>
            </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Sheet open={!!editor} onOpenChange={(isOpen) => !isOpen && close()}>
        <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle className="font-body text-lg font-bold">
              {editing ? `${editing.name}'s testimonial` : 'New testimonial'}
            </SheetTitle>
            <SheetDescription>
              {editing ? 'Edit the quote and how it’s credited.' : 'Add a comment from a backer.'}
            </SheetDescription>
          </SheetHeader>
          {editor && (
            <TestimonialForm
              key={editing?.id ?? 'new'}
              testimonial={editing}
              campaigns={campaignSuggestions}
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
            <AlertDialogTitle className="font-body font-bold">Delete this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name}&apos;s comment will be removed for good. To take it off the site but keep it, hide it
              instead.
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
