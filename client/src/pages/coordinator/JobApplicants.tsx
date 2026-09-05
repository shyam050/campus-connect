import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '../../api/client';
import { Badge, Card, PageHeader, Select, Spinner, StatusBadge } from '../../components/ui';
import { fmtDate } from '../../utils/format';
import { APPLICATION_STATUSES, STATUS_LABELS } from '../../types';
import type { Application, ApplicationStatus, Job, User } from '../../types';

type ApplicantRow = Omit<Application, 'studentId'> & { studentId: Pick<User, '_id' | 'name' | 'email' | 'department' | 'cgpa' | 'backlogs' | 'isVerified'> | string };

export default function JobApplicants() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<ApplicantRow[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const { data } = await api.get(`/jobs/${id}/applicants`);
      setJob(data.data.job);
      setApps(data.data.applications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      await api.patch(`/applications/${appId}/status`, { status, notes: notes[appId] });
      toast.success(`Moved to ${STATUS_LABELS[status]} — student notified by email`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const saveNotes = async (appId: string) => {
    try {
      const app = apps.find((a) => a._id === appId);
      if (!app) return;
      await api.patch(`/applications/${appId}/status`, { status: app.status, notes: notes[appId] ?? app.notes ?? '' });
      toast.success('Note saved');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (loading) return <Spinner label="Loading applicants…" />;
  if (!job) return <p className="py-20 text-center text-slate-400">Job not found.</p>;

  const visible = filter ? apps.filter((a) => a.status === filter) : apps;

  return (
    <div>
      <Link to="/coordinator/jobs" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to jobs
      </Link>

      <PageHeader
        title={`${job.company} — ${job.role}`}
        subtitle={`Deadline ${fmtDate(job.deadline)} · ${apps.length} application(s) · CGPA ≥ ${job.eligibility.minCgpa}, ≤ ${job.eligibility.maxBacklogs} backlog, ${job.eligibility.departments.join('/')}`}
      />

      <div className="mb-4 max-w-48">
        <Select label="" value={filter} onChange={(e) => setFilter(e.target.value as ApplicationStatus | '')}>
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      {visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No applications with this status.</Card>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const student = typeof a.studentId === 'object' ? a.studentId : null;
            const resume = a.resumeUrl;
            return (
              <Card key={a._id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {student?.name.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{student?.name}</p>
                      {student && !student.isVerified && <Badge tone="amber">Unverified</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{student?.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{student?.department}</span>
                      <span>CGPA <b className="text-slate-700">{student?.cgpa.toFixed(1)}</b></span>
                      <span>Backlogs <b className="text-slate-700">{student?.backlogs}</b></span>
                      <span>Applied {fmtDate(a.appliedAt)}</span>
                      <a href={resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
                        <FileText size={12} /> Resume
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={a.status} />
                    <Select
                      label=""
                      value={a.status}
                      className="w-44"
                      onChange={(e) => void updateStatus(a._id, e.target.value as ApplicationStatus)}
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <div className="flex-1">
                    <input
                      className="input-base"
                      placeholder="Coordinator note (shared with the student)…"
                      defaultValue={a.notes}
                      onChange={(e) => setNotes((n) => ({ ...n, [a._id]: e.target.value }))}
                    />
                  </div>
                  <button
                    onClick={() => void saveNotes(a._id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Save note
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
