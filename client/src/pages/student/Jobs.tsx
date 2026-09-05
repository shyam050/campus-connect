import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, CalendarClock, MapPin, Search, Upload, Wallet } from 'lucide-react';
import { api, apiErrorMessage } from '../../api/client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Pagination,
  PageHeader,
  Select,
} from '../../components/ui';
import { deadlineLabel, fmtDate, fmtSalary } from '../../utils/format';
import { JOB_TYPE_LABELS } from '../../types';
import type { Job, JobType, Meta } from '../../types';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '' as JobType | '', company: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.company) params.set('company', filters.company);
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.data);
      if (data.meta) setMeta(data.meta);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filters.search, filters.type, filters.company]);

  useEffect(() => {
    void load();
  }, [load]);

  const setFilter = (k: keyof typeof filters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: e.target.value }));
  };

  return (
    <div>
      <PageHeader
        title="Job Listings"
        subtitle="Filtered to your eligibility — CGPA, backlogs, department and batch are applied on the server."
      />

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-base pl-9"
              placeholder="Search company, role or description…"
              value={filters.search}
              onChange={setFilter('search')}
            />
          </label>
          <Select label="" value={filters.type} onChange={setFilter('type')}>
            <option value="">All types</option>
            {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
              <option key={t} value={t}>
                {JOB_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <label className="relative block">
            <Briefcase size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-base pl-9"
              placeholder="Filter by company…"
              value={filters.company}
              onChange={setFilter('company')}
            />
          </label>
        </div>
      </Card>

      {loading ? (
        <p className="py-20 text-center text-slate-400">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={36} />}
          title="No eligible open jobs match"
          subtitle="New drives are posted by coordinators regularly. Eligibility filters (CGPA ≥ min, backlogs ≤ max, department, batch) hide jobs you can't apply to."
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const dl = deadlineLabel(job.deadline);
            return (
              <Card key={job._id} className="p-5 transition hover:border-brand-300 hover:shadow-md">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                    {job.company[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/student/jobs/${job._id}`} className="font-semibold text-slate-800 hover:text-brand-600">
                        {job.role}
                      </Link>
                      <Badge tone="slate">{JOB_TYPE_LABELS[job.type]}</Badge>
                      <Badge tone={dl.tone}>
                        <CalendarClock size={12} /> {dl.text}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{job.company}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
                      <span className="inline-flex items-center gap-1"><Wallet size={13} /> {fmtSalary(job.salary)}</span>
                      <span>Deadline: {fmtDate(job.deadline)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{job.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Link to={`/student/jobs/${job._id}`}>
                      <Button size="sm">View & apply</Button>
                    </Link>
                    <p className="text-[11px] text-slate-400">
                      CGPA ≥ {job.eligibility.minCgpa} · ≤ {job.eligibility.maxBacklogs} backlog
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPage={setPage} />
    </div>
  );
}

/** Apply modal — used on JobDetail page. */
export function ApplyModal({ job, open, onClose, onApplied }: { job: Job; open: boolean; onClose: () => void; onApplied: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error('Attach your resume (PDF or Word, max 5 MB)');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      await api.post(`/jobs/${job._id}/apply`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Application submitted — ${job.company}`);
      onApplied();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Apply — ${job.company}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-brand-50 p-3 text-xs text-brand-700">
          You meet the eligibility criteria: CGPA ≥ {job.eligibility.minCgpa}, ≤ {job.eligibility.maxBacklogs} backlog
          ({job.eligibility.departments.join(', ')}, batch {job.eligibility.batch}).
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Resume (PDF / DOC / DOCX · max 5 MB)</span>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
            <Upload size={22} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600">{file ? file.name : 'Choose a file'}</span>
            {file && <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>}
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Submit application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
