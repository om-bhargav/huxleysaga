'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  ImagesIcon,
  MegaphoneIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react';
import { worlds, displayFontClass } from '@/config/worlds';
import { createComic, deleteComic, updateComic, useComics } from '@/hooks/useComics';
import { COMIC_DISPLAYS, type ComicDTO, type ComicDisplay, type ComicInput } from '@/lib/comics/types';
import { cn } from '@/lib/utils';
import {
  errorMessage,
  fieldErrors,
  removeRow,
  replaceRow,
  sortRows,
  tempId,
  useEditor,
  useOptimisticList,
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const NO_WORLD = 'none';
const worldItems: Record<string, string> = {
  [NO_WORLD]: 'Unassigned',
  ...Object.fromEntries(worlds.map((w) => [w.slug, w.label])),
};
const worldOf = (slug: string | null) => worlds.find((w) => w.slug === slug);

/** The faces from fonts/universes.ts, named after what they're used for */
const displayItems: Record<ComicDisplay, string> = {
  stencil: 'Stencil · spy',
  western: 'Western · wild west',
  astroz: 'Astroz · gaming',
  morris: 'Morris Roman · fantasy',
  garamond: 'Garamond · library',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ---------- Form model ---------- */

type FormValues = {
  slug: string;
  name: string;
  overline: string;
  shortName: string;
  genre: string;
  hook: string;
  worldSlug: string;
  display: ComicDisplay;
  published: boolean;
  sortOrder: string;
  palette: { ink: string; paper: string; accent: string; accentSoft: string };
  hero: { poster: string; video: string; videoNote: string };
  story: { headline: string; text: string; more: string; image: string };
  gallery: { title: string; note: string; images: { src: string; caption: string }[] };
  cta: { headline: string; buttons: { label: string; href: string }[] };
  signupLine: string;
  hasFace: boolean;
  face: { name: string; tag: string; bio: string; href: string; image: string };
  direction: { type: string; motion: string; cursor: string; reveal: string; gallery: string };
};

const DEFAULT_PALETTE = { ink: '#0B0B0F', paper: '#E9E6DF', accent: '#C4122F', accentSoft: '#8A8F98' };

const toFormValues = (c?: ComicDTO, world?: string): FormValues => ({
  slug: c?.slug ?? '',
  name: c?.name ?? '',
  overline: c?.overline ?? '',
  shortName: c?.shortName ?? '',
  genre: c?.genre ?? '',
  hook: c?.hook ?? '',
  /* A new comic starts in the world currently filtered on */
  worldSlug: c ? (c.worldSlug ?? NO_WORLD) : (world ?? NO_WORLD),
  display: c?.display ?? (worldOf(world ?? null)?.display as ComicDisplay | undefined) ?? 'stencil',
  published: c?.published ?? true,
  sortOrder: String(c?.sortOrder ?? 0),
  palette: c?.palette ?? DEFAULT_PALETTE,
  hero: { poster: c?.hero.poster ?? '', video: c?.hero.video ?? '', videoNote: c?.hero.videoNote ?? '' },
  story: {
    headline: c?.story.headline ?? '',
    text: c?.story.text ?? '',
    more: c?.story.more ?? '',
    image: c?.story.image ?? '',
  },
  gallery: { title: c?.gallery.title ?? '', note: c?.gallery.note ?? '', images: c?.gallery.images ?? [] },
  cta: { headline: c?.cta.headline ?? '', buttons: c?.cta.buttons ?? [{ label: '', href: '' }] },
  signupLine: c?.signup.line ?? '',
  hasFace: !!c?.face,
  face: c?.face ?? { name: '', tag: '', bio: '', href: '', image: '' },
  direction: c?.direction ?? { type: '', motion: '', cursor: '', reveal: '', gallery: '' },
});

const toInput = (v: FormValues): ComicInput => ({
  slug: v.slug,
  name: v.name,
  overline: v.overline || null,
  shortName: v.shortName,
  genre: v.genre,
  hook: v.hook,
  worldSlug: v.worldSlug === NO_WORLD ? null : v.worldSlug,
  display: v.display,
  published: v.published,
  sortOrder: Number(v.sortOrder) || 0,
  palette: v.palette,
  hero: v.hero,
  story: v.story,
  gallery: v.gallery,
  cta: v.cta,
  signup: { line: v.signupLine },
  face: v.hasFace ? v.face : null,
  direction: v.direction,
});

/** The card to show until the server answers */
const toOptimistic = (input: ComicInput, id: string, current?: ComicDTO): ComicDTO => {
  const now = new Date().toISOString();
  return {
    id,
    slug: input.slug,
    name: input.name,
    overline: input.overline ?? null,
    shortName: input.shortName,
    genre: input.genre,
    hook: input.hook,
    worldSlug: input.worldSlug ?? null,
    display: input.display ?? 'stencil',
    palette: input.palette,
    direction: { type: '', motion: '', cursor: '', reveal: '', gallery: '', ...input.direction },
    hero: input.hero,
    story: input.story,
    gallery: { title: input.gallery.title, note: input.gallery.note ?? null, images: input.gallery.images ?? [] },
    face: input.face ?? null,
    cta: input.cta,
    signup: input.signup,
    published: input.published ?? true,
    sortOrder: input.sortOrder ?? 0,
    counts: current?.counts ?? { characters: 0, campaigns: 0 },
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
};

/* Which editor tab each field lives on, so a failed save can jump to the right one */
const SECTIONS = [
  { id: 'basics', label: 'Basics', fields: ['slug', 'name', 'overline', 'shortName', 'genre', 'hook', 'worldSlug', 'sortOrder'] },
  { id: 'look', label: 'Look', fields: ['display', 'palette'] },
  { id: 'story', label: 'Hero & story', fields: ['hero', 'story'] },
  { id: 'gallery', label: 'Gallery', fields: ['gallery'] },
  { id: 'cta', label: 'CTA & signup', fields: ['cta', 'signupLine', 'face', 'signup'] },
  { id: 'notes', label: 'Notes', fields: ['direction'] },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

const sectionsWithErrors = (keys: string[]) =>
  SECTIONS.filter((s) => (s.fields as readonly string[]).some((f) => keys.includes(f))).map((s) => s.id);

/* ---------- Form pieces ---------- */

type FieldProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

/** Label + input + error for a text field at any path */
function TextField({
  label,
  name,
  register,
  error,
  required,
  description,
  placeholder,
  multiline,
  className,
}: {
  label: string;
  name: Parameters<UseFormRegister<FormValues>>[0];
  register: UseFormRegister<FormValues>;
  error?: { message?: string };
  required?: string;
  description?: ReactNode;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const props = { id: name, placeholder, 'aria-invalid': !!error, ...register(name, { required }) };
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      {multiline ? <Textarea className="min-h-24" {...props} /> : <Input {...props} />}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}

/** Native colour picker next to a hex input, both bound to the same value */
function ColorField({ label, name, control }: { label: string; name: `palette.${keyof FormValues['palette']}`; control: Control<FormValues> }) {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ pattern: { value: /^#[0-9a-f]{6}$/i, message: 'Use a hex colour like #1B1B24' } }}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <div className="flex gap-2">
            <label
              className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-foreground/15"
              style={{ backgroundColor: field.value }}
            >
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(field.value) ? field.value : '#000000'}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label={`${label} picker`}
              />
            </label>
            <Input id={name} {...field} aria-invalid={!!fieldState.error} className="font-mono uppercase" />
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** How the comic's hero reads with its palette and display face */
function LookPreview({ control }: { control: Control<FormValues> }) {
  const [palette, display, name, overline, hook] = useWatch({
    control,
    name: ['palette', 'display', 'name', 'overline', 'hook'],
  });
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10" style={{ backgroundColor: palette.ink, color: palette.paper }}>
      <div className="space-y-3 p-6">
        {overline && (
          <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: palette.accent }}>
            {overline}
          </p>
        )}
        <p className={cn('text-4xl leading-none', displayFontClass[display])}>{name || 'Comic name'}</p>
        <p className="text-sm opacity-80">{hook || 'The one-line hook goes here.'}</p>
        <div className="flex items-center gap-3 pt-2">
          <span className="px-3 py-1.5 text-xs font-bold uppercase" style={{ backgroundColor: palette.accent, color: palette.ink }}>
            Call to action
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: palette.accentSoft }}>
            Soft accent
          </span>
        </div>
      </div>
    </div>
  );
}

function GalleryEditor({ control, register, errors }: FieldProps & { control: Control<FormValues> }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'gallery.images' });
  const images = useWatch({ control, name: 'gallery.images' });

  return (
    <FieldSet>
      <FieldLegend variant="label">Images</FieldLegend>
      <FieldDescription>Shown in this order. Covers first, then interior pages.</FieldDescription>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-start gap-2 rounded-lg border p-2">
            <div className="relative aspect-3/2 w-20 shrink-0 overflow-hidden rounded bg-muted">
              {images?.[i]?.src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[i].src} alt="" className="absolute inset-0 size-full object-cover" />
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <Input
                placeholder="Image URL"
                aria-label={`Image ${i + 1} URL`}
                aria-invalid={!!errors.gallery?.images?.[i]?.src}
                {...register(`gallery.images.${i}.src`, { required: 'Image URL is required' })}
              />
              <Input placeholder="Caption" aria-label={`Image ${i + 1} caption`} {...register(`gallery.images.${i}.caption`)} />
            </div>
            <div className="flex flex-col">
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move down"
                disabled={i === fields.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove image"
                className="hover:text-destructive"
                onClick={() => remove(i)}
              >
                <XIcon />
              </Button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">No images yet.</p>
        )}
      </div>
      <Button type="button" variant="outline" className="w-fit" onClick={() => append({ src: '', caption: '' })}>
        <PlusIcon /> Add image
      </Button>
    </FieldSet>
  );
}

function CtaButtonsEditor({ control, register, errors }: FieldProps & { control: Control<FormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'cta.buttons' });
  return (
    <FieldSet>
      <FieldLegend variant="label">Buttons</FieldLegend>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <Input
              placeholder="Get Venom Vixens"
              aria-label={`Button ${i + 1} label`}
              aria-invalid={!!errors.cta?.buttons?.[i]?.label}
              {...register(`cta.buttons.${i}.label`, { required: 'Label is required' })}
            />
            <Input
              placeholder="https://…"
              aria-label={`Button ${i + 1} link`}
              aria-invalid={!!errors.cta?.buttons?.[i]?.href}
              {...register(`cta.buttons.${i}.href`, { required: 'Link is required' })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove button"
              className="shrink-0 hover:text-destructive"
              onClick={() => remove(i)}
            >
              <XIcon />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-fit" onClick={() => append({ label: '', href: '' })}>
        <PlusIcon /> Add button
      </Button>
    </FieldSet>
  );
}

/* ---------- Editor ---------- */

function ComicForm({
  comic,
  world,
  rejected,
  onSave,
  onCancel,
}: {
  comic?: ComicDTO;
  world?: string;
  /** A save the server turned down, to pick up where it left off */
  rejected?: Rejected<FormValues>;
  onSave: (values: FormValues) => void;
  onCancel: () => void;
}) {
  /* Fields the server complained about, flagged on their tabs; the first such tab opens */
  const [serverErrorKeys] = useState(() => (rejected ? Object.keys(fieldErrors(rejected.error)) : []));
  const [section, setSection] = useState<SectionId>(() => sectionsWithErrors(serverErrorKeys)[0] ?? 'basics');
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: rejected?.values ?? toFormValues(comic, world) });

  const hasFace = useWatch({ control, name: 'hasFace' });
  const [posterUrl, storyImage] = useWatch({ control, name: ['hero.poster', 'story.image'] });

  const flagged = new Set([...sectionsWithErrors(Object.keys(errors)), ...sectionsWithErrors(serverErrorKeys)]);

  const onSubmit = handleSubmit(
    onSave,
    /* Client-side problems: open the first tab that has one */
    (invalid) => {
      const first = sectionsWithErrors(Object.keys(invalid))[0];
      if (first) setSection(first);
    },
  );

  /* While creating, the slug and short name follow the name until they're edited by hand */
  const nameField = register('name', {
    required: 'Name is required',
    onChange: (e) => {
      if (comic) return;
      const value = e.target.value as string;
      if (!getFieldState('slug').isDirty) setValue('slug', slugify(value));
      if (!getFieldState('shortName').isDirty) setValue('shortName', value.replace(/^the\s+/i, ''));
    },
  });

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <fieldset disabled={isSubmitting} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Tabs value={section} onValueChange={(v) => setSection(v as SectionId)} className="min-h-0 flex-1 gap-0">
          <div className="border-b px-4 py-2">
            <TabsList variant="line" className="h-auto flex-wrap justify-start">
              {SECTIONS.map((s) => (
                <TabsTrigger key={s.id} value={s.id} className="flex-none px-2">
                  {s.label}
                  {flagged.has(s.id) && <span className="size-1.5 rounded-full bg-destructive" aria-label="has errors" />}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4" data-lenis-prevent>
            {rejected && (
              <Alert variant="destructive" className="mb-5">
                <TriangleAlertIcon />
                <AlertTitle>Couldn&apos;t save</AlertTitle>
                <AlertDescription>{errorMessage(rejected.error, 'Could not reach the server')}</AlertDescription>
              </Alert>
            )}

            {/* keepMounted: hidden tabs still validate and keep their values */}
            <TabsContent value="basics" keepMounted>
              <FieldGroup>
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" placeholder="The Boundless Loop" aria-invalid={!!errors.name} {...nameField} />
                  <FieldError errors={[errors.name]} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Slug"
                    name="slug"
                    register={register}
                    error={errors.slug}
                    required="Slug is required"
                    placeholder="boundless-loop"
                    description={comic ? 'Changing it moves the page. Links from characters and campaigns follow.' : 'The page address, e.g. /boundless-loop'}
                  />
                  <TextField
                    label="Short name"
                    name="shortName"
                    register={register}
                    error={errors.shortName}
                    required="Short name is required"
                    placeholder="Boundless Loop"
                    description="For the nav and cards."
                  />
                </div>
                <TextField label="Overline" name="overline" register={register} placeholder="The Kat Chronicle" description="Optional. Sits above the name." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>World</FieldLabel>
                    <Controller
                      control={control}
                      name="worldSlug"
                      render={({ field }) => (
                        <Select items={worldItems} value={field.value} onValueChange={(v) => field.onChange(v)} disabled={isSubmitting}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(worldItems).map(([slug, label]) => (
                              <SelectItem key={slug} value={slug}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldDescription>From config/worlds.</FieldDescription>
                  </Field>
                  <TextField label="Genre" name="genre" register={register} error={errors.genre} required="Genre is required" placeholder="Gaming" />
                </div>
                <TextField
                  label="Hook"
                  name="hook"
                  register={register}
                  error={errors.hook}
                  required="Hook is required"
                  placeholder="The perfect world you designed becomes your prison."
                />
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="published"
                    render={({ field }) => (
                      <FieldLabel htmlFor="published">
                        <Field orientation="horizontal">
                          <FieldContent>
                            <span className="font-medium">Published</span>
                            <FieldDescription>Show it on the site.</FieldDescription>
                          </FieldContent>
                          <Switch id="published" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                        </Field>
                      </FieldLabel>
                    )}
                  />
                  <Field>
                    <FieldLabel htmlFor="sortOrder">Sort order</FieldLabel>
                    <Input id="sortOrder" type="number" {...register('sortOrder')} />
                    <FieldDescription>Lower shows first within its world.</FieldDescription>
                  </Field>
                </div>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="look" keepMounted>
              <FieldGroup>
                <LookPreview control={control} />
                <Field>
                  <FieldLabel>Display face</FieldLabel>
                  <Controller
                    control={control}
                    name="display"
                    render={({ field }) => (
                      <Select items={displayItems} value={field.value} onValueChange={(v) => field.onChange(v)} disabled={isSubmitting}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMIC_DISPLAYS.map((d) => (
                            <SelectItem key={d} value={d}>
                              <span className={cn('text-base', displayFontClass[d])}>Aa</span>
                              {displayItems[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <FieldSet>
                  <FieldLegend variant="label">Palette</FieldLegend>
                  <FieldDescription>Ink is the page ground, paper the text on it.</FieldDescription>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField label="Ink" name="palette.ink" control={control} />
                    <ColorField label="Paper" name="palette.paper" control={control} />
                    <ColorField label="Accent" name="palette.accent" control={control} />
                    <ColorField label="Soft accent" name="palette.accentSoft" control={control} />
                  </div>
                </FieldSet>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="story" keepMounted>
              <FieldGroup>
                <div className="relative aspect-video overflow-hidden rounded-xl border border-dashed bg-muted/30">
                  {posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={posterUrl} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Hero poster</span>
                  )}
                </div>
                <TextField
                  label="Hero poster"
                  name="hero.poster"
                  register={register}
                  error={errors.hero?.poster}
                  required="Hero poster is required"
                  placeholder="https://… or /assets/…"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Hero video" name="hero.video" register={register} placeholder="/assets/venom.mp4" description="Optional." />
                  <TextField label="Video note" name="hero.videoNote" register={register} placeholder="Video → story snippets → …" />
                </div>
                <TextField
                  label="Story headline"
                  name="story.headline"
                  register={register}
                  error={errors.story?.headline}
                  required="Story headline is required"
                />
                <TextField label="Story" name="story.text" register={register} error={errors.story?.text} required="Story is required" multiline />
                <TextField label="More story" name="story.more" register={register} multiline description="Optional second paragraph." />
                <div className="flex items-end gap-3">
                  <TextField label="Story image" name="story.image" register={register} description="Optional." className="flex-1" />
                  {storyImage && (
                    <div className="relative mb-6 size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={storyImage} alt="" className="absolute inset-0 size-full object-cover" />
                    </div>
                  )}
                </div>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="gallery" keepMounted>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Gallery title"
                    name="gallery.title"
                    register={register}
                    error={errors.gallery?.title}
                    required="Gallery title is required"
                    placeholder="A Taste of What's Inside"
                  />
                  <TextField label="Note" name="gallery.note" register={register} description="Optional, for the team." />
                </div>
                <GalleryEditor control={control} register={register} errors={errors} />
              </FieldGroup>
            </TabsContent>

            <TabsContent value="cta" keepMounted>
              <FieldGroup>
                <TextField
                  label="CTA headline"
                  name="cta.headline"
                  register={register}
                  error={errors.cta?.headline}
                  required="CTA headline is required"
                  placeholder="They took the gold. Now take home the story."
                />
                <CtaButtonsEditor control={control} register={register} errors={errors} />
                <TextField
                  label="Signup line"
                  name="signupLine"
                  register={register}
                  error={errors.signupLine}
                  required="Signup line is required"
                  placeholder="Ride with us. Get the next drop first."
                />

                <Controller
                  control={control}
                  name="hasFace"
                  render={({ field }) => (
                    <FieldLabel htmlFor="hasFace">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <span className="font-medium">Collaborator</span>
                          <FieldDescription>A real face behind the comic, e.g. a model or co-creator.</FieldDescription>
                        </FieldContent>
                        <Switch id="hasFace" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                      </Field>
                    </FieldLabel>
                  )}
                />
                {hasFace && (
                  <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                    <TextField label="Name" name="face.name" register={register} error={errors.face?.name} required="Name is required" />
                    <TextField label="Tag" name="face.tag" register={register} error={errors.face?.tag} required="Tag is required" placeholder="Collaborator" />
                    <TextField
                      label="Bio"
                      name="face.bio"
                      register={register}
                      error={errors.face?.bio}
                      required="Bio is required"
                      multiline
                      className="sm:col-span-2"
                    />
                    <TextField label="Link" name="face.href" register={register} error={errors.face?.href} required="Link is required" />
                    <TextField label="Image" name="face.image" register={register} error={errors.face?.image} required="Image is required" />
                  </div>
                )}
              </FieldGroup>
            </TabsContent>

            <TabsContent value="notes" keepMounted>
              <FieldGroup>
                <FieldDescription>Design-direction notes for the team. None of these show on the site.</FieldDescription>
                <TextField label="Type" name="direction.type" register={register} multiline />
                <TextField label="Motion" name="direction.motion" register={register} multiline />
                <TextField label="Cursor" name="direction.cursor" register={register} multiline />
                <TextField label="Character reveal" name="direction.reveal" register={register} multiline />
                <TextField label="Gallery treatment" name="direction.gallery" register={register} multiline />
              </FieldGroup>
            </TabsContent>
          </div>
        </Tabs>

        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{comic ? 'Save changes' : 'Create comic'}</Button>
        </SheetFooter>
      </fieldset>
    </form>
  );
}

/* ---------- List ---------- */

function ComicCard({
  comic,
  pending,
  onEdit,
  onDelete,
}: {
  comic: ComicDTO;
  /** Its change is with the server: the card is locked until it answers */
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { palette } = comic;
  const stats = [
    { label: 'Characters', value: comic.counts.characters, Icon: UsersIcon },
    { label: 'Gallery', value: comic.gallery.images.length, Icon: ImagesIcon },
    { label: 'Campaigns', value: comic.counts.campaigns, Icon: MegaphoneIcon },
  ];

  return (
    <Card inert={pending} className={cn('group gap-0 py-0', (!comic.published || pending) && 'opacity-60')}>
      <button type="button" onClick={onEdit} className="relative aspect-video overflow-hidden text-left">
        <Image
          src={comic.hero.poster}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1536px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0" style={{ background: `linear-gradient(to top, ${palette.ink} 8%, transparent 75%)` }} />
        <span className="absolute left-3 top-3 flex gap-1.5">
          {!comic.published && <Badge variant="secondary">Hidden</Badge>}
          <Badge variant="outline" className="border-white/20 bg-black/50 text-white backdrop-blur">
            {comic.genre.replace('[PLACEHOLDER] ', '')}
          </Badge>
        </span>
        <span className="absolute inset-x-4 bottom-3">
          {comic.overline && (
            <span className="block text-[11px] uppercase tracking-[0.2em]" style={{ color: palette.accent }}>
              {comic.overline}
            </span>
          )}
          <span className={cn('block text-3xl leading-tight', displayFontClass[comic.display])} style={{ color: palette.paper }}>
            {comic.name}
          </span>
        </span>
      </button>

      <CardContent className="space-y-4 p-4">
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{comic.hook}</p>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-lg bg-muted/50 px-2 py-2 text-center">
              <p className="flex items-center justify-center gap-1.5 font-semibold tabular-nums">
                <Icon className="size-3.5 text-muted-foreground" />
                {value}
              </p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t py-2">
        <div className="flex items-center gap-1" aria-label="Palette">
          {Object.entries(palette).map(([key, color]) => (
            <span key={key} title={`${key} ${color}`} className="size-3.5 rounded-full ring-1 ring-foreground/20" style={{ backgroundColor: color }} />
          ))}
          <span className="ml-1.5 text-xs text-muted-foreground">/{comic.slug}</span>
        </div>
        {pending ? (
          <Saving className="h-7" />
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="View on site"
              nativeButton={false}
              render={<a href={`/${comic.slug}`} target="_blank" rel="noreferrer" />}
            >
              <ExternalLinkIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={onEdit}>
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2Icon />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

const GRID = 'grid gap-4 md:grid-cols-2 2xl:grid-cols-3';

/** Same frame as ComicCard, so nothing jumps when the data lands */
function ComicCardSkeleton({ wide }: { wide?: boolean }) {
  return (
    <Card className="gap-0 py-0">
      <div className="relative aspect-video">
        <Bone className="absolute inset-0 rounded-none" />
        <Bone className="absolute left-3 top-3 h-5 w-16 rounded-full" />
        <div className="absolute inset-x-4 bottom-3 space-y-2">
          <Bone className="h-2.5 w-24" />
          <Bone className={cn('h-7', wide ? 'w-3/4' : 'w-1/2')} />
        </div>
      </div>
      <CardContent className="space-y-4 p-4">
        <div className="min-h-10 space-y-2 py-0.5">
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-2/3" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {times(3, (i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-2.5">
              <Bone className="h-4 w-8" />
              <Bone className="h-2.5 w-14" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-2 border-t py-2">
        <div className="flex items-center gap-1">
          {times(4, (i) => (
            <Bone key={i} className="size-3.5 rounded-full" />
          ))}
          <Bone className="ml-1.5 h-3 w-20" />
        </div>
        <div className="flex gap-1">
          {times(3, (i) => (
            <Bone key={i} className="size-7" />
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

const CardsSkeleton = ({ count }: { count: number }) => (
  <div className={GRID}>{times(count, (i) => <ComicCardSkeleton key={i} wide={i % 2 === 0} />)}</div>
);

/** A world's heading and its button: they come from config/worlds, so they show while comics load */
function WorldHeading({ world, onAdd }: { world: (typeof worlds)[number]; onAdd: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className={cn('text-3xl', displayFontClass[world.display])}>{world.label}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{world.line}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <PlusIcon /> Add to {world.label}
      </Button>
    </div>
  );
}

/* ---------- Page ---------- */

const ALL = 'all';

export default function ComicsManager() {
  const { comics, error, isLoading, isValidating, refresh } = useComics();
  const { run, isPending } = useOptimisticList(refresh);
  const { editor, open, close, closeForSave, reopen } = useEditor<ComicDTO, FormValues>();
  const [tab, setTab] = useState(ALL);
  const [query, setQuery] = useState('');
  /* World a new comic starts in */
  const [newWorld, setNewWorld] = useState<string>();
  const [deleting, setDeleting] = useState<ComicDTO | null>(null);

  const q = query.trim().toLowerCase();
  const matches = (c: ComicDTO) => !q || `${c.name} ${c.shortName} ${c.genre} ${c.hook}`.toLowerCase().includes(q);
  const inWorld = (slug: string) => comics.filter((c) => (slug === NO_WORLD ? !c.worldSlug || !worldOf(c.worldSlug) : c.worldSlug === slug));

  const tabs = [
    { value: ALL, label: 'All', count: comics.length },
    ...worlds.map((w) => ({ value: w.slug, label: w.label, count: inWorld(w.slug).length })),
    { value: NO_WORLD, label: 'Unassigned', count: inWorld(NO_WORLD).length },
  ];

  const startNew = (world?: string) => {
    setNewWorld(world ?? (tab === ALL ? undefined : tab));
    open();
  };

  /* Every change lands in the list straight away and rolls back if the server says no */

  const onSave = (comic: ComicDTO | undefined, values: FormValues) => {
    /* A double click submits twice: only the first one is sent */
    if (!closeForSave()) return;
    const input = toInput(values);
    const row = toOptimistic(input, comic?.id ?? tempId(), comic);
    void run({
      id: row.id,
      update: (list) => sortRows(comic ? replaceRow(list, row) : [...list, row], 'asc'),
      request: () => (comic ? updateComic(comic.id, input) : createComic(input)),
      onError: (e) => reopen(comic, values, e),
    });
  };

  const onDelete = () => {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    void run({ id, update: (list) => removeRow(list, id), request: () => deleteComic(id), failure: 'Could not delete' });
  };

  const card = (c: ComicDTO) => (
    <ComicCard key={c.id} comic={c} pending={isPending(c.id)} onEdit={() => open(c)} onDelete={() => setDeleting(c)} />
  );

  const editing = editor?.item;

  /* "All" without a search: one section per world, in config/worlds order */
  const grouped = tab === ALL && !q;

  let body: ReactNode;
  if (error) {
    body = (
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Couldn&apos;t load comics</AlertTitle>
        <AlertDescription>
          <p>{error.message}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  } else if (isLoading) {
    /* Same layout the data will fill: world sections when grouped, one grid otherwise */
    body = (
      <Loading label="Loading comics">
        {grouped ? (
          <div className="space-y-12">
            {worlds.map((w) => (
              <section key={w.slug}>
                <WorldHeading world={w} onAdd={() => startNew(w.slug)} />
                <CardsSkeleton count={2} />
              </section>
            ))}
          </div>
        ) : (
          <CardsSkeleton count={3} />
        )}
      </Loading>
    );
  } else if (grouped) {
    const unassigned = inWorld(NO_WORLD);
    body = (
      <div className="space-y-12">
        {worlds.map((w) => {
          const list = inWorld(w.slug);
          return (
            <section key={w.slug}>
              <WorldHeading world={w} onAdd={() => startNew(w.slug)} />
              {list.length ? (
                <div className={GRID}>{list.map(card)}</div>
              ) : (
                <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                  No comics in {w.label} yet.
                </p>
              )}
            </section>
          );
        })}
        {unassigned.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="font-body text-xl font-bold">Unassigned</h2>
              <p className="mt-1 text-sm text-muted-foreground">Not placed in a world yet.</p>
            </div>
            <div className={GRID}>{unassigned.map(card)}</div>
          </section>
        )}
      </div>
    );
  } else {
    const list = (tab === ALL ? comics : inWorld(tab)).filter(matches);
    body = list.length ? (
      <div className={GRID}>{list.map(card)}</div>
    ) : (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <BookOpenIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{q ? 'No comics match.' : 'No comics here yet.'}</p>
          {q ? (
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear search
            </Button>
          ) : (
            <Button onClick={() => startNew()}>
              <PlusIcon /> New comic
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Comics"
        description="Every universe on the site, grouped by the worlds in config/worlds."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => refresh()}>
              <RefreshCwIcon className={cn(isValidating && 'animate-spin')} /> Refresh
            </Button>
            <Button size="lg" onClick={() => startNew()}>
              <PlusIcon /> New comic
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
          <TabsList className="h-auto flex-wrap justify-start">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="flex-none">
                {t.label} <TabCount value={t.count} loading={isLoading} />
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative lg:ml-auto lg:w-72">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, genre, hook"
            className="pl-8"
            aria-label="Search comics"
          />
        </div>
      </div>

      {body}

      {/* Create / edit */}
      <Sheet open={!!editor} onOpenChange={(isOpen) => !isOpen && close()}>
        <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-2xl">
          <SheetHeader className="border-b">
            <SheetTitle className="font-body text-lg font-bold">{editing ? editing.name : 'New comic'}</SheetTitle>
            <SheetDescription>
              {editing
                ? 'Edit the comic page: look, story, gallery and calls to action.'
                : 'Set up a new comic page. Characters and campaigns can link to it once it exists.'}
            </SheetDescription>
          </SheetHeader>
          {editor && (
            <ComicForm
              key={editing?.id ?? `new-${newWorld}`}
              comic={editing}
              world={newWorld}
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
            <AlertDialogTitle className="font-body font-bold">Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The comic and its gallery are removed for good.
              {deleting && deleting.counts.characters > 0 &&
                ` ${deleting.counts.characters} character${deleting.counts.characters === 1 ? '' : 's'} will be unlinked from it but kept.`}
              {deleting && deleting.counts.campaigns > 0 &&
                ` ${deleting.counts.campaigns} campaign${deleting.counts.campaigns === 1 ? '' : 's'} will lose the link.`}
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
