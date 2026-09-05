import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { Button, Card, CardHeader, Input, PageHeader, RoleBadge } from '../components/ui';
import { fmtDate } from '../utils/format';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  if (!user) return null;

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await api.patch('/profile', { name });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const savePwd = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await api.post('/profile/change-password', pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account details and security" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" subtitle="CGPA & backlogs are maintained by the placement office" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="ml-auto"><RoleBadge role={user.role} /></div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Department</dt>
                <dd className="font-medium text-slate-700">{user.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Batch</dt>
                <dd className="font-medium text-slate-700">{user.batch}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">CGPA</dt>
                <dd className="font-medium text-slate-700">{user.cgpa.toFixed(1)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Backlogs</dt>
                <dd className="font-medium text-slate-700">{user.backlogs}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Verified</dt>
                <dd className="font-medium text-slate-700">{user.isVerified ? 'Yes' : 'Pending'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Member since</dt>
                <dd className="font-medium text-slate-700">{fmtDate(user.createdAt)}</dd>
              </div>
            </dl>

            <form onSubmit={saveName} className="flex items-end gap-3 border-t border-slate-100 pt-4">
              <div className="flex-1">
                <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit" variant="outline" loading={savingName} disabled={name === user.name}>
                Save
              </Button>
            </form>
          </div>
        </Card>

        <Card className="self-start">
          <CardHeader title="Change password" subtitle="Choose a strong, unique password" />
          <form onSubmit={savePwd} className="space-y-4 p-5">
            <Input
              label="Current password"
              type="password"
              required
              value={pwd.currentPassword}
              onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
            />
            <Input
              label="New password"
              type="password"
              required
              minLength={8}
              hint="At least 8 characters"
              value={pwd.newPassword}
              onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <Button type="submit" loading={savingPwd}>
              <KeyRound size={15} /> Update password
            </Button>
          </form>

          <div className="border-t border-slate-100 p-5 text-xs text-slate-400">
            <p className="flex items-center gap-2 font-medium text-slate-500">
              <UserRound size={14} /> Security model
            </p>
            <p className="mt-2 leading-relaxed">
              Sessions use a 15-minute access token plus a 7-day httpOnly refresh cookie with rotation —
              a stolen refresh token is invalidated the moment the real session renews.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
