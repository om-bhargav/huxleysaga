'use client';

import { createContext, useContext, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ImagePlusIcon, LoaderCircleIcon, UploadIcon } from 'lucide-react';
import type { ApiResponse } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorMessage } from './optimistic';

/*
 * Image uploads for the admin forms. Files go to /api/uploads, which puts them on Cloudinary,
 * and the field ends up holding the Cloudinary URL. Pasting a URL still works the same as before.
 */

/** The Cloudinary folder each admin page uploads to (checked again by /api/uploads) */
export type UploadFolder = 'comics' | 'characters' | 'campaigns' | 'testimonials';

/** Uploads one image and resolves with the URL Cloudinary serves it from */
export async function uploadImage(file: File, folder: UploadFolder) {
  const body = new FormData();
  body.set('file', file);
  body.set('folder', folder);

  const res = await fetch('/api/uploads', { method: 'POST', body });
  const json = (await res.json().catch(() => null)) as ApiResponse<{ url: string }> | null;
  if (!res.ok || !json?.success) throw new Error(json?.message ?? `Upload failed (${res.status})`);
  return json.data!.url;
}

/* ---------- Tracking uploads in a form ---------- */

/* How many uploads are running in the surrounding form, and a way to add one */
const UploadsContext = createContext<{ count: number; track: <T>(work: Promise<T>) => Promise<T> }>({
  count: 0,
  track: (work) => work,
});

/** Wrap a form in this so its Save button can wait for uploads to finish */
export function UploadScope({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const track = async <T,>(work: Promise<T>) => {
    setCount((n) => n + 1);
    try {
      return await work;
    } finally {
      setCount((n) => n - 1);
    }
  };
  return <UploadsContext.Provider value={{ count, track }}>{children}</UploadsContext.Provider>;
}

/** A form's submit button. Disabled while an image is still uploading, so the save can't miss it. */
export function SubmitButton({ children, ...props }: Omit<ComponentProps<typeof Button>, 'type'>) {
  const { count } = useContext(UploadsContext);
  return (
    <Button type="submit" disabled={count > 0} {...props}>
      {count > 0 ? (
        <>
          <LoaderCircleIcon className="animate-spin" /> Uploading…
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Uploads files with toasts for failures, counted by the surrounding UploadScope. Resolves with the URLs that made it. */
function useUploader(folder: UploadFolder) {
  const { track } = useContext(UploadsContext);
  const [busy, setBusy] = useState(false);

  const upload = async (files: File[]) => {
    setBusy(true);
    try {
      const results = await track(Promise.allSettled(files.map((file) => uploadImage(file, folder))));
      const urls: string[] = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') urls.push(result.value);
        else toast.error(`Couldn't upload ${files[i].name}`, { description: errorMessage(result.reason, 'Upload failed') });
      });
      return urls;
    } finally {
      setBusy(false);
    }
  };

  return { upload, busy };
}

/* ---------- Fields ---------- */

/**
 * A URL input with an Upload button beside it. Pick a file and it uploads to Cloudinary,
 * then the input holds the new URL. Wire it up with react-hook-form's Controller.
 */
export function ImageInput({
  id,
  value,
  onChange,
  onBlur,
  folder,
  placeholder = 'Upload, or paste a URL',
  invalid,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  id?: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  onBlur?: () => void;
  folder: UploadFolder;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const { upload, busy } = useUploader(folder);

  const onPick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const [url] = await upload([file]);
    if (url) onChange(url);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        disabled={disabled || busy}
      />
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        disabled={disabled || busy}
        onClick={() => picker.current?.click()}
      >
        {busy ? <LoaderCircleIcon className="animate-spin" /> : <UploadIcon />}
        {busy ? 'Uploading' : 'Upload'}
      </Button>
      <input
        ref={picker}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void onPick(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** Pick several images at once; each one that uploads is handed back, in the order picked */
export function UploadImagesButton({
  folder,
  onUploaded,
  label = 'Upload images',
  disabled,
}: {
  folder: UploadFolder;
  onUploaded: (urls: string[]) => void;
  label?: string;
  disabled?: boolean;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const { upload, busy } = useUploader(folder);

  return (
    <>
      <Button type="button" variant="outline" className="w-fit" disabled={disabled || busy} onClick={() => picker.current?.click()}>
        {busy ? <LoaderCircleIcon className="animate-spin" /> : <ImagePlusIcon />}
        {busy ? 'Uploading…' : label}
      </Button>
      <input
        ref={picker}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (!files.length) return;
          const urls = await upload(files);
          if (urls.length) onUploaded(urls);
        }}
      />
    </>
  );
}
