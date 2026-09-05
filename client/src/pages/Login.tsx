import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { roleHome } from '../components/RequireRole';
import { apiErrorMessage } from '../api/client';

const DEMO = [
  { label: 'Student', email: 'aarav.student@campus.edu', password: 'Student@123' },
  { label: 'Coordinator', email: 'coordinator@campus.edu', password: 'Coord@123' },
  { label: 'Admin', email: 'admin@campus.edu', password: 'Admin@123' },
];

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={roleHome(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Signed in as ${u.name}`);
      navigate(roleHome(u.role), { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Editorial panel */}
      <div className="relative hidden w-[46%] flex-col justify-between bg-slate-950 p-12 text-paper lg:flex">
        <div className="flex items-baseline gap-2">
          <p className="font-display text-lg font-semibold tracking-tight">
            Campus<span className="text-brand-300">Connect</span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Placement portal</p>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.12] tracking-tight">
            Your placement season,<br />
            <span className="text-brass-300">in order.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-400">
            Drives filtered to your eligibility, applications tracked to offer,
            and deadline reminders before they slip. Built for the department,
            run by your placement cell.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-5">
          <ul className="space-y-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">
            <li><span className="text-brass-400">01</span> — Eligibility-filtered listings</li>
            <li><span className="text-brass-400">02</span> — 7·3·1 day deadline reminders</li>
            <li><span className="text-brass-400">03</span> — Prep tracker with streaks</li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center bg-paper px-4 lg:w-[54%]">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">Sign in</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">
            Department account
          </h2>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              required
              placeholder="you@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={busy} className="!mt-6 w-full">
              Continue
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <p className="label-mono">Demo accounts</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                  }}
                  className="rounded-sm border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-600 hover:text-brand-800"
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
              Fill credentials, then continue
            </p>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            New student?{' '}
            <Link to="/register" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
