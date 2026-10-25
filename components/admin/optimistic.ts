'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { KeyedMutator } from 'swr';
import { ApiError } from '@/lib/api/client';

/*
 * Admin changes show straight away and are rolled back if the server turns them down.
 * While a change is in flight its row is locked, so the same change can't be sent twice.
 */

export const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** 422 field errors from the API, e.g. { title: ['Title is required'] } */
export const fieldErrors = (error: unknown) =>
  (error instanceof ApiError && error.data ? error.data : {}) as Record<string, string[] | undefined>;

/* ---------- List helpers ---------- */

/* Rows made in the browser before the server has given them an id */
const TEMP = 'temp-';
export const tempId = () => `${TEMP}${crypto.randomUUID()}`;

export const replaceRow = <T extends { id: string }>(rows: T[], row: T) => rows.map((r) => (r.id === row.id ? row : r));
export const removeRow = <T extends { id: string }>(rows: T[], id: string) => rows.filter((r) => r.id !== id);

/** Same order as the API: sortOrder, then creation date */
export const sortRows = <T extends { sortOrder: number; createdAt: string }>(rows: T[], created: 'asc' | 'desc') =>
  [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || (created === 'asc' ? 1 : -1) * a.createdAt.localeCompare(b.createdAt),
  );

/* ---------- Optimistic changes ---------- */

type Change<T, R> = {
  /** The row being changed. It reads as pending until the server answers. */
  id: string;
  /** The list as it looks once the change lands */
  update: (rows: T[]) => T[];
  request: () => Promise<R>;
  /** Toast the server's message when the change lands. Default true. */
  notify?: boolean;
  /** Error toast text when the API gives no message */
  failure?: string;
  /** Called after the rollback instead of the error toast */
  onError?: (error: unknown) => void;
};

/**
 * Optimistic changes to one SWR list. Pass the hook's `refresh`.
 * `run` resolves to true once the server has the change, false if it was rolled back.
 */
export function useOptimisticList<T extends { id: string }>(mutate: KeyedMutator<T[]>) {
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const lock = (id: string, locked: boolean) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (locked) next.add(id);
      else next.delete(id);
      return next;
    });

  const run = async <R extends { message: string }>({
    id,
    update,
    request,
    notify = true,
    failure = 'Something went wrong',
    onError,
  }: Change<T, R>) => {
    lock(id, true);
    let result: R | undefined;
    try {
      await mutate(
        async () => {
          result = await request();
          return undefined;
        },
        {
          /* Build on what's on screen, so changes made back to back stack up */
          optimisticData: (committed, displayed) => update(displayed ?? committed ?? []),
          rollbackOnError: true,
          populateCache: false,
          revalidate: false,
        },
      );
    } catch (error) {
      lock(id, false);
      void mutate();
      if (onError) onError(error);
      else toast.error(errorMessage(error, failure));
      return false;
    }

    if (notify && result) toast.success(result.message);
    try {
      /* SWR ignores refetches made while a change is in flight, so fetch once more to swap
         the optimistic rows (and temp ids) for the server's. The row stays locked until then. */
      await mutate();
    } finally {
      lock(id, false);
    }
    return true;
  };

  return {
    run,
    /** True while the row's change is with the server. Rows with a temp id always are. */
    isPending: (id: string) => pending.has(id) || id.startsWith(TEMP),
  };
}

/* ---------- Editor sheet ---------- */

/** A save the server turned down: what was typed, and why */
export type Rejected<V> = { values: V; error: unknown };

/** What the create/edit sheet is showing. No `item` means a new one. */
export type Editor<I, V> = { item?: I; rejected?: Rejected<V> };

/**
 * State for a create/edit sheet that closes as soon as the form is saved.
 * If the save then fails, `reopen` brings the form back with what was typed and the server's errors,
 * unless another form is open by then, in which case the error toast offers to reopen it.
 */
export function useEditor<I, V>() {
  const [editor, setEditor] = useState<Editor<I, V>>();
  const current = useRef(editor);
  useEffect(() => {
    current.current = editor;
  });

  const reopen = (item: I | undefined, values: V, error: unknown) => {
    const next: Editor<I, V> = { item, rejected: { values, error } };
    const text = `Couldn't save: ${errorMessage(error, 'Could not reach the server')}`;
    if (!current.current) {
      setEditor(next);
      toast.error(text, { description: 'Your changes are back in the form.' });
    } else {
      toast.error(text, { action: { label: 'Reopen', onClick: () => setEditor(next) } });
    }
  };

  /** Closes the sheet for a save. False if it's already closed, so a double submit only sends once. */
  const closeForSave = () => {
    if (!current.current) return false;
    current.current = undefined;
    setEditor(undefined);
    return true;
  };

  return {
    editor,
    open: (item?: I) => setEditor({ item }),
    close: () => setEditor(undefined),
    closeForSave,
    reopen,
  };
}

/** Puts a rejected save's field errors back under their inputs when the form opens again */
export function useRejectedErrors<V extends FieldValues>(rejected: Rejected<V> | undefined, setError: UseFormSetError<V>) {
  useEffect(() => {
    if (!rejected) return;
    Object.entries(fieldErrors(rejected.error)).forEach(([name, messages]) =>
      setError(name as Path<V>, { message: messages?.[0] }),
    );
  }, [rejected, setError]);
}
