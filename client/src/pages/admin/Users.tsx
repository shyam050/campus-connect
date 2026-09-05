import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, ShieldCheck, Trash2, Users as UsersIcon } from 'lucide-react';
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
  RoleBadge,
  Select,
} from '../../components/ui';
import { DEPARTMENTS } from '../../types';
import type { Meta, User, UserRole } from '../../types';

interface EditState {
  cgpa: string;
  backlogs: string;
  batch: string;
  department: string;
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 20, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ cgpa: '', backlogs: '', batch: '', department: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (deptFilter) params.set('department', deptFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.data);
      if (data.meta) setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, deptFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    try {
      await api.patch(`/admin/users/${id}`, body);
      toast.success(msg);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      await load();
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete ${u.name}? Their applications and prep data will be removed.`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      toast.success('User deleted');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const bulkVerify = async () => {
    if (selected.size === 0) return;
    try {
      const { data } = await api.post('/admin/users/bulk-verify', { userIds: [...selected] });
      toast.success(data.data.message);
      setSelected(new Set());
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setEditForm({
      cgpa: String(u.cgpa),
      backlogs: String(u.backlogs),
      batch: String(u.batch),
      department: u.department,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await patch(
      editing._id,
      {
        cgpa: Number(editForm.cgpa),
        backlogs: Number(editForm.backlogs),
        batch: Number(editForm.batch),
        department: editForm.department,
      },
      'Profile updated'
    );
    setEditing(null);
  };

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Roles drive every permission in CampusConnect — student, coordinator and admin see different worlds."
        action={
          <Button variant="outline" onClick={() => void bulkVerify()} disabled={selected.size === 0}>
            <ShieldCheck size={15} /> Verify selected ({selected.size})
          </Button>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px]">
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-base pl-9"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </label>
          <Select
            label=""
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as UserRole | '');
            }}
          >
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="coordinator">Coordinators</option>
            <option value="admin">Admins</option>
          </Select>
          <Select
            label=""
            value={deptFilter}
            onChange={(e) => {
              setPage(1);
              setDeptFilter(e.target.value);
            }}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <p className="py-20 text-center text-slate-400">Loading users…</p>
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon size={36} />} title="No users match" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="table-base min-w-[860px]">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    checked={users.every((u) => selected.has(u._id)) && users.length > 0}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(users.map((u) => u._id)) : new Set())
                    }
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Dept</th>
                <th>Batch</th>
                <th>CGPA</th>
                <th>Backlogs</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td>
                    {u._id !== me?._id && (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                        checked={selected.has(u._id)}
                        onChange={() => toggleSelect(u._id)}
                      />
                    )}
                  </td>
                  <td>
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td>
                    <Select
                      label=""
                      className="w-32"
                      value={u.role}
                      disabled={u._id === me?._id}
                      onChange={(e) => void patch(u._id, { role: e.target.value }, `Role → ${e.target.value}`)}
                    >
                      <option value="student">student</option>
                      <option value="coordinator">coordinator</option>
                      <option value="admin">admin</option>
                    </Select>
                  </td>
                  <td className="font-medium text-slate-600">{u.department}</td>
                  <td>{u.batch}</td>
                  <td className="font-medium text-slate-700">{u.cgpa.toFixed(1)}</td>
                  <td>{u.backlogs}</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => void patch(u._id, { isVerified: !u.isVerified }, u.isVerified ? 'Marked unverified' : 'Verified')}>
                        <Badge tone={u.isVerified ? 'green' : 'amber'}>{u.isVerified ? 'Verified' : 'Unverified'}</Badge>
                      </button>
                      <button onClick={() => void patch(u._id, { isActive: !u.isActive }, u.isActive ? 'Deactivated' : 'Activated')}>
                        <Badge tone={u.isActive ? 'blue' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                      </button>
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      {u._id !== me?._id && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => void remove(u)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination page={meta.page} limit={meta.limit} total={meta.total} onPage={setPage} />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit — ${editing?.name ?? ''}`}>
        {editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RoleBadge role={editing.role} /> {editing.email}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="CGPA"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={editForm.cgpa}
                onChange={(e) => setEditForm((f) => ({ ...f, cgpa: e.target.value }))}
              />
              <Input
                label="Backlogs"
                type="number"
                min={0}
                value={editForm.backlogs}
                onChange={(e) => setEditForm((f) => ({ ...f, backlogs: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Department"
                value={editForm.department}
                onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
              <Input
                label="Batch"
                type="number"
                value={editForm.batch}
                onChange={(e) => setEditForm((f) => ({ ...f, batch: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => void saveEdit()}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
