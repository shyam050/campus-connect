export interface ReminderEmailData {
  studentName: string;
  company: string;
  role: string;
  deadline: Date;
  daysLeft: number;
  applyUrl: string;
}

export interface StatusUpdateEmailData {
  studentName: string;
  company: string;
  role: string;
  status: string;
}

const wrap = (title: string, body: string) => `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#4f46e5;color:#fff;padding:20px 28px">
      <h2 style="margin:0;font-size:18px">🎓 CampusConnect</h2>
      <p style="margin:4px 0 0;opacity:.85;font-size:13px">${title}</p>
    </div>
    <div style="padding:24px 28px;color:#1e293b;font-size:14px;line-height:1.6">${body}</div>
    <div style="padding:14px 28px;background:#f8fafc;color:#94a3b8;font-size:12px">
      Sent by your placement cell via CampusConnect. Please do not reply to this email.
    </div>
  </div>`;

export function deadlineReminderEmail(d: ReminderEmailData): string {
  const when = new Date(d.deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return wrap(
    `Deadline reminder — ${d.company}`,
    `
    <p>Hi ${d.studentName},</p>
    <p>The application window for <strong>${d.role}</strong> at <strong>${d.company}</strong>
    closes in <strong style="color:#dc2626">${d.daysLeft} day${d.daysLeft > 1 ? 's' : ''}</strong> (${when}).</p>
    <p style="margin:20px 0">
      <a href="${d.applyUrl}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Apply now</a>
    </p>
    <p>Based on your CGPA, department and backlogs, you are eligible for this drive.</p>`
  );
}

export function statusUpdateEmail(d: StatusUpdateEmailData): string {
  return wrap(
    `Application update — ${d.company}`,
    `
    <p>Hi ${d.studentName},</p>
    <p>Your application for <strong>${d.role}</strong> at <strong>${d.company}</strong> moved to
    <strong style="text-transform:capitalize">${d.status.replace(/_/g, ' ')}</strong>.</p>
    <p>Check the tracker in CampusConnect for details and coordinator notes.</p>`
  );
}
