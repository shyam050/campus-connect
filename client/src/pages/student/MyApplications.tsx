import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardList, ExternalLink, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '../../api/client';
import { Badge, Button, Card, EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import { fmtDate } from '../../utils/format';
import { STATUS_LABELS, STATUS_ORDER } from '../../types';
import type { Application, ApplicationStatus } from '../../types';

function Stepper({ status }: { status: ApplicationStatus }) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-red-600">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Not selected this time
      </div>
    );
  }
  const current = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center">
      {STATUS_ORDER.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
              i < current
                ? 'bg-brand-600 text-white'
                : i === current
                  ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                  : 'bg-slate-200 text-slate-400'
            }`}
          >
            {i + 1}
          </div>
          {i < STATUS_ORDER.length - 1 && (
            <div className={`h-0.5 w-6 ${i < current ? 'bg-brand-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs font-medium text-slate-500">{STATUS_LABELS[status]}</span>
    </div>
  );
}

export default function MyApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/applications/me');
      setApps(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const withdraw = async (a: Application) => {
    if (!confirm(`Withdraw your application to ${a.company}?`)) return;
    try {
      await api.delete(`/applications/${a._id}`);
      toast.success('Application withdrawn');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (loading) return <p className="py-20 text-center text-slate-400">Loading applications…</p>;

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track every drive you've applied to. Coordinators move these forward — you'll get an email on each update."
      />

      {apps.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={36} />}
          title="No applications yet"
          subtitle="Head to the job listings and apply to your first drive — your resume goes straight to the placement cell."
          action={
            <Link to="/student/jobs">
              <Button>Browse jobs</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {apps.map((a) => {
            const job = typeof a.jobId === 'object' ? a.jobId : null;
            return (
              <Card key={a._id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{a.company}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{a.role}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Applied {fmtDate(a.appliedAt)} · last update {fmtDate(a.updatedAt)}
                    </p>
                    {job && (
                      <Link to={`/student/jobs/${job._id}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                        View job <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600">
                      <FileText size={13} /> My resume
                    </a>
                    {a.status === 'applied' && (
                      <Button variant="ghost" size="sm" onClick={() => void withdraw(a)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Stepper status={a.status} />
                </div>
                {a.notes && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <Badge tone="slate" className="mr-2">Coordinator note</Badge>
                    {a.notes}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
