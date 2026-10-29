import React, { useState } from 'react';
import { Project, Parcel, User } from '../types';
import { api } from '../api/client';
import {
  Building2,
  Plus,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
  parcels: Parcel[];
  currentUser: User;
  onSelectProject: (id: string) => void;
  onNavigateTab: (tab: any) => void;
  onProjectCreated?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  parcels,
  currentUser,
  onSelectProject,
  onNavigateTab,
  onProjectCreated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'highway' as Project['category'],
    description: '',
    state: 'Gujarat',
    district: 'Vadodara',
    projectManager: currentUser.name,
    plannedStartDate: '2025-01-01',
    plannedCompletionDate: '2027-12-31',
    totalPlannedParcels: 50,
    priority: 'high' as Project['priority'],
    budgetEstInrCrore: 2500,
    status: 'active' as Project['status'],
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('Project Code and Name are required.');
      return;
    }
    try {
      await api.createProject(formData);
      setShowAddModal(false);
      if (onProjectCreated) onProjectCreated();
      alert('Infrastructure project created successfully.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Infrastructure Projects Portfolio</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring capital projects, corridor alignments, parcel acquisition progress, and schedule risk.
          </p>
        </div>

        {currentUser.role !== 'analyst' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const projParcels = parcels.filter((p) => p.projectId === proj.id);
          const completed = projParcels.filter((p) => p.stage === 'completed' || p.stage === 'handover').length;
          const highRisk = projParcels.filter((p) => p.riskCategory === 'high' || p.riskCategory === 'critical').length;
          const pct = projParcels.length > 0 ? Math.round((completed / projParcels.length) * 100) : 0;

          return (
            <div
              key={proj.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {proj.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-2 tracking-tight">{proj.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                      proj.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : proj.priority === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {proj.priority} Priority
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Location</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{proj.district}, {proj.state}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Project Manager</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{proj.projectManager}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Budget Est.</span>
                    <div className="font-semibold text-slate-800 mt-0.5 font-mono">₹{proj.budgetEstInrCrore} Cr</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Acquisition Handover Progress</span>
                    <span className="font-mono font-bold text-slate-900">{pct}% ({completed}/{projParcels.length || proj.totalPlannedParcels})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Risk alert badge if high risk parcels */}
                {highRisk > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {highRisk} parcel(s) flagged with High / Critical delay risk
                    </span>
                    <span className="font-bold underline cursor-pointer" onClick={() => { onSelectProject(proj.id); onNavigateTab('parcels'); }}>
                      Review
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Target: {proj.plannedCompletionDate}
                </span>
                <button
                  onClick={() => {
                    onSelectProject(proj.id);
                    onNavigateTab('parcels');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition"
                >
                  View Parcels ({projParcels.length}) <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Infrastructure Project</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-27-PKG4"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmedabad-Rajkot Expressway Expansion"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="highway">Highway / Expressway</option>
                    <option value="railway">Freight / Passenger Rail</option>
                    <option value="metro">Urban Metro Corridor</option>
                    <option value="industrial">Industrial Corridor</option>
                    <option value="transmission">Power Transmission</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State & District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Budget Est. (₹ Crore)</label>
                  <input
                    type="number"
                    value={formData.budgetEstInrCrore}
                    onChange={(e) => setFormData({ ...formData, budgetEstInrCrore: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  placeholder="Key corridor objectives and alignment notes..."
                />
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
