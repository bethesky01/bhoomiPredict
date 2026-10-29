import React from 'react';
import { Project, Parcel } from '../types';
import { RiskBadge, StageBadge } from '../components/RiskBadge';
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ListTodo,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardPageProps {
  analytics: any;
  projects: Project[];
  parcels: Parcel[];
  onSelectParcel: (parcel: Parcel) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  projects,
  parcels,
  onSelectParcel,
  onNavigateTab,
}) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  const criticalParcels = parcels
    .filter((p) => p.riskCategory === 'critical' || (p.riskCategory === 'high' && p.criticalPath))
    .slice(0, 6);

  const kpis = [
    {
      label: 'Infrastructure Projects',
      value: analytics.totalProjects,
      sub: 'Active corridors & packages',
      icon: Building2,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200',
    },
    {
      label: 'Total Land Parcels',
      value: analytics.totalParcels,
      sub: 'Registered survey holdings',
      icon: MapPin,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200',
    },
    {
      label: 'Possession Completed',
      value: analytics.completedParcels,
      sub: `${analytics.overallProgressPercent}% acquisition progress`,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200',
    },
    {
      label: 'Critical / High Risk',
      value: (analytics.criticalRiskParcels || 0) + (analytics.highRiskParcels || 0),
      sub: `${analytics.criticalRiskParcels || 0} critical, ${analytics.highRiskParcels || 0} high`,
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200',
    },
    {
      label: 'Overdue Milestones',
      value: analytics.overdueMilestones,
      sub: 'Statutory or survey delays',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200',
    },
    {
      label: 'Open Interventions',
      value: analytics.openRecommendations,
      sub: 'Targeted mitigation actions',
      icon: ListTodo,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Delay Analytics Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time decision support modeling acquisition bottlenecks, delay probabilities, and schedule float.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Overall Progress: <strong className="text-slate-900">{analytics.overallProgressPercent}%</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold text-slate-900">{kpi.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Parcel Risk Distribution</h2>
              <p className="text-[11px] text-slate-500">Predicted delay probability segments</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {analytics.totalParcels} Parcels
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={analytics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {analytics.riskDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} parcels`, name]}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {analytics.riskDistribution.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-2 py-1 rounded bg-slate-50">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-900 text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Distribution Bar Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Acquisition Stage Bottlenecks</h2>
              <p className="text-[11px] text-slate-500">Distribution of holdings across legal & procedural stages</p>
            </div>
            <button
              onClick={() => onNavigateTab('parcels')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.stageDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 9, fill: '#64748B' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: any) => [`${value} parcels`, 'Count']}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Path & High Risk Parcels Alert Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Priority Critical-Path Watchlist</h2>
              <p className="text-[11px] text-slate-500">Parcels on the civil construction critical path with high delay probability</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('parcels')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            Explore all {parcels.length} parcels <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Parcel Code</th>
                <th className="py-2.5 px-4 font-semibold">Location / District</th>
                <th className="py-2.5 px-4 font-semibold">Stage</th>
                <th className="py-2.5 px-4 font-semibold">Disputes / Title</th>
                <th className="py-2.5 px-4 font-semibold">Risk Level</th>
                <th className="py-2.5 px-4 font-semibold">Est. Delay Days</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalParcels.map((parcel) => (
                <tr key={parcel.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      {parcel.code}
                      {parcel.criticalPath && (
                        <span className="px-1 py-0.2 text-[9px] rounded bg-rose-100 text-rose-800 font-bold tracking-tight">
                          CP
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    <div className="font-medium">{parcel.locationName}</div>
                    <div className="text-[10px] text-slate-400">{parcel.district}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    <StageBadge stage={parcel.stage} />
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold ${parcel.disputesCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {parcel.disputesCount} dispute(s)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      Title: {parcel.ownershipVerificationStatus.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <RiskBadge level={parcel.riskCategory} score={parcel.delayRiskScore} />
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-rose-600">
                    +{parcel.estimatedDelayDays || 0} days
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onSelectParcel(parcel)}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition"
                    >
                      Inspect Risk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
