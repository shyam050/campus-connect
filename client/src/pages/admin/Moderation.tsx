import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Ban, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '../../api/client';
import { Badge, Button, Card, CardHeader, PageHeader, Pagination, StatusBadge } from '../../components/ui';
import { fmtDate } from '../../utils/format';
import type { Application, Job, Meta } from '../../types';

export default function Moderation() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [recent, setRecent] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [j, a] = await Promise.all([
        api.get(`/admin/moderation/jobs?page=${page}&limit=20`),
        api.get('/admin/moderation/applications'),
      ]);
      setJobs(j.data.data);
      if (j.data.meta) setMeta(j.data.meta);
      setRecent(a.data.data);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (job: Job, status: 'open' | 'closed') => {
    try {
      await api.patch(`/jobs/${job._id}`, { status });
      toast.success(status === 'closed' ? 'Job closed' : 'Job reopened');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async (job: Job) => {
    if (!confirm(`Delete ${job.company} — ${job.role}? All its applications will be removed.`)) return;
    try {
      await api.delete(`/jobs/${job._id}`);
      toast.success('Job deleted');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (loading) return <p className="py-20 text-center text-slate-400">Loading moderation view…</p>;

  return (
    <div>
      <PageHeader
        title="Moderation"
        subtitle="Admin oversight across every drive and application on the portal."
      />

      <Card className="mb-6">
        <CardHeader title="All jobs" subtitle={`${meta.total} total`} />
        <div className="overflow-x-auto">
          <table className="table-base min-w-[760px]">
            <thead>
              <tr>
                <th>Company / Role</th>
                <th>Posted by</th>
                <th>Deadline</th>
                <th>Applicants</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-slate-50">
                  <td>
                    <p className="font-medium text-slate-800">{job.company}</p>
                    <p className="text-xs text-slate-400">{job.role}</p>
                  </td>
                  <td className="text-sm text-slate-500">
                    {typeof job.postedBy === 'object' ? job.postedBy.name : '—'}
                  </td>
                  <td className="text-sm text-slate-500">{fmtDate(job.deadline)}</td>
                  <td className="font-medium text-slate-700">{job.applicants.length}</td>
                  <td>
                    {job.status === 'open' ? (
                      <Badge tone="green">Open</Badge>
                    ) : (
                      <Badge tone="red">Closed</Badge>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link to={`/coordinator/jobs/${job._id}/applicants`}>
                        <Button variant="outline" size="sm">Applicants</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={job.status === 'open' ? 'Close job' : 'Reopen job'}
                        onClick={() => void setStatus(job, job.status === 'open' ? 'closed' : 'open')}
                      >
                        {job.status === 'open' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => void remove(job)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPage={setPage} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Latest application activity"
          subtitle="Most recent 25 status changes and submissions"
          action={<ShieldCheck size={16} className="text-slate-300" />}
        />
        <div className="divide-y divide-slate-100">
          {recent.map((a) => {
            const student = typeof a.studentId === 'object' ? a.studentId : null;
            return (
              <div key={a._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {student?.name ?? 'Student'} → <span className="font-semibold">{a.company}</span> ({a.role})
                  </p>
                  <p className="text-xs text-slate-400">
                    Updated {fmtDate(a.updatedAt)} · applied {fmtDate(a.appliedAt)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            );
          })}
          {recent.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-400">No activity yet.</p>}
        </div>
      </Card>
    </div>
  );
}
