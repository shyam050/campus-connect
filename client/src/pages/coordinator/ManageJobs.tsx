import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api, apiErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Textarea,
} from '../../components/ui';
import { deadlineLabel, fmtDate, fmtSalary } from '../../utils/format';
import { DEPARTMENTS, JOB_TYPE_LABELS } from '../../types';
import type { Job, JobStatus, JobType, Meta } from '../../types';

interface JobFormState {
  company: string;
  role: string;
  description: string;
  type: JobType;
  location: string;
  deadline: string;
  minCgpa: number;
  maxBacklogs: number;
  departments: string[];
  batch: number;
  salaryMin: string;
  salaryMax: string;
}

const emptyForm = (): JobFormState => ({
  company: '',
  role: '',
  description: '',
  type: 'fulltime',
  location: '',
  deadline: '',
  minCgpa: 7,
  maxBacklogs: 0,
  departments: ['CSE', 'IT'],
  batch: 2026,
  salaryMin: '',
  salaryMax: '',
});

function toForm(job: Job): JobFormState {
  return {
    company: job.company,
    role: job.role,
    description: job.description,
    type: job.type,
    location: job.location,
    deadline: new Date(job.deadline).toISOString().slice(0, 10),
    minCgpa: job.eligibility.minCgpa,
    maxBacklogs: job.eligibility.maxBacklogs,
    departments: [...job.eligibility.departments],
    batch: job.eligibility.batch,
    salaryMin: job.salary ? String(job.salary.min) : '',
    salaryMax: job.salary ? String(job.salary.max) : '',
  };
}

export default function ManageJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | ''>('');
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<JobFormState>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (!isAdmin) params.set('mine', 'true');
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.data);
      if (data.meta) setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setForm(toForm(job));
    setShowForm(true);
  };

  const toggleDept = (d: string) =>
    setForm((f) => ({
      ...f,
      departments: f.departments.includes(d) ? f.departments.filter((x) => x !== d) : [...f.departments, d],
    }));

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      company: form.company,
      role: form.role,
      description: form.description,
      type: form.type,
      location: form.location,
      deadline: form.deadline,
      eligibility: {
        minCgpa: Number(form.minCgpa),
        maxBacklogs: Number(form.maxBacklogs),
        departments: form.departments,
        batch: Number(form.batch),
      },
      ...(form.salaryMin && form.salaryMax
        ? { salary: { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: 'INR' } }
        : {}),
    };
    try {
      if (editing) {
        await api.patch(`/jobs/${editing._id}`, payload);
        toast.success('Job updated');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job posted — eligible students will see it instantly');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (job: Job) => {
    const next: JobStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await api.patch(`/jobs/${job._id}`, { status: next });
      toast.success(next === 'closed' ? 'Job closed' : 'Job reopened');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async (job: Job) => {
    if (!confirm(`Delete ${job.company} — ${job.role}? Its ${job.applicants.length} application(s) will be removed too.`)) return;
    try {
      await api.delete(`/jobs/${job._id}`);
      toast.success('Job deleted');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remind = async (job: Job) => {
    try {
      const { data } = await api.post(`/jobs/${job._id}/remind`);
      toast.success(data.data.message);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'All Jobs' : 'Manage Jobs'}
        subtitle={isAdmin ? 'Every drive posted by coordinators.' : 'Post drives and manage the applicant pipeline.'}
        action={<Button onClick={openCreate}><Plus size={15} /> Post a job</Button>}
      />

      <div className="mb-4">
        <Select
          label=""
          className="max-w-40"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as 'open' | 'closed' | '');
          }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {loading ? (
        <p className="py-20 text-center text-slate-400">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs here yet"
          subtitle={isAdmin ? 'No drives match this filter.' : 'Post your first drive — students filtered by eligibility will see it immediately.'}
          action={<Button onClick={openCreate}>Post a job</Button>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const dl = deadlineLabel(job.deadline);
            return (
              <Card key={job._id} className="p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                    {job.company[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{job.role}</p>
                      <Badge tone="slate">{JOB_TYPE_LABELS[job.type]}</Badge>
                      {job.status === 'open' ? (
                        <Badge tone={dl.tone}>{dl.text}</Badge>
                      ) : (
                        <Badge tone="red">Closed</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {job.company} · {job.location} · {fmtSalary(job.salary)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Deadline {fmtDate(job.deadline)} · CGPA ≥ {job.eligibility.minCgpa} · ≤ {job.eligibility.maxBacklogs} backlog ·{' '}
                      {job.eligibility.departments.join('/')} · batch {job.eligibility.batch}
                      {typeof job.postedBy === 'object' && isAdmin ? ` · posted by ${job.postedBy.name}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/coordinator/jobs/${job._id}/applicants`}>
                      <Button variant="outline" size="sm">
                        <Users size={14} /> {job.applicants.length}
                      </Button>
                    </Link>
                    {job.status === 'open' && (
                      <Button variant="outline" size="sm" onClick={() => void remind(job)} title="Queue reminder emails to eligible non-applicants">
                        <Bell size={14} /> Remind
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => void toggleStatus(job)}>
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(job)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => void remove(job)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPage={setPage} />

      {/* Create / edit modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? `Edit — ${editing.company}` : 'Post a job'} wide>
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company" required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            <Input label="Role" required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          </div>
          <Textarea
            label="Description"
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="About the role, interview process, requirements…"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as JobType }))}>
              {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
                <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>
              ))}
            </Select>
            <Input label="Location" required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Input
              label="Deadline"
              type="date"
              required
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Eligibility</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Min CGPA"
                type="number"
                min={0}
                max={10}
                step={0.1}
                required
                value={form.minCgpa}
                onChange={(e) => setForm((f) => ({ ...f, minCgpa: Number(e.target.value) }))}
              />
              <Input
                label="Max backlogs"
                type="number"
                min={0}
                max={20}
                required
                value={form.maxBacklogs}
                onChange={(e) => setForm((f) => ({ ...f, maxBacklogs: Number(e.target.value) }))}
              />
              <Input
                label="Batch (grad year)"
                type="number"
                min={2020}
                max={2035}
                required
                value={form.batch}
                onChange={(e) => setForm((f) => ({ ...f, batch: Number(e.target.value) }))}
              />
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-slate-600">Eligible departments</p>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDept(d)}
                    className={`rounded-sm border px-3 py-1 text-xs font-medium transition ${
                      form.departments.includes(d)
                        ? 'border-brand-700 bg-brand-700 text-paper'
                        : 'border-slate-300 bg-white text-slate-500 hover:border-brand-500 hover:text-brand-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Salary min (₹/year)" type="number" min={0} placeholder="e.g. 600000" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} />
            <Input label="Salary max (₹/year)" type="number" min={0} placeholder="e.g. 1200000" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {editing ? 'Save changes' : 'Post job'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
