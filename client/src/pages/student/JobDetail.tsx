import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarClock, CheckCircle2, Clock, MapPin, Wallet, XCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Badge, Button, Card, Spinner, StatusBadge } from '../../components/ui';
import { ApplyModal } from './Jobs';
import { deadlineLabel, fmtDate, fmtSalary } from '../../utils/format';
import { JOB_TYPE_LABELS } from '../../types';
import type { Application, Job, JobStatus } from '../../types';

interface JobDetailData {
  job: Job;
  eligible: boolean;
  applied: boolean;
  applicationId: string | null;
  applyOpen: boolean;
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<JobDetailData | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [status, setStatus] = useState<Application | null>(null);

  const load = async () => {
    const { data } = await api.get<{ data: JobDetailData }>(`/jobs/${id}`);
    setData(data.data);
    if (data.data.applicationId) {
      const res = await api.get('/applications/me');
      const mine = (res.data.data as Application[]).find((a) => a._id === data.data.applicationId);
      setStatus(mine ?? null);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!data) return <Spinner label="Loading job…" />;
  const { job, eligible, applied, applyOpen } = data;
  const dl = deadlineLabel(job.deadline);

  const applyOpenState = applyOpen && eligible && !applied;

  return (
    <div>
      <button
        onClick={() => navigate('/student/jobs')}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} /> Back to listings
      </button>

      <Card className="overflow-hidden">
        <div className="border-b border-line bg-paper-deep/40 p-6">
          <div className="flex flex-wrap items-start gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 text-2xl font-bold text-white">
              {job.company[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-slate-900">{job.role}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                <Building2 size={14} /> {job.company} · posted {fmtDate(job.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="slate">{JOB_TYPE_LABELS[job.type]}</Badge>
                <Badge tone={dl.tone}><CalendarClock size={12} /> {dl.text}</Badge>
                <Badge tone="blue"><MapPin size={12} /> {job.location}</Badge>
                <Badge tone="green"><Wallet size={12} /> {fmtSalary(job.salary)}</Badge>
                {job.status === ('closed' as JobStatus) && <Badge tone="red">Closed</Badge>}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              {applied ? (
                <div className="flex items-center gap-2 rounded-sm border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-800">
                  <CheckCircle2 size={16} /> Applied — <StatusBadge status={status?.status ?? 'applied'} />
                </div>
              ) : applyOpenState ? (
                <Button onClick={() => setShowApply(true)}>Apply now</Button>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                  <XCircle size={16} />
                  {!applyOpen ? 'Deadline passed' : eligible ? 'Already applied' : 'Not eligible'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-2 font-semibold text-slate-800">Job description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
          </div>

          <Card className="h-fit p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CheckCircle2 size={15} className="text-brand-600" /> Eligibility criteria
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-500">Minimum CGPA</span>
                <span className="font-medium text-slate-700">{job.eligibility.minCgpa}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Max backlogs</span>
                <span className="font-medium text-slate-700">{job.eligibility.maxBacklogs}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Departments</span>
                <span className="font-medium text-slate-700">{job.eligibility.departments.join(', ')}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Batch</span>
                <span className="font-medium text-slate-700">{job.eligibility.batch}</span>
              </li>
              <li className="flex justify-between border-t border-slate-100 pt-2.5">
                <span className="text-slate-500">Application deadline</span>
                <span className="font-medium text-slate-700">{fmtDate(job.deadline)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Applicants so far</span>
                <span className="font-medium text-slate-700">{job.applicants.length}</span>
              </li>
            </ul>
            {!eligible && (
              <p className="mt-4 rounded-sm border border-clay/25 bg-clay-tint p-3 text-xs text-clay">
                You don't meet one or more criteria for this drive.
              </p>
            )}
            {applied && status && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                <Clock size={13} /> Applied {fmtDate(status.appliedAt)} · status updates by the coordinator trigger an email.
              </p>
            )}
          </Card>
        </div>
      </Card>

      <ApplyModal
        job={job}
        open={showApply}
        onClose={() => setShowApply(false)}
        onApplied={() => void load()}
      />
    </div>
  );
}
