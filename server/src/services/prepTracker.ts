import type { IPrepModule } from '../models/PrepModule';

export function calculateProgress(module: Pick<IPrepModule, 'subtopics'>): number {
  if (module.subtopics.length === 0) return 0;
  const completed = module.subtopics.filter((s) => s.completed).length;
  return Math.round((completed / module.subtopics.length) * 100);
}

/** YYYY-MM-DD key in local time. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Consecutive-day streak of prep activity, counting back from today.
 * A streak that last touched yesterday is still alive (today may not be done yet).
 */
export function calculateStreak(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0;

  const days = new Set(activityDates.map((d) => dayKey(new Date(d))));
  let streak = 0;

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Today's midnight boundary, used to record one activity entry per day. */
export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
