import nodemailer, { type Transporter } from 'nodemailer';
import { env, smtpConfigured } from '../config/env';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
} else {
  console.log('[email] SMTP not configured — emails will be logged to console (dev mode)');
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<void> {
  if (!transporter) {
    console.log(`[email:dev] to=${to} | subject=${subject}`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, html });
}
