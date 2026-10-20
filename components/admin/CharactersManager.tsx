'use client';

import Image from 'next/image';
import { useDeferredValue, useState } from 'react';
import { Controller, useForm, useWatch, type RegisterOptions } from 'react-hook-form';
import { toast } from 'sonner';
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
import { ApiError } from '@/lib/api/client';
import type { CharacterDTO, CharacterInput } from '@/lib/characters/types';
import { cn } from '@/lib/utils';
import { PageHeader } from './ui';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const ALL = 'all';

const message = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

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

function CharacterForm({ character, comic, onDone }: { character?: CharacterDTO; comic?: string; onDone: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toFormValues(character, comic) });

  const image = useWatch({ control, name: 'image' });
  const { comics, isLoading: comicsLoading } = useComics();

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const input = toInput(values);
      const result = character ? await updateCharacter(character.id, input) : await createCharacter(input);
      toast.success(result.message);
      onDone();
    } catch (error) {
      if (error instanceof ApiError) {
        /* 422s carry field errors in `data`: put each one under its input */
        const fields = (error.data ?? {}) as Partial<Record<keyof FormValues, string[]>>;
        Object.entries(fields).forEach(([name, messages]) =>
          setError(name as keyof FormValues, { message: messages?.[0] }),
        );
      }
      setServerError(message(error, 'Could not reach the server'));
    }
  });

  /** Wires an input to the form and marks it invalid for the field styles */
  type TextField = Exclude<keyof FormValues, 'comics'>;
  const field = (name: TextField, rules?: RegisterOptions<FormValues, TextField>) => ({
    id: name,
    'aria-invalid': !!errors[name],
    ...register(name, rules),
  });

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4" data-lenis-prevent>
        {serverError && (
          <Alert variant="destructive" className="mb-5">
            <TriangleAlertIcon />
            <AlertTitle>Couldn&apos;t save</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
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
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : character ? 'Save changes' : 'Add character'}
        </Button>
      </SheetFooter>
    </form>
  );
}

/* ---------- Views ---------- */

function CharacterGrid({
  characters,
  onEdit,
  onDelete,
}: {
  characters: CharacterDTO[];
  onEdit: (c: CharacterDTO) => void;
  onDelete: (c: CharacterDTO) => void;
}) {
  const { bySlug } = useComics();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {characters.map((c) => {
        const accent = bySlug(c.comics[0])?.palette.accent;
        return (
          <Card key={c.id} className="group gap-0 py-0">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CharacterTable({
  characters,
  onEdit,
  onDelete,
}: {
  characters: CharacterDTO[];
  onEdit: (c: CharacterDTO) => void;
  onDelete: (c: CharacterDTO) => void;
}) {
  return (
    <Card className="py-0">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Character</TableHead>
            <TableHead>Comics</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Power</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.map((c) => (
            <TableRow key={c.id}>
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
                <div className="flex justify-end gap-1">
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* ---------- Page ---------- */

export default function CharactersManager() {
  const [comic, setComic] = useState(ALL);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  /* undefined = sheet closed, 'new' = create, otherwise the character being edited */
  const [editing, setEditing] = useState<CharacterDTO | 'new'>();
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

  const filtered = comic !== ALL || !!q;

  const onDelete = async () => {
    if (!deleting) return;
    try {
      const { message: text } = await deleteCharacter(deleting.id);
      toast.success(text);
    } catch (e) {
      toast.error(message(e, 'Could not delete'));
    } finally {
      setDeleting(null);
    }
  };

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
            <Button size="lg" onClick={() => setEditing('new')}>
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
          {isLoading ? 'Loading…' : `${characters.length} character${characters.length === 1 ? '' : 's'}`}
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-3/4 w-full rounded-xl" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
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
              <Button onClick={() => setEditing('new')}>
                <PlusIcon /> New character
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <CharacterGrid characters={characters} onEdit={setEditing} onDelete={setDeleting} />
      ) : (
        <CharacterTable characters={characters} onEdit={setEditing} onDelete={setDeleting} />
      )}

      {/* Create / edit */}
      <Sheet open={!!editing} onOpenChange={(open) => !open && setEditing(undefined)}>
        <SheetContent className="w-full gap-0 data-[side=right]:sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle className="font-body text-lg font-bold">
              {editing && editing !== 'new' ? editing.name : 'New character'}
            </SheetTitle>
            <SheetDescription>
              {editing && editing !== 'new'
                ? 'Edit the character and the comics they appear in.'
                : 'Add a character and pick the comics they appear in.'}
            </SheetDescription>
          </SheetHeader>
          {editing && (
            <CharacterForm
              key={editing === 'new' ? 'new' : editing.id}
              character={editing === 'new' ? undefined : editing}
              comic={comic === ALL ? undefined : comic}
              onDone={() => setEditing(undefined)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
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
