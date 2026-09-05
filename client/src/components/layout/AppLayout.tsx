import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  GraduationCap,
  User as UserIcon,
  BarChart3,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { initials } from '../../utils/format';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: Record<UserRole, NavItem[]> = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/jobs', label: 'Job Listings', icon: Briefcase },
    { to: '/student/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/student/prep', label: 'Prep Tracker', icon: GraduationCap },
    { to: '/student/profile', label: 'Profile', icon: UserIcon },
  ],
  coordinator: [
    { to: '/coordinator', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/coordinator/jobs', label: 'Manage Jobs', icon: Briefcase },
    { to: '/coordinator/profile', label: 'Profile', icon: UserIcon },
  ],
  admin: [
    { to: '/admin', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/moderation', label: 'Moderation', icon: ShieldCheck },
    { to: '/admin/profile', label: 'Profile', icon: UserIcon },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const items = NAV[user.role];

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      <div className="border-b border-slate-800/80 px-5 py-5">
        <p className="font-display text-lg font-semibold tracking-tight text-paper">
          Campus<span className="text-brass-300">Connect</span>
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          Placement portal
        </p>
      </div>

      <nav className="mt-3 flex-1 space-y-0.5 px-3">
        <p className="label-mono px-2 pb-2 !text-slate-500">{user.role}</p>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/student' || to === '/coordinator' || to === '/admin'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 border-l-2 px-3 py-2 text-[13px] font-medium transition',
                isActive
                  ? 'border-brass-400 bg-slate-800/60 text-paper'
                  : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              )
            }
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-slate-700 bg-slate-800 font-mono text-[11px] text-brand-200">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-paper">{user.name}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">
              {user.department} · {user.batch}
            </p>
          </div>
          <button
            onClick={() => void logout()}
            title="Log out"
            className="rounded-sm p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(!open)} className="rounded-sm p-1.5 text-slate-600 hover:bg-slate-200/60">
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
          <p className="font-display text-[15px] font-semibold text-slate-900">
            Campus<span className="text-brand-700">Connect</span>
          </p>
          <div className="w-9" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
