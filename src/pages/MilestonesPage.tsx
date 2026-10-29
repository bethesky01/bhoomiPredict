import React, { useState, useEffect } from 'react';
import { Milestone, Project, User } from '../types';
import { api } from '../api/client';
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitFork,
  ArrowRight,
  X,
} from 'lucide-react';

interface MilestonesPageProps {
  projects: Project[];
  selectedProjectId: string;
  currentUser: User;
}

export const MilestonesPage: React.FC<MilestonesPageProps> = ({
  projects,
  selectedProjectId,
  currentUser,
}) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectFilter, setProjectFilter] = useState(selectedProjectId || 'all');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<Partial<Milestone>>({
    projectId: projects[0]?.id || 'proj-1',
    name: '',
    description: '',
    plannedStartDate: '2026-01-01',
    plannedCompletionDate: '2026-06-30',
    status: 'in_progress',
    responsibleDepartment: 'Revenue & Documentation Wing',
    criticalPath: true,
    dependencyIds: [],
  });

  useEffect(() => {
    loadMilestones();
  }, [projectFilter]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const res = await api.getMilestones(projectFilter !== 'all' ? projectFilter : undefined);
      setMilestones(res.results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Milestone['status']) => {
    try {
      const updates: Partial<Milestone> = { status: newStatus };
      if (newStatus === 'completed') {
        updates.actualCompletionDate = new Date().toISOString().split('T')[0];
      }
      await api.updateMilestone(id, updates);
      loadMilestones();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Milestone name is required');
      return;
    }
    try {
      await api.createMilestone(formData);
      setShowAddModal(false);
      loadMilestones();
      alert('Milestone created.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = milestones.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Milestones & Schedule float Timeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procedural milestones under RFCTLARR statutory rules with critical-path dependency tracking.
          </p>
        </div>

        {currentUser.role !== 'analyst' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>
        )}
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
            <option value="">All Milestone Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="delayed">Delayed</option>
            <option value="blocked">Blocked</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500">
          Showing <strong className="text-slate-900">{filtered.length}</strong> milestones
        </div>
      </div>

      {/* Milestones List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading milestones...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No milestones found.</div>
          ) : (
            filtered.map((ms) => {
              const proj = projects.find((p) => p.id === ms.projectId);
              const isOverdue = ms.status === 'delayed' || (ms.status === 'in_progress' && new Date(ms.plannedCompletionDate) < new Date('2026-10-29'));

              return (
                <div key={ms.id} className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{ms.name}</span>
                      {ms.criticalPath && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-100 text-rose-800 font-bold uppercase tracking-tight">
                          Critical Path
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">({proj?.code || ms.projectId})</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{ms.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-1">
                      <span>Target: <strong className="text-slate-700">{ms.plannedCompletionDate}</strong></span>
                      {ms.actualCompletionDate && (
                        <span>Finished: <strong className="text-emerald-700">{ms.actualCompletionDate}</strong></span>
                      )}
                      <span>Division: <strong className="text-slate-700">{ms.responsibleDepartment}</strong></span>
                      {ms.dependencyIds.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <GitFork className="w-3 h-3" /> Depends on {ms.dependencyIds.length} milestone(s)
                        </span>
                      )}
                    </div>

                    {ms.blockerDescription && (
                      <div className="mt-1 p-2 rounded bg-amber-50 text-amber-800 text-[11px] flex items-center gap-1.5 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><strong>Identified Blocker:</strong> {ms.blockerDescription}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize ${
                        ms.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ms.status === 'delayed'
                          ? 'bg-rose-100 text-rose-800'
                          : ms.status === 'blocked'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ms.status.replace('_', ' ')}
                    </span>

                    {currentUser.role !== 'analyst' && (
                      <select
                        value={ms.status}
                        onChange={(e) => handleStatusChange(ms.id, e.target.value as any)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 shadow-xs"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="delayed">Delayed</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-base font-bold text-slate-900">Add Project Milestone</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joint Measurement Survey Certification"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Planned Start Date</label>
                  <input
                    type="date"
                    value={formData.plannedStartDate}
                    onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={formData.plannedCompletionDate}
                    onChange={(e) => setFormData({ ...formData, plannedCompletionDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Responsible Division</label>
                <input
                  type="text"
                  value={formData.responsibleDepartment}
                  onChange={(e) => setFormData({ ...formData, responsibleDepartment: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="msCp"
                  checked={formData.criticalPath}
                  onChange={(e) => setFormData({ ...formData, criticalPath: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="msCp" className="text-slate-800 font-medium">
                  Critical-Path Milestone (Schedule Impact)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
