import Link from 'next/link';
import { ArrowRightIcon, LockIcon, MailIcon } from 'lucide-react';
import { SITE_NAME } from '@/config';
import LoginArt from '@/components/admin/LoginArt';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

/* Design only: no authentication yet, the form simply opens the dashboard */
export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <LoginArt />

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">N</span>
            <div className="leading-tight">
              <p className="font-bold tracking-wide">{SITE_NAME}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin panel</p>
            </div>
          </div>

          <h1 className="text-4xl tracking-wide">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage comics, characters and campaigns.</p>

          <form action="/admin" className="mt-8">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@studio.com" autoComplete="email" className="h-10 pl-8" />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-10 pl-8"
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <Checkbox id="remember" />
                <FieldLabel htmlFor="remember" className="font-normal">
                  Keep me signed in
                </FieldLabel>
              </Field>

              <Button type="submit" size="lg" className="h-10 w-full">
                Sign in <ArrowRightIcon />
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Not an admin?{' '}
            <Link href="/" className="text-foreground/70 underline-offset-4 hover:text-foreground hover:underline">
              Back to the site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
