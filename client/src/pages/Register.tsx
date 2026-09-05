import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/ui';
import { roleHome } from '../components/RequireRole';
import { apiErrorMessage } from '../api/client';
import { DEPARTMENTS } from '../types';

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'CSE',
    batch: 2026,
    cgpa: 7.5,
    backlogs: 0,
  });

  if (!loading && user) return <Navigate to={roleHome(user.role)} replace />;

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register({
        ...form,
        batch: Number(form.batch),
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
      });
      toast.success(`Welcome to CampusConnect, ${u.name.split(' ')[0]}!`);
      navigate('/student', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">New student</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Coordinator and admin accounts are provisioned by the placement cell.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-md border border-line bg-white p-6 shadow-sm">
          <Input label="Full name" required placeholder="Aarav Sharma" value={form.name} onChange={set('name')} />
          <Input
            label="Department email"
            type="email"
            required
            placeholder="you@campus.edu"
            value={form.email}
            onChange={set('email')}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            hint="At least 8 characters"
            value={form.password}
            onChange={set('password')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" value={form.department} onChange={set('department')}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Input label="Graduation year" type="number" required min={2020} max={2035} value={form.batch} onChange={set('batch')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="CGPA (0–10)" type="number" required min={0} max={10} step={0.1} value={form.cgpa} onChange={set('cgpa')} />
            <Input label="Active backlogs" type="number" required min={0} max={20} value={form.backlogs} onChange={set('backlogs')} />
          </div>
          <p className="text-xs text-slate-400">
            Your CGPA and backlogs drive eligibility filtering — the placement office can correct them later.
          </p>
          <Button type="submit" loading={busy} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
