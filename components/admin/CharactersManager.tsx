'use client';

import Image from 'next/image';
import { useDeferredValue, useState } from 'react';
import { Controller, useForm, useWatch, type RegisterOptions } from 'react-hook-form';
import {
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react';
import { useComics } from '@/hooks/useComics';
import { createCharacter, deleteCharacter, updateCharacter, useCharacters } from '@/hooks/useCharacters';
import type { CharacterDTO, CharacterInput } from '@/lib/characters/types';
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
import { Bone, Loading, PageHeader, Saving, times } from './ui';
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
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const ALL = 'all';

/* ---------- Small pieces ---------- */

/** A comic tag in that comic's own colours */
function ComicBadge({ slug, className }: { slug: string; className?: string }) {
  const comic = useComics().bySlug(slug);
  if (!comic) return <Badge variant="outline">{slug}</Badge>;
  return (
    <Badge
      className={cn('border-transparent', className)}
      style={{ backgroundColor: comic.palette.accent, color: comic.palette.ink }}
    >
      {comic.shortName}
    </Badge>
  );
}

/* ---------- Form ---------- */

type FormValues = {
  name: string;
  alias: string;
  role: string;
  power: string;
  copy: string;
  image: string;
  sortOrder: string;
  comics: string[];
};

const toFormValues = (c?: CharacterDTO, comic?: string): FormValues => ({
  name: c?.name ?? '',
  alias: c?.alias ?? '',
  role: c?.role ?? '',
  power: c?.power ?? '',
  copy: c?.copy ?? '',
  image: c?.image ?? '',
  sortOrder: String(c?.sortOrder ?? 0),
  /* A new character starts in the comic currently filtered on */
  comics: c?.comics ?? (comic ? [comic] : []),
});

const toInput = (v: FormValues): CharacterInput => ({
  name: v.name,
  alias: v.alias || null,
  role: v.role,
  power: v.power || null,
  copy: v.copy,
  image: v.image,
  sortOrder: Number(v.sortOrder) || 0,
  comics: v.comics,
});

/** The row to show until the server answers */
const toOptimistic = (input: CharacterInput, id: string, current?: CharacterDTO): CharacterDTO => {
  const now = new Date().toISOString();
  return {
    id,
    name: input.name,
    alias: input.alias ?? null,
    copy: input.copy,
    power: input.power ?? null,
    role: input.role,
    image: input.image,
    sortOrder: input.sortOrder ?? 0,
    comics: input.comics,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
};

function CharacterForm({
  character,
  comic,
  rejected,
  onSave,
  onCancel,
}: {
  character?: CharacterDTO;
  comic?: string;
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
  } = useForm<FormValues>({ defaultValues: rejected?.values ?? toFormValues(character, comic) });
  useRejectedErrors(rejected, setError);

  const image = useWatch({ control, name: 'image' });
  const { comics, isLoading: comicsLoading } = useComics();

  const onSubmit = handleSubmit(onSave);

  /** Wires an input to the form and marks it invalid for the field styles */
  type TextField = Exclude<keyof FormValues, 'comics'>;
  const field = (name: TextField, rules?: RegisterOptions<FormValues, TextField>) => ({
    id: name,
    'aria-invalid': !!errors[name],
    ...register(name, rules),
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
            <div className="flex gap-4">
              <div className="relative aspect-3/4 w-32 shrink-0 overflow-hidden rounded-xl border border-dashed bg-muted/30">
                {image ? (
                  // Plain img: the URL can point anywhere while it's being typed
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="size-5" /> Portrait
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input placeholder='Jessica "Jess" Malone' {...field('name', { required: 'Name is required' })} />
                  <FieldError errors={[errors.name]} />
                </Field>
                <Field data-invalid={!!errors.image}>
                  <FieldLabel htmlFor="image">Image URL</FieldLabel>
                  <Input placeholder="https://… or /assets/…" {...field('image', { required: 'Image is required' })} />
                  <FieldError errors={[errors.image]} />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="alias">Alias / codename</FieldLabel>
                <Input placeholder="Viperess" {...field('alias')} />
                <FieldDescription>Optional. Printed above the bio.</FieldDescription>
              </Field>
              <Field data-invalid={!!errors.role}>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Input placeholder="Leader" {...field('role', { required: 'Role is required' })} />
                <FieldError errors={[errors.role]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="power">Power</FieldLabel>
              <Input placeholder="Venomous bite" {...field('power')} />
            </Field>

            <Field data-invalid={!!errors.copy}>
              <FieldLabel htmlFor="copy">Bio</FieldLabel>
              <Textarea className="min-h-32" {...field('copy', { required: 'Bio is required' })} />
              <FieldError errors={[errors.copy]} />
            </Field>

            {/* Comics: one character can be in several */}
            <Controller
              control={control}
              name="comics"
              rules={{ validate: (v) => v.length > 0 || 'Pick at least one comic' }}
              render={({ field: { value, onChange } }) => (
                <FieldSet data-invalid={!!errors.comics}>
                  <FieldLegend variant="label">Comics</FieldLegend>
                  <FieldDescription>Pick every comic this character appears in.</FieldDescription>
                  {!comicsLoading && comics.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No comics yet. Create one on the Comics page first.
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {comics.map((u) => {
                      const checked = value.includes(u.slug);
                      return (
                        <FieldLabel key={u.slug} htmlFor={`comic-${u.slug}`}>
                          <Field orientation="horizontal">
                            <Checkbox
                              id={`comic-${u.slug}`}
                              checked={checked}
                              disabled={isSubmitting}
                              onCheckedChange={(on) =>
                                onChange(on ? [...value, u.slug] : value.filter((slug) => slug !== u.slug))
                              }
                            />
                            <FieldContent>
                              <FieldTitle>
                                <span className="size-2.5 rounded-full" style={{ backgroundColor: u.palette.accent }} />
                                {u.name}
                              </FieldTitle>
                              <FieldDescription className="text-xs">{u.genre.replace('[PLACEHOLDER] ', '')}</FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                      );
                    })}
                  </div>
                  <FieldError errors={[errors.comics]} />
                </FieldSet>
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
          <Button type="submit">{character ? 'Save changes' : 'Add character'}</Button>
        </SheetFooter>
      </fieldset>
    </form>
  );
}

/* ---------- Views ---------- */

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6';

type ViewProps = {
  characters: CharacterDTO[];
  /** True while a character's change is with the server; its card is locked until then */
  isPending: (id: string) => boolean;
  onEdit: (c: CharacterDTO) => void;
  onDelete: (c: CharacterDTO) => void;
};

function CharacterGrid({ characters, isPending, onEdit, onDelete }: ViewProps) {
  const { bySlug } = useComics();
  return (
    <div className={GRID}>
      {characters.map((c) => {
        const accent = bySlug(c.comics[0])?.palette.accent;
        const pending = isPending(c.id);
        return (
          <Card key={c.id} inert={pending} className={cn('group gap-0 py-0', pending && 'opacity-60')}>
            <button type="button" onClick={() => onEdit(c)} className="relative aspect-3/4 overflow-hidden text-left">
              <Image
                src={c.image}
                alt={c.name}
                fill
                unoptimized
                sizes="(min-width: 1536px) 16vw, (min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
              <span className="absolute inset-x-3 top-3 flex flex-wrap gap-1">
                {c.comics.map((slug) => (
                  <ComicBadge key={slug} slug={slug} />
                ))}
              </span>
              <span className="absolute inset-x-3 bottom-3">
                {c.alias && (
                  <span className="block text-[11px] uppercase tracking-[0.15em]" style={{ color: accent }}>
                    {c.alias}
                  </span>
                )}
                <span className="block text-sm font-bold leading-tight text-white">{c.name}</span>
              </span>
            </button>
            <CardContent className="flex items-start gap-2 p-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-xs text-muted-foreground">{c.role}</p>
                {c.power && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <ZapIcon className="size-3 shrink-0" /> {c.power}
                  </p>
                )}
              </div>
              {pending ? (
                <Saving label="" className="h-6" />
              ) : (
                <div className="flex shrink-0 gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon-xs" aria-label="Edit" onClick={() => onEdit(c)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(c)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TableHeadings() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="pl-4">Character</TableHead>
        <TableHead>Comics</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Power</TableHead>
        <TableHead className="pr-4 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function CharacterTable({ characters, isPending, onEdit, onDelete }: ViewProps) {
  return (
    <Card className="py-0">
      <Table className="min-w-200">
        <TableHeadings />
        <TableBody>
          {characters.map((c) => {
            const pending = isPending(c.id);
            return (
              <TableRow key={c.id} inert={pending} className={cn(pending && 'opacity-60')}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image src={c.image} alt="" fill sizes="40px" className="object-cover" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      {c.alias && <p className="truncate text-xs text-muted-foreground">{c.alias}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.comics.map((slug) => (
                      <ComicBadge key={slug} slug={slug} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.role}</TableCell>
                <TableCell className="text-muted-foreground">{c.power ?? '—'}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-1">
                    {pending ? (
                      <Saving className="h-7" />
                    ) : (
                      <>
                        <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => onEdit(c)}>
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(c)}
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
    </Card>
  );
}

/* ---------- Skeletons: same frames as the views, so nothing jumps when the data lands ---------- */

function GridSkeleton() {
  return (
    <Loading label="Loading characters" className={GRID}>
      {times(12, (i) => (
        <Card key={i} className="gap-0 py-0">
          <div className="relative aspect-3/4">
            <Bone className="absolute inset-0 rounded-none" />
            <Bone className="absolute left-3 top-3 h-4 w-14 rounded-full" />
            <div className="absolute inset-x-3 bottom-3 space-y-1.5">
              <Bone className="h-2.5 w-1/3" />
              <Bone className={cn('h-3.5', i % 3 ? 'w-3/4' : 'w-1/2')} />
            </div>
          </div>
          <CardContent className="flex items-start gap-2 p-3">
            <div className="flex-1 space-y-1.5 py-0.5">
              <Bone className="h-3 w-1/2" />
              <Bone className="h-3 w-2/3" />
            </div>
            <Bone className="size-6" />
            <Bone className="size-6" />
          </CardContent>
        </Card>
      ))}
    </Loading>
  );
}

function TableSkeleton() {
  return (
    <Loading label="Loading characters">
      <Card className="py-0">
        <Table className="min-w-200">
          <TableHeadings />
          <TableBody>
            {times(8, (i) => (
              <TableRow key={i} className="hover:bg-transparent">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Bone className="size-10 shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <Bone className={cn('h-3.5', i % 2 ? 'w-28' : 'w-40')} />
                      <Bone className="h-3 w-16" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Bone className="h-5 w-16 rounded-full" />
                    {i % 3 === 0 && <Bone className="h-5 w-14 rounded-full" />}
                  </div>
                </TableCell>
                <TableCell>
                  <Bone className="h-3.5 w-20" />
                </TableCell>
                <TableCell>
                  <Bone className="h-3.5 w-28" />
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    <Bone className="size-7" />
                    <Bone className="size-7" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Loading>
  );
}

/* ---------- Page ---------- */

export default function CharactersManager() {
  const [comic, setComic] = useState(ALL);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { editor, open, close, closeForSave, reopen } = useEditor<CharacterDTO, FormValues>();
  const [deleting, setDeleting] = useState<CharacterDTO | null>(null);
  const { comics, bySlug } = useComics();
  const comicFilterItems: Record<string, string> = {
    [ALL]: 'All comics',
    ...Object.fromEntries(comics.map((c) => [c.slug, c.name])),
  };

  /* Search goes to the API too; deferring it keeps typing smooth while the list catches up */
  const q = useDeferredValue(query.trim());
  const { characters, error, isLoading, isValidating, refresh } = useCharacters({
    comic: comic === ALL ? undefined : comic,
    q: q || undefined,
  });
  const { run, isPending } = useOptimisticList(refresh);

  const filtered = comic !== ALL || !!q;

  /** Same filter the API applies, so an optimistic row only shows if the server would list it */
  const inView = (c: CharacterDTO) =>
    (comic === ALL || c.comics.includes(comic)) &&
    (!q || [c.name, c.alias, c.role, c.power].some((v) => v?.toLowerCase().includes(q.toLowerCase())));

  /* Every change lands in the list straight away and rolls back if the server says no */

  const onSave = (character: CharacterDTO | undefined, values: FormValues) => {
    /* A double click submits twice: only the first one is sent */
    if (!closeForSave()) return;
    const input = toInput(values);
    const row = toOptimistic(input, character?.id ?? tempId(), character);
    void run({
      id: row.id,
      update: (list) => {
        const next = character ? replaceRow(list, row) : [...list, row];
        return sortRows(inView(row) ? next : removeRow(next, row.id), 'asc');
      },
      request: () => (character ? updateCharacter(character.id, input) : createCharacter(input)),
      onError: (e) => reopen(character, values, e),
    });
  };

  const onDelete = () => {
    if (!deleting) return;
    const { id } = deleting;
    setDeleting(null);
    void run({ id, update: (list) => removeRow(list, id), request: () => deleteCharacter(id), failure: 'Could not delete' });
  };

  const editing = editor?.item;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Characters"
        description="Everyone across the comics. A character can appear in more than one comic."
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => refresh()}>
              <RefreshCwIcon className={cn(isValidating && 'animate-spin')} /> Refresh
            </Button>
            <Button size="lg" onClick={() => open()}>
              <PlusIcon /> New character
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <Select items={comicFilterItems} value={comic} onValueChange={(v) => setComic(v ?? ALL)}>
          <SelectTrigger className="w-full md:w-56" aria-label="Filter by comic">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(comicFilterItems).map(([slug, name]) => (
              <SelectItem key={slug} value={slug}>
                {slug !== ALL && (
                  <span className="size-2 rounded-full" style={{ backgroundColor: bySlug(slug)?.palette.accent }} />
                )}
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative md:w-72">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, alias, role, power"
            className="pl-8"
            aria-label="Search characters"
          />
        </div>

        <p className="text-sm text-muted-foreground md:ml-auto">
          {isLoading ? (
            <Bone className="h-3.5 w-24" />
          ) : (
            `${characters.length} character${characters.length === 1 ? '' : 's'}`
          )}
        </p>

        <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list')}>
          <TabsList>
            <TabsTrigger value="grid" aria-label="Grid view">
              <LayoutGridIcon />
            </TabsTrigger>
            <TabsTrigger value="list" aria-label="List view">
              <ListIcon />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t load characters</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        view === 'grid' ? (
          <GridSkeleton />
        ) : (
          <TableSkeleton />
        )
      ) : characters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UsersIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filtered ? 'No characters match these filters.' : 'No characters yet.'}
            </p>
            {filtered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setComic(ALL);
                  setQuery('');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => open()}>
                <PlusIcon /> New character
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <CharacterGrid characters={characters} isPending={isPending} onEdit={open} onDelete={setDeleting} />
      ) : (
        <CharacterTable characters={characters} isPending={isPending} onEdit={open} onDelete={setDeleting} />
      )}

      {/* Create / edit */}
      <Sheet open={!!editor} onOpenChange={(isOpen) => !isOpen && close()}>
        <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle className="font-body text-lg font-bold">{editing ? editing.name : 'New character'}</SheetTitle>
            <SheetDescription>
              {editing
                ? 'Edit the character and the comics they appear in.'
                : 'Add a character and pick the comics they appear in.'}
            </SheetDescription>
          </SheetHeader>
          {editor && (
            <CharacterForm
              key={editing?.id ?? 'new'}
              character={editing}
              comic={comic === ALL ? undefined : comic}
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
            <AlertDialogTitle className="font-body font-bold">Delete this character?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be removed from{' '}
              {deleting && deleting.comics.length > 1 ? `all ${deleting.comics.length} comics` : 'their comic'}. This
              can&apos;t be undone.
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
