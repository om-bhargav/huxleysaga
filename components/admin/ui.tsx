import type { ReactNode } from 'react';
import { LoaderCircleIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** Title row at the top of every admin page */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-3xl tracking-wide uppercase md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Loading ---------- */

/**
 * One skeleton shape. A span, so it can sit inside buttons, badges and table cells;
 * tinted from the foreground so it shows on cards in both themes. Size it with h-/w- classes.
 */
export function Bone({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-md bg-foreground/10', className)} />;
}

/** Wraps a skeleton so screen readers hear "Loading …" once instead of nothing */
export function Loading({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy aria-label={label} className={className}>
      {children}
    </div>
  );
}

/** Rows for a placeholder list: `times(4, (i) => …)` */
export const times = <T,>(count: number, render: (i: number) => T) => Array.from({ length: count }, (_, i) => render(i));

/** The count after a tab label, or a skeleton until there's data */
export function TabCount({ value, loading }: { value: number; loading?: boolean }) {
  return loading ? (
    <Bone className="h-3 w-4" />
  ) : (
    <span className="text-muted-foreground tabular-nums">{value}</span>
  );
}

/** Shown on a row or card while its change is with the server */
export function Saving({ label = 'Saving…', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <LoaderCircleIcon className="size-3.5 animate-spin" />
      {label}
    </span>
  );
}

/* ---------- Stats ---------- */

/** A headline number. With `loading`, the number and hint are skeletons and the label stays. */
export function Stat({
  label,
  value,
  hint,
  Icon,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint: ReactNode;
  Icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card aria-busy={loading}>
      <CardHeader>
        <CardDescription className="text-xs uppercase tracking-[0.15em]">{label}</CardDescription>
        <CardTitle className="font-body text-3xl font-bold tabular-nums">
          {loading ? <Bone className="my-0.5 h-8 w-28" /> : value}
        </CardTitle>
        <CardAction>
          <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {loading ? <Bone className="my-0.5 h-3 w-36" /> : hint}
      </CardContent>
    </Card>
  );
}
