import { useEffect } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ApplicationStatus, UserRole } from '../../types';
import { STATUS_LABELS } from '../../types';

// ── Button ─────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-paper hover:bg-brand-800 border border-brand-800',
  secondary: 'bg-slate-900 text-paper hover:bg-slate-800 border border-slate-900',
  danger: 'bg-wine text-paper hover:bg-wine/90 border border-wine',
  ghost: 'text-slate-600 hover:bg-slate-200/60 border border-transparent',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900',
};

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-md border border-line bg-white', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
      <div>
        <h3 className="font-display text-[15px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Badge — squared tag with hairline border ───────────────────
type Tone = 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'violet' | 'indigo';

const tones: Record<Tone, string> = {
  green: 'bg-brand-50 text-brand-800 border-brand-200',
  red: 'bg-wine-tint text-wine border-wine/30',
  amber: 'bg-clay-tint text-clay border-clay/30',
  blue: 'bg-slate-100 text-slate-700 border-slate-300',
  slate: 'bg-paper-deep text-slate-600 border-slate-300',
  violet: 'bg-slate-100 text-slate-700 border-slate-300',
  indigo: 'bg-brand-50 text-brand-800 border-brand-200',
};

export function Badge({ tone = 'slate', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

// Status: quiet tag with a small status dot — reads like a real ops tool
const statusDots: Record<ApplicationStatus, string> = {
  applied: 'bg-slate-400',
  under_review: 'bg-clay',
  shortlisted: 'bg-brand-400',
  interview_scheduled: 'bg-slate-900',
  selected: 'bg-brand-600',
  rejected: 'bg-wine',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-700">
      <span className={clsx('h-1.5 w-1.5 rounded-full', statusDots[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

const roleLabels: Record<UserRole, string> = { student: 'Student', coordinator: 'Coordinator', admin: 'Admin' };

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-slate-300 bg-paper-deep px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-600">
      {roleLabels[role]}
    </span>
  );
}

// ── Form fields ────────────────────────────────────────────────
interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1 block">{label}</span>
      <input className={clsx('input-base', error && 'border-wine focus:border-wine focus:ring-wine', className)} {...rest} />
      {error ? <span className="mt-1 block text-xs text-wine">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Select({ label, error, className, children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1 block">{label}</span>
      <select className={clsx('input-base', className)} {...rest}>
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-wine">{error}</span>}
    </label>
  );
}

export function Textarea({ label, error, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1 block">{label}</span>
      <textarea className={clsx('input-base', className)} rows={4} {...rest} />
      {error && <span className="mt-1 block text-xs text-wine">{error}</span>}
    </label>
  );
}

// ── Modal ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <div className={clsx('relative my-8 w-full rounded-md border border-line bg-white shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')} role="dialog" aria-modal>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-[15px] font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-sm px-1.5 py-0.5 font-mono text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            ESC
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ── Misc ───────────────────────────────────────────────────────
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <Loader2 size={22} className="animate-spin text-brand-600" />
      {label && <p className="font-mono text-xs uppercase tracking-[0.09em]">{label}</p>}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx('h-1.5 w-full overflow-hidden rounded-sm bg-slate-200', className)}>
      <div
        className="h-full rounded-sm bg-brand-600 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <div>
        <p className="font-display text-lg font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="min-w-0">
        <p className="label-mono">{label}</p>
        <p className="mt-1 font-display text-[28px] font-semibold leading-none text-slate-900">{value}</p>
        {hint && <p className="mt-1.5 truncate text-xs text-slate-500">{hint}</p>}
      </div>
      {icon && <div className="ml-3 shrink-0 text-slate-300">{icon}</div>}
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 border-b border-line pb-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Pagination({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between font-mono text-xs text-slate-500">
      <span>
        Page {page} / {pages} · {total} result{total === 1 ? '' : 's'}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
