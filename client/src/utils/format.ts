import { format, formatDistanceToNowStrict } from 'date-fns';

export const fmtDate = (d: string | Date | undefined) =>
  d ? format(new Date(d), 'd MMM yyyy') : '—';

export const fmtDateTime = (d: string | Date | undefined) =>
  d ? format(new Date(d), 'd MMM yyyy, h:mm a') : '—';

export const daysUntil = (d: string | Date): number => {
  const target = new Date(d);
  const today = new Date();
  target.setHours(23, 59, 59, 999);
  return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

export function deadlineLabel(d: string | Date): { text: string; tone: 'red' | 'amber' | 'green' | 'slate' } {
  const days = daysUntil(d);
  if (days < 0) return { text: 'Closed', tone: 'slate' };
  if (days === 0) return { text: 'Closes today', tone: 'red' };
  if (days === 1) return { text: 'Closes tomorrow', tone: 'red' };
  if (days <= 3) return { text: `Closes in ${days} days`, tone: 'red' };
  if (days <= 7) return { text: `Closes in ${days} days`, tone: 'amber' };
  return { text: `Closes in ${formatDistanceToNowStrict(new Date(d))}`, tone: 'green' };
}

export function fmtSalary(salary?: { min: number; max: number; currency: string }): string {
  if (!salary) return 'Not disclosed';
  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} LPA` : `₹${n.toLocaleString('en-IN')}`;
  return `${fmt(salary.min)} – ${fmt(salary.max)}`;
}

export const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function resumeHref(url: string): string {
  return url.startsWith('http') ? url : url; // /uploads/... works via the vite proxy
}
