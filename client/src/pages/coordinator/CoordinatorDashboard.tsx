import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Briefcase, ClipboardList, Users } from 'lucide-react';
import { api } from '../../api/client';
import { Badge, Card, CardHeader, PageHeader, StatCard, StatusBadge } from '../../components/ui';
import { deadlineLabel, fmtDate } from '../../utils/format';
import type { Application, Job } from '../../types';

export default function CoordinatorDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recent, setRecent] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [myJobs, apps] = await Promise.all([
          api.get('/jobs?mine=true&limit=50'),
          api.get('/applications?limit=8'),
        ]);
        setJobs(myJobs.data.data);
        setRecent(apps.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="py-20 text-center text-slate-400">Loading dashboard…</p>;

  const open = jobs.filter((j) => j.status === 'open');
  const applicants = jobs.reduce((sum, j) => sum + j.applicants.length, 0);
  const pending = recent.filter((a) => a.status === 'applied' || a.status === 'under_review').length;

  return (
    <div>
      <PageHeader title="Coordinator Dashboard" subtitle="Drive activity across the jobs you've posted." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Briefcase size={20} />} label="Jobs posted" value={jobs.length} hint={`${open.length} open`} />
        <StatCard icon={<Users size={20} />} label="Total applicants" value={applicants} hint="Across all drives" />
        <StatCard icon={<ClipboardList size={20} />} label="Needs review" value={pending} hint="Applied / under review" />
        <StatCard
          icon={<Bell size={20} />}
          label="Reminders"
          value="7 / 3 / 1"
          hint="Days before deadline · 9 AM daily"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Your drives"
            subtitle="Ordered by deadline"
            action={
              <Link to="/coordinator/jobs" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                Manage <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {jobs.slice(0, 6).map((job) => {
              const dl = deadlineLabel(job.deadline);
              return (
                <Link key={job._id} to={`/coordinator/jobs/${job._id}/applicants`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {job.company[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{job.role}</p>
                    <p className="text-xs text-slate-500">
                      {job.company} · {job.applicants.length} applicant{job.applicants.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    {job.status === 'open' ? (
                      <Badge tone={dl.tone}>{dl.text}</Badge>
                    ) : (
                      <Badge tone="slate">Closed</Badge>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">{fmtDate(job.deadline)}</p>
                  </div>
                </Link>
              );
            })}
            {jobs.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                No jobs posted yet — head to Manage Jobs to post your first drive.
              </p>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Latest applications" />
          <div className="divide-y divide-slate-100">
            {recent.map((a) => {
              const student = typeof a.studentId === 'object' ? a.studentId : null;
              return (
                <div key={a._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">{student?.name ?? 'Student'}</p>
                    <p className="truncate text-xs text-slate-400">
                      {a.company} · {a.role}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              );
            })}
            {recent.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No applications yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
