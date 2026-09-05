import cron, { type ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { enqueueEmail } from '../queue/emailQueue';
import { deadlineReminderEmail } from '../templates/email.templates';

const REMINDER_DAYS = [7, 3, 1]; // 7 days, 3 days, 1 day before

export interface ReminderSummary {
  jobsChecked: number;
  emailsQueued: number;
  perDay: { days: number; jobs: number; emails: number }[];
}

/**
 * Tiered deadline reminders: for each open job whose deadline lands exactly
 * `days` from today, queue an email to every eligible student who hasn't applied.
 * Eligibility mirrors the listing filter: CGPA, backlogs, department (and batch).
 */
export async function runDeadlineReminders(onlyJobId?: string): Promise<ReminderSummary> {
  const summary: ReminderSummary = { jobsChecked: 0, emailsQueued: 0, perDay: [] };
  const now = new Date();

  for (const days of REMINDER_DAYS) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    // Find jobs with deadline exactly `days` from now
    const filter: Record<string, unknown> = {
      status: 'open',
      deadline: {
        $gte: new Date(new Date(targetDate).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(targetDate).setHours(23, 59, 59, 999)),
      },
    };
    if (onlyJobId) filter._id = onlyJobId;

    const jobs = await Job.find(filter);
    let emails = 0;

    for (const job of jobs) {
      summary.jobsChecked += 1;

      // Find eligible students who haven't applied yet
      const eligibleStudents = await User.find({
        role: 'student',
        isVerified: true,
        isActive: true,
        cgpa: { $gte: job.eligibility.minCgpa },
        backlogs: { $lte: job.eligibility.maxBacklogs },
        department: { $in: job.eligibility.departments },
        batch: job.eligibility.batch,
        _id: { $nin: job.applicants }, // Not already applied
      });

      // Queue reminder emails (bulk send without blocking)
      for (const student of eligibleStudents) {
        await enqueueEmail(
          {
            to: student.email,
            subject: `Reminder: ${job.company} application closes in ${days} day${days > 1 ? 's' : ''}`,
            template: 'deadline-reminder',
            html: deadlineReminderEmail({
              studentName: student.name,
              company: job.company,
              role: job.role,
              deadline: job.deadline,
              daysLeft: days,
              applyUrl: `${env.frontendUrl}/student/jobs/${job._id}`,
            }),
          },
          'send-reminder'
        );
        emails += 1;
      }
    }

    summary.emailsQueued += emails;
    summary.perDay.push({ days, jobs: jobs.length, emails });
  }

  return summary;
}

let task: ScheduledTask | null = null;

/** Run daily at 9:00 AM (server local time). */
export function startCron(): void {
  if (env.disableCron || env.isTest) {
    console.log('[cron] scheduler disabled');
    return;
  }
  task = cron.schedule('0 9 * * *', async () => {
    console.log('[cron] Running deadline reminder job...');
    try {
      const summary = await runDeadlineReminders();
      console.log(
        `[cron] Done — ${summary.jobsChecked} jobs checked, ${summary.emailsQueued} reminders queued`
      );
    } catch (err) {
      console.error('[cron] reminder job failed:', err);
    }
  });
  console.log('[cron] deadline reminders scheduled → 0 9 * * *');
}

export function stopCron(): void {
  task?.stop();
  task = null;
}
