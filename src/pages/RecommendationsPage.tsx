import React, { useState, useEffect } from 'react';
import { Recommendation, Project, Parcel, User } from '../types';
import { api } from '../api/client';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Filter,
  Check,
} from 'lucide-react';

interface RecommendationsPageProps {
  projects: Project[];
  selectedProjectId: string;
  currentUser: User;
  onSelectParcelByCode?: (code: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  projects,
  selectedProjectId,
  currentUser,
  onSelectParcelByCode,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState(selectedProjectId || 'all');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, [projectFilter, statusFilter, priorityFilter]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getRecommendations({
        projectId: projectFilter !== 'all' ? projectFilter : undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setRecommendations(res.results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Recommendation['status']) => {
    try {
      await api.updateRecommendationStatus(id, newStatus);
      loadRecommendations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openCount = recommendations.filter((r) => r.status === 'open' || r.status === 'in_progress').length;
  const completedCount = recommendations.filter((r) => r.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Prescriptive Intervention & Action Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-recommended statutory and field mitigation tasks translated directly from detected parcel risk factors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
            {openCount} Pending Interventions
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
            {completedCount} Resolved
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Infrastructure Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500">
          Showing <strong className="text-slate-900">{recommendations.length}</strong> action items
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            Loading action center...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
            No action items found matching criteria.
          </div>
        ) : (
          recommendations.map((rec) => {
            const isCompleted = rec.status === 'completed';

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                  isCompleted
                    ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                    : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded cursor-pointer hover:underline ${
                        isCompleted ? 'bg-slate-200 text-slate-700' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                      onClick={() => onSelectParcelByCode && onSelectParcelByCode(rec.parcelCode)}
                      title="Inspect parcel"
                    >
                      {rec.parcelCode}
                    </span>

                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        rec.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {rec.priority} Priority
                    </span>

                    <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                      Issue: {rec.detectedIssue}
                    </span>
                  </div>

                  <div className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {rec.recommendedAction}
                  </div>

                  <p className="text-[11px] text-slate-600">{rec.reason}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-1">
                    <span>Division: <strong className="text-slate-700">{rec.assignedDepartment}</strong></span>
                    {rec.assignedUser && (
                      <span>Nodal Officer: <strong className="text-slate-700">{rec.assignedUser}</strong></span>
                    )}
                    <span>Target Due Date: <strong className="text-slate-700">{rec.dueDate}</strong></span>
                    {rec.completedAt && (
                      <span className="text-emerald-700 font-semibold">Resolved on {rec.completedAt.split('T')[0]}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={rec.status}
                    onChange={(e) => handleUpdateStatus(rec.id, e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed / Resolved</option>
                  </select>

                  <button
                    onClick={() => handleUpdateStatus(rec.id, isCompleted ? 'open' : 'completed')}
                    className={`p-1.5 rounded-lg border transition ${
                      isCompleted
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    }`}
                    title={isCompleted ? 'Re-open intervention' : 'Mark completed'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
