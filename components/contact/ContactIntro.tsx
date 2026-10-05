'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FrameButton } from '@/components/shared/FrameButton'; // adjust path
import { SectionIntro, flicker } from '@/components/shared/SectionIntro'; // adjust path

const ease: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* The one address the live site publishes */
export const CONTACT_EMAIL = 'info@huxleysaga.com';

/* Where the form posts. Swap for your route, Formspree, Resend, etc. */
const CONTACT_ENDPOINT = '/api/contact';

const MESSAGE_MAX = 2000;

/* Placeholder copy: swap in your real text */
const topics = [
  { id: 'Press', hint: 'Interviews, features, press assets' },
  { id: 'Licensing', hint: 'Film, games, collaborations' },
  { id: 'Wholesale', hint: 'Stockists and bulk orders' },
  { id: 'Orders', hint: 'Shipping, returns, order issues' },
  { id: 'Other', hint: 'Anything else' },
] as const;
type Topic = (typeof topics)[number]['id'];

/* Placeholder facts: swap in your real details */
const details: { label: string; value: string }[] = [
  { label: 'Response time', value: 'Within 2 business days' },
  { label: 'Order issues', value: 'Include your order number' },
];

/* Placeholder links: swap in your real profiles */
const socials: { label: string; href: string }[] = [
  { label: 'Instagram', href: '#' },
  { label: 'X / Twitter', href: '#' },
  { label: 'YouTube', href: '#' },
];

type Status = 'idle' | 'sending' | 'sent' | 'error';
type Fields = { name: string; email: string; topic: Topic; message: string; website: string };
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

const emptyFields: Fields = { name: '', email: '', topic: 'Press', message: '', website: '' };

function validate(f: Fields): FieldErrors {
  const errors: FieldErrors = {};
  if (!f.name.trim()) errors.name = 'Tell us who you are';
  if (!f.email.trim()) errors.email = 'We need an address to reply to';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'That address looks off';
  if (f.message.trim().length < 10) errors.message = 'A little more detail, please (10+ characters)';
  return errors;
}

/** Pre-filled mailto, so a failed send never loses what someone wrote. */
function mailtoFor(f: Fields) {
  const subject = `[${f.topic}] ${f.name.trim() || 'Website enquiry'}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(f.message)}`;
}

const panel = 'border border-white/10 bg-neutral-950 p-3.5 text-white lg:p-6';
const label = 'text-[10px] tracking-widest text-white/40 sm:text-[11px]';
const input =
  'w-full border-b border-white/15 bg-transparent pb-2 pt-1 font-sans text-base normal-case tracking-normal text-white outline-none transition-colors placeholder:text-white/25 focus:border-white aria-[invalid=true]:border-red-400';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

/** Contact: the address and everything around it on the left, the form on the right. */
export default function ContactIntro() {
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    email: `${uid}-email`,
    message: `${uid}-message`,
    website: `${uid}-website`,
  };

  const [copied, setCopied] = useState(false);
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [lastSent, setLastSent] = useState<Fields | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the confirmation on its own so the button doesn't stay stuck on "Copied"
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure origin, or the visitor said no): the address is on screen anyway
    }
  };

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Drop a field's error as soon as it's being fixed
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (status === 'error') setStatus('idle');
  };

  /* Clicking a topic on the left picks it in the form and drops the cursor in the message */
  const pickTopic = (topic: Topic) => {
    set('topic', topic);
    if (status === 'sent') setStatus('idle');
    const message = document.getElementById(ids.message);
    message?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    message?.focus({ preventScroll: true });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    const found = validate(fields);
    setErrors(found);
    const firstInvalid = (['name', 'email', 'message'] as const).find((key) => found[key]);
    if (firstInvalid) {
      document.getElementById(ids[firstInvalid])?.focus();
      return;
    }

    // Honeypot: real people never see this field, bots fill it. Pretend it worked.
    if (fields.website) {
      setStatus('sent');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          topic: fields.topic,
          message: fields.message.trim(),
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setLastSent(fields);
      setFields(emptyFields);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  const remaining = MESSAGE_MAX - fields.message.length;

  return (
    <section className="px-3 font-heading uppercase">
      <SectionIntro
        title="Contact"
        /* Placeholder copy: swap in your real text */
        text="One inbox for everything: press, licensing, wholesale and orders. Pick a topic, write to us, and it reaches the right person faster."
      />

      <div className="mt-12 grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ───────────── Left: the address and everything around it ───────────── */}
        <div className="grid content-start gap-3">
          {/* Email */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className={panel}
          >
            <motion.p variants={flicker} custom={0} className={label}>
              Email
            </motion.p>

            <motion.p variants={flicker} custom={0.1} className="mt-4 break-all">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[clamp(1.25rem,2.6vw,2.25rem)] leading-none tracking-wide transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {CONTACT_EMAIL}
              </a>
            </motion.p>

            <motion.div variants={flicker} custom={0.2} className="mt-8 flex gap-3">
              <FrameButton href={`mailto:${CONTACT_EMAIL}`} className="flex-1">
                Send email
              </FrameButton>
              <FrameButton onClick={copy} className="flex-1">
                {copied ? 'Copied' : 'Copy address'}
              </FrameButton>
            </motion.div>

            {/* Announced to screen readers without moving anything on screen */}
            <p aria-live="polite" className="sr-only">
              {copied ? 'Address copied to clipboard' : ''}
            </p>
          </motion.div>

          {/* Topics: each one pre-selects the form */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className={`${panel} max-md:hidden`}
          >
            <motion.p variants={flicker} custom={0} className={label}>
              What it&apos;s about
            </motion.p>

            <ul className="mt-4">
              {topics.map((topic, i) => {
                const active = fields.topic === topic.id;
                return (
                  <motion.li key={topic.id} variants={flicker} custom={0.05 * i} className="border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => pickTopic(topic.id)}
                      aria-pressed={active}
                      className="group flex w-full items-baseline justify-between gap-4 py-3 text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className={`text-[10px] tabular-nums ${active ? 'text-white' : 'text-white/30'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className={`text-lg leading-none transition-opacity ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                          {topic.id}
                        </span>
                      </span>
                      <span className="hidden text-right text-[10px] tracking-widest text-white/40 sm:inline sm:text-[11px]">
                        {topic.hint}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>

          {/* Details + socials */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className={panel}
          >
            <motion.dl variants={flicker} custom={0} className="grid gap-6 sm:grid-cols-2">
              {details.map((d) => (
                <div key={d.label} className="border-t border-white/10 pt-3">
                  <dt className={label}>{d.label}</dt>
                  <dd className="mt-2 text-[clamp(1rem,1.6vw,1.25rem)] leading-tight">{d.value}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div variants={flicker} custom={0.15} className="mt-8 border-t border-white/10 pt-3">
              <p className={label}>Elsewhere</p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      {s.label} <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* ───────────── Right: the form ───────────── */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="relative border border-white/10"
        >
          {/* Clip on the inner layer, never on the watched element, or it never reveals */}
          <motion.div
            variants={{
              hidden: { clipPath: 'inset(0% 0% 100% 0%)' },
              show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.1, ease } },
            }}
            className="h-full bg-neutral-950 p-3.5 text-white lg:p-6"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === 'sent' ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.3, ease } }}
                  className="flex min-h-[420px] flex-col justify-between"
                >
                  <div>
                    <p className={label}>Message received</p>
                    <p className="mt-4 text-[clamp(1.5rem,3vw,2.75rem)] leading-none">
                      Thanks{lastSent?.name ? `, ${lastSent.name.trim().split(' ')[0]}` : ''}.
                    </p>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
                      It&apos;s with the {lastSent?.topic ?? 'right'} team. Expect a reply at{' '}
                      <span className="normal-case text-white">{lastSent?.email}</span> within two business days.
                    </p>
                  </div>
                  <div className="mt-10 lg:max-w-[220px]">
                    <FrameButton onClick={() => setStatus('idle')} className="w-full">
                      Send another
                    </FrameButton>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  ref={formRef}
                  onSubmit={submit}
                  noValidate
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.4 } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  aria-busy={status === 'sending'}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-baseline justify-between">
                    <p className={label}>Write to us</p>
                    <p className={label}>All fields required</p>
                  </div>

                  {/* Topic */}
                  <fieldset className="mt-6">
                    <legend className={label}>Topic</legend>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <label key={topic.id} className="cursor-pointer">
                          <input
                            type="radio"
                            name="topic"
                            value={topic.id}
                            checked={fields.topic === topic.id}
                            onChange={() => set('topic', topic.id)}
                            className="peer sr-only"
                          />
                          <span className="block border border-white/20 px-3 py-1.5 text-[11px] tracking-widest text-white/60 transition-colors hover:border-white/50 hover:text-white peer-checked:border-white peer-checked:bg-white peer-checked:text-black peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                            {topic.id}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <Field id={ids.name} label="Name" error={errors.name}>
                      <input
                        id={ids.name}
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        value={fields.name}
                        onChange={(e) => set('name', e.target.value)}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? `${ids.name}-error` : undefined}
                        className={input}
                      />
                    </Field>

                    <Field id={ids.email} label="Email" error={errors.email}>
                      <input
                        id={ids.email}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={fields.email}
                        onChange={(e) => set('email', e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? `${ids.email}-error` : undefined}
                        className={input}
                      />
                    </Field>
                  </div>

                  <div className="mt-8 flex-1">
                    <Field
                      id={ids.message}
                      label="Message"
                      error={errors.message}
                      aside={
                        <span className={remaining < 100 ? 'text-white' : undefined} aria-hidden>
                          {fields.message.length}/{MESSAGE_MAX}
                        </span>
                      }
                    >
                      <textarea
                        id={ids.message}
                        name="message"
                        rows={6}
                        maxLength={MESSAGE_MAX}
                        placeholder={
                          fields.topic === 'Orders'
                            ? 'Your order number and what went wrong'
                            : 'What can we help with?'
                        }
                        value={fields.message}
                        onChange={(e) => set('message', e.target.value)}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? `${ids.message}-error` : undefined}
                        className={`${input} min-h-[160px] resize-y`}
                      />
                    </Field>
                  </div>

                  {/* Honeypot: hidden from people and screen readers, catnip for bots */}
                  <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor={ids.website}>Website</label>
                    <input
                      id={ids.website}
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={fields.website}
                      onChange={(e) => set('website', e.target.value)}
                    />
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] tracking-widest text-white/40 sm:text-[11px]">
                      Sends to <span className="normal-case text-white/70">{CONTACT_EMAIL}</span>
                    </p>
                    <div className="sm:w-[220px]">
                      {/* FrameButton must forward `type` and `disabled` to its <button> */}
                      <FrameButton disabled={status === 'sending'} className="w-full">
                        {status === 'sending' ? 'Sending…' : 'Send message'}
                      </FrameButton>
                    </div>
                  </div>

                  {status === 'error' && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 border border-red-400/40 bg-red-400/5 p-3 text-[11px] leading-relaxed tracking-widest text-red-300"
                    >
                      That didn&apos;t go through. Nothing is lost:{' '}
                      <a href={mailtoFor(fields)} className="underline underline-offset-4 hover:text-white">
                        send it by email instead
                      </a>
                      .
                    </motion.p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

            {/* One place screen readers hear about sending */}
            <p aria-live="polite" className="sr-only">
              {status === 'sending' ? 'Sending message' : status === 'sent' ? 'Message sent' : ''}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/** Label above, error below, optional counter on the right. */
function Field({
  id,
  label: text,
  error,
  aside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={label}>
          {text}
        </label>
        {aside && <span className={label}>{aside}</span>}
      </div>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[10px] tracking-widest text-red-300 sm:text-[11px]">
          {error}
        </p>
      )}
    </div>
  );
}