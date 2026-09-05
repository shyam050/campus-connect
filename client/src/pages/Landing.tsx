import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';

const FEATURES = [
  {
    n: '01',
    title: 'Filtered to you',
    body: 'Listings are filtered against your CGPA, backlogs, department and batch — on the server, before you ever see them. If a drive is on your list, you can apply to it.',
  },
  {
    n: '02',
    title: 'Deadlines, announced',
    body: 'Every morning at 9, the portal emails eligible students who haven\u2019t applied — 7 days out, 3 days out, and the day before. No more finding out at 11 PM.',
  },
  {
    n: '03',
    title: 'The whole pipeline',
    body: 'From applied to offer letter, coordinators move your application through six statuses — with notes you can read and an email every time it moves.',
  },
];

const ROLES = [
  {
    role: 'Student',
    points: ['Browse eligible drives', 'Apply with a resume', 'Track every application', 'Prep tracker with streaks'],
  },
  {
    role: 'Coordinator',
    points: ['Post and manage drives', 'Review applicants', 'Update statuses, add notes', 'Trigger deadline reminders'],
  },
  {
    role: 'Admin',
    points: ['Department-wide analytics', 'User management', 'Bulk verification', 'Moderation across the portal'],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper text-slate-900">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <p className="font-display text-lg font-semibold tracking-tight">
            Campus<span className="text-brand-700">Connect</span>
          </p>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Create account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
        <div>
          <p className="label-mono">Campus placement portal — CSE · Class of 2026</p>
          <h1 className="mt-4 font-display text-[2.9rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Every eligible drive,<br />
            tracked to the <span className="text-brand-700">offer letter.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-600">
            CampusConnect is the placement hub for the department. Job listings filtered to your
            eligibility, automated deadline reminders, an application pipeline run by your
            coordinators, and a prep tracker to keep you honest.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register">
              <Button className="!px-5 !py-2.5">
                Create an account <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="!px-5 !py-2.5">Sign in</Button>
            </Link>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">
            Demo accounts available on the sign-in page
          </p>
        </div>

        {/* Specimen card — a real listing, as it appears in the app */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-md border border-line bg-white shadow-[0_1px_2px_rgba(26,29,36,0.05),0_16px_40px_-24px_rgba(26,29,36,0.25)]">
            <div className="border-b border-line px-4 py-2.5">
              <p className="label-mono">Open drives — filtered for you</p>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[15px] font-semibold">Software Engineer, University Graduate</p>
                  <p className="mt-0.5 text-xs text-slate-500">Google · Bengaluru</p>
                </div>
                <span className="shrink-0 rounded-sm border border-clay/30 bg-clay-tint px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-clay">
                  Closes in 3 days
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                <span>CGPA ≥ 8.0</span>
                <span>0 backlogs</span>
                <span>CSE / IT / ECE</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                  ₹24–32 LPA · 41 applicants
                </span>
                <span className="rounded-sm border border-brand-800 bg-brand-700 px-2.5 py-1 text-xs font-medium text-paper">
                  Apply
                </span>
              </div>
            </div>
          </div>

          {/* Offset status card behind */}
          <div className="absolute -bottom-6 -left-4 hidden w-56 -rotate-1 rounded-md border border-line bg-paper-deep px-4 py-3 sm:block">
            <p className="label-mono">Application status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              <span className="text-xs font-medium text-slate-700">Shortlisted — Google</span>
            </div>
            <div className="mt-2 h-1 w-full rounded-sm bg-slate-200">
              <div className="h-full w-3/5 rounded-sm bg-brand-600" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <section className="border-y border-line bg-paper-deep/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            ['300+', 'students on the roster'],
            ['7 open', 'drives this season'],
            ['6', 'statuses, applied → selected'],
            ['9:00 AM', 'daily reminder run'],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-2xl font-semibold text-slate-900">{value}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="label-mono">Why it exists</p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.n} className="border-t-2 border-slate-900 pt-5">
              <p className="font-mono text-xs text-brand-700">{f.n}</p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reminder band ───────────────────────────────────── */}
      <section className="bg-slate-950 text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="label-mono !text-slate-500">Automated reminders</p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Three reminders. Every drive.<br />
              Every eligible student.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              A scheduled job checks every open drive each morning and queues tiered emails through a
              Redis-backed queue — filtered by CGPA, department and backlogs, and only to students
              who haven't applied yet.
            </p>
          </div>
          <div className="flex items-baseline justify-center gap-6 lg:justify-end">
            {['07', '03', '01'].map((d, i) => (
              <div key={d} className="text-center">
                <p className={`font-display text-7xl font-semibold tracking-tight ${i === 2 ? 'text-brass-300' : 'text-slate-600'}`}>
                  {d}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  days before
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-mono">Role-based access</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
              One portal, three very different views
            </h2>
          </div>
          <p className="max-w-sm text-sm text-slate-500">
            Every route and every API endpoint is gated by role — the interfaces below never mix.
          </p>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.role} className="bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-700">{r.role}</p>
              <ul className="mt-4 space-y-2.5">
                {r.points.map((p) => (
                  <li key={p} className="flex items-baseline gap-2.5 text-sm text-slate-600">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Ready when you are.</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Students sign up with a department email — the placement cell handles the rest.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/register">
              <Button className="!px-5 !py-2.5">Create an account</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="!px-5 !py-2.5">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <p className="font-display text-sm font-semibold">
            Campus<span className="text-brand-700">Connect</span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
            Built for the CSE class of 2026 · Placement cell
          </p>
        </div>
      </footer>
    </div>
  );
}
