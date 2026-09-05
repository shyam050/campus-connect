import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Award, Briefcase, Building2, ClipboardList, GraduationCap, TrendingUp } from 'lucide-react';
import { api } from '../../api/client';
import { Card, CardHeader, PageHeader, Spinner, StatCard } from '../../components/ui';
import { STATUS_LABELS } from '../../types';
import type { Analytics } from '../../types';

const PIE_COLORS = ['#24406B', '#A8842C', '#9C3D3D', '#4A7A96', '#525866', '#77611F'];
const CHART = { bar: '#24406B', grid: '#DFE2E8', axis: '#6A7180' };

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/admin/analytics');
      setData(data.data);
    })();
  }, []);

  if (!data) return <Spinner label="Crunching placement analytics…" />;

  const { departmentStats, statusDistribution, monthlyTrend, topCompanies, overview } = data;
  const pieData = statusDistribution.map((s) => ({
    name: STATUS_LABELS[s._id] ?? s._id,
    value: s.count,
  }));

  return (
    <div>
      <PageHeader
        title="Placement Analytics"
        subtitle="Live statistics across every department, drive and application."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<GraduationCap size={20} />} label="Students" value={overview.totalStudents} hint={`${overview.coordinators} coordinators`} />
        <StatCard icon={<Briefcase size={20} />} label="Open drives" value={overview.openJobs} hint={`${overview.totalJobs} posted overall`} />
        <StatCard icon={<ClipboardList size={20} />} label="Applications" value={overview.totalApplications} hint="All time" />
        <StatCard
          icon={<Award size={20} />}
          label="Placement rate"
          value={`${overview.placementRate}%`}
          hint={`${overview.placedStudents} of ${overview.totalStudents} placed · ${overview.offers} offers`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Offers by department" subtitle="Selected applications per department" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12, fill: CHART.axis }} stroke={CHART.grid} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART.axis }} stroke={CHART.grid} />
                <Tooltip cursor={{ fill: 'rgba(31,29,24,0.04)' }} />
                <Bar dataKey="totalOffers" name="Offers" fill={CHART.bar} radius={[2, 2, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            {departmentStats.map((d) => (
              <span key={d.department} className="mr-4 inline-block">
                <b className="text-slate-600">{d.department}</b>: {d.uniqueCompanies} companies · avg CGPA {d.avgCgpa}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Pipeline status" subtitle="Where applications stand right now" />
          <div className="h-72 p-4">
            {pieData.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-slate-400">No applications yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Applications per month" subtitle="Last 6 months" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: CHART.axis }} stroke={CHART.grid} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART.axis }} stroke={CHART.grid} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke={CHART.bar} strokeWidth={2} dot={{ r: 3, fill: CHART.bar }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Most applied companies" subtitle="Top drives by application volume" />
          <div className="divide-y divide-slate-100">
            {topCompanies.map((c, i) => (
              <div key={c._id} className="flex items-center gap-3 px-5 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-sm border border-slate-300 bg-paper-deep font-display text-xs font-semibold text-slate-700">
                  {c._id[0]}
                </div>
                <p className="flex-1 text-sm font-medium text-slate-700">{c._id}</p>
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{c.applications}</span>
                </div>
                <span className="w-5 text-right text-xs text-slate-400">#{i + 1}</span>
              </div>
            ))}
            {topCompanies.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                <Building2 size={20} className="mx-auto mb-2" /> No application data yet.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
