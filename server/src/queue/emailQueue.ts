import Queue from 'bull';
import { env } from '../config/env';
import { sendEmail, type EmailPayload } from '../services/email.service';

export interface EmailJobData extends EmailPayload {
  template?: string;
  meta?: Record<string, unknown>;
}

/**
 * Bull + Redis queue for bulk email sending without blocking the event loop.
 * When REDIS_URL is not configured (local dev / CI) the queue degrades to
 * direct fire-and-forget sends so the rest of the app works unchanged.
 */
const emailQueue = env.redisUrl
  ? new Queue<EmailJobData>('email-reminders', env.redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    })
  : null;

if (emailQueue) {
  // Email worker — processes queued sends with concurrency 5.
  emailQueue.process('send-reminder', 5, async (job) => {
    await sendEmail(job.data);
  });
  emailQueue.process('send-email', 5, async (job) => {
    await sendEmail(job.data);
  });

  emailQueue.on('error', (err) => console.error(`[queue] ${err.message}`));
  emailQueue.on('failed', (job, err) =>
    console.error(`[queue] job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`)
  );
  console.log('[queue] Bull email worker connected →', env.redisUrl);
} else {
  console.log('[queue] REDIS_URL not set — email queue running in direct mode');
}

export async function enqueueEmail(data: EmailJobData, name: 'send-reminder' | 'send-email' = 'send-email') {
  if (emailQueue) {
    return emailQueue.add(name, data);
  }
  // Direct mode: send immediately, off the request path.
  setImmediate(() => {
    sendEmail(data).catch((err) => console.error(`[email] direct send failed: ${err.message}`));
  });
  return null;
}
