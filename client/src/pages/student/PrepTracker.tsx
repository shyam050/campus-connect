import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Flame, GraduationCap, Link2, Plus, Target, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '../../api/client';
import { Button, Card, EmptyState, Input, Modal, PageHeader, ProgressBar } from '../../components/ui';
import { fmtDate } from '../../utils/format';
import type { PrepModule, PrepSummary } from '../../types';

export default function PrepTracker() {
  const [summary, setSummary] = useState<PrepSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [addingSub, setAddingSub] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const { data } = await api.get('/prep');
      setSummary(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createModule = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/prep', { title: newTitle, targetDate: newTarget || undefined });
      setNewTitle('');
      setNewTarget('');
      setShowAdd(false);
      toast.success('Module created');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  // Optimistic toggle → PATCH /prep/:moduleId/subtopics/:subtopicIndex
  const toggle = async (module: PrepModule, index: number) => {
    const next = !module.subtopics[index].completed;
    setSummary((s) => {
      if (!s) return s;
      return {
        ...s,
        modules: s.modules.map((m) =>
          m._id === module._id
            ? {
                ...m,
                subtopics: m.subtopics.map((st, i) => (i === index ? { ...st, completed: next } : st)),
              }
            : m
        ),
      };
    });
    try {
      const { data } = await api.patch(`/prep/${module._id}/subtopics/${index}`, { completed: next });
      setSummary((s) => {
        if (!s) return s;
        const modules = s.modules.map((m) => {
          if (m._id !== module._id) return m;
          const updated = data.data.module as PrepModule;
          return { ...m, ...updated, progress: data.data.progress };
        });
        return { ...s, modules, streak: data.data.streak };
      });
    } catch (err) {
      toast.error(apiErrorMessage(err));
      await load();
    }
  };

  const addSubtopic = async (module: PrepModule) => {
    const title = addingSub[module._id]?.trim();
    if (!title) return;
    try {
      await api.post(`/prep/${module._id}/subtopics`, { title });
      setAddingSub((m) => ({ ...m, [module._id]: '' }));
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const deleteSubtopic = async (module: PrepModule, index: number) => {
    try {
      await api.delete(`/prep/${module._id}/subtopics/${index}`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const deleteModule = async (module: PrepModule) => {
    if (!confirm(`Delete "${module.title}" and its progress?`)) return;
    try {
      await api.delete(`/prep/${module._id}`);
      toast.success('Module deleted');
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  if (loading) return <p className="py-20 text-center text-slate-400">Loading prep tracker…</p>;

  return (
    <div>
      <PageHeader
        title="Prep Tracker"
        subtitle="Own your readiness. Check off subtopics to build progress and keep your daily streak alive."
        action={<Button onClick={() => setShowAdd(true)}><Plus size={15} /> New module</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-sm border border-brand-200 bg-brand-50 text-brand-700">
            <Target size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall progress</p>
            <p className="text-2xl font-bold text-slate-800">{summary?.overall ?? 0}%</p>
            <ProgressBar value={summary?.overall ?? 0} className="mt-2 w-48" />
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 place-items-center rounded-sm border border-clay/25 bg-clay-tint text-clay">
            <Flame size={20} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Study streak</p>
            <p className="text-2xl font-bold text-slate-800">
              {summary?.streak ?? 0} day{(summary?.streak ?? 0) === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-slate-400">Toggle any subtopic today to keep it going</p>
          </div>
        </Card>
      </div>

      {summary?.modules.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={36} />}
          title="No prep modules yet"
          subtitle="Create modules like DSA, System Design or Aptitude and break them into trackable subtopics."
          action={<Button onClick={() => setShowAdd(true)}>Create my first module</Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {summary?.modules.map((m) => (
            <Card key={m._id} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{m.title}</h3>
                  {m.targetDate && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Target size={11} /> Target: {fmtDate(m.targetDate)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-600">{m.progress ?? 0}%</span>
                  <button
                    onClick={() => void deleteModule(m)}
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete module"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <ProgressBar value={m.progress ?? 0} className="mb-4" />

              <ul className="space-y-2">
                {m.subtopics.map((st, i) => (
                  <li key={i} className="group flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => void toggle(m, i)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${st.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {st.title}
                      </p>
                      {st.resources.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {st.resources.map((r, ri) => (
                            <a
                              key={ri}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:text-brand-600"
                            >
                              <Link2 size={10} /> {r.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => void deleteSubtopic(m, i)}
                      className="hidden rounded p-1 text-slate-300 hover:text-red-500 group-hover:block"
                      title="Remove subtopic"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
                {m.subtopics.length === 0 && <li className="px-2 text-xs text-slate-400">No subtopics yet.</li>}
              </ul>

              <div className="mt-3 flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="Add a subtopic…"
                  value={addingSub[m._id] ?? ''}
                  onChange={(e) => setAddingSub((s) => ({ ...s, [m._id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && void addSubtopic(m)}
                />
                <Button variant="outline" size="sm" onClick={() => void addSubtopic(m)}>
                  <Plus size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New prep module">
        <form onSubmit={createModule} className="space-y-4">
          <Input
            label="Module title"
            required
            placeholder="e.g. DSA, System Design, Aptitude"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Input
            label="Target date (optional)"
            type="date"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Create module</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
