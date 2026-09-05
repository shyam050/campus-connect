import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ClipboardList, GraduationCap, CalendarClock, ArrowRight, Flame } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, CardHeader, EmptyState, PageHeader, ProgressBar, StatCard, StatusBadge } from '../../components/ui';
import { deadlineLabel, fmtDate, fmtSalary } from '../../utils/format';
import type { Application, Job, PrepSummary } from '../../types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [prep, setPrep] = useState<PrepSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [appsRes, jobsRes, prepRes] = await Promise.all([
          api.get('/applications/me'),
          api.get('/jobs?limit=50'),
          api.get('/prep'),
        ]);
        setApplications(appsRes.data.data);
        setJobs(jobsRes.data.data);
        setPrep(prepRes.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="py-20 text-center text-slate-400">Loading dashboard…</p>;

  const active = applications.filter((a) => a.status !== 'rejected' && a.status !== 'selected').length;
  const offers = applications.filter((a) => a.status === 'selected').length;
  const closingSoon = jobs.slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        subtitle="Here's where your placement season stands today."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Briefcase size={20} />} label="Eligible & open" value={jobs.length} hint="Jobs you can apply to" />
        <StatCard icon={<ClipboardList size={20} />} label="Active applications" value={active} hint={`${applications.length} total`} />
        <StatCard icon={<GraduationCap size={20} />} label="Offers" value={offers} hint={offers ? 'Offer letter received' : 'None yet — keep going'} />
        <StatCard
          icon={<Flame size={20} />}
          label="Prep progress"
          value={`${prep?.overall ?? 0}%`}
          hint={prep?.streak ? `${prep.streak}-day streak` : 'No streak yet'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Closing soon */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Closing soon"
            subtitle="Eligible jobs ordered by deadline"
            action={
              <Link to="/student/jobs" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                View all <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="divide-y divide-slate-100">
            {closingSoon.length === 0 && (
              <div className="p-5">
                <EmptyState title="No open eligible jobs right now" subtitle="Coordinators post new drives regularly — this list updates the moment they do." />
              </div>
            )}
            {closingSoon.map((job) => {
              const dl = deadlineLabel(job.deadline);
              return (
                <Link
                  key={job._id}
                  to={`/student/jobs/${job._id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {job.company[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{job.role}</p>
                    <p className="truncate text-xs text-slate-500">
                      {job.company} · {job.location} · {fmtSalary(job.salary)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={dl.tone}>
                      <CalendarClock size={12} /> {dl.text}
                    </Badge>
                    <p className="mt-1 text-[11px] text-slate-400">{fmtDate(job.deadline)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Recent applications + prep */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Recent applications" />
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 4).map((a) => (
                <div key={a._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">{a.company}</p>
                    <p className="truncate text-xs text-slate-400">{a.role}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
              {applications.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-slate-400">No applications yet — browse jobs to get started.</p>
              )}
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Link to="/student/applications" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                Track all applications <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Prep tracker" action={<Link to="/student/prep" className="text-xs font-medium text-brand-600 hover:underline">Open</Link>} />
            <div className="space-y-4 p-5">
              {prep?.modules.slice(0, 4).map((m) => (
                <div key={m._id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{m.title}</span>
                    <span className="text-slate-400">{m.progress ?? 0}%</span>
                  </div>
                  <ProgressBar value={m.progress ?? 0} />
                </div>
              ))}
              {(!prep || prep.modules.length === 0) && (
                <p className="text-sm text-slate-400">No prep modules yet — add one to start tracking.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
