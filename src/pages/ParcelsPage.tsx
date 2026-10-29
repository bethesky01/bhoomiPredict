import React, { useState, useEffect } from 'react';
import { Parcel, Project, RiskLevel, AcquisitionStage, User } from '../types';
import { api } from '../api/client';
import { RiskBadge, StageBadge } from '../components/RiskBadge';
import {
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  X,
} from 'lucide-react';

interface ParcelsPageProps {
  projects: Project[];
  selectedProjectId: string;
  currentUser: User;
  onSelectParcel: (parcel: Parcel) => void;
}

export const ParcelsPage: React.FC<ParcelsPageProps> = ({
  projects,
  selectedProjectId,
  currentUser,
  onSelectParcel,
}) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [projectIdFilter, setProjectIdFilter] = useState(selectedProjectId || 'all');
  const [stageFilter, setStageFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [criticalPathOnly, setCriticalPathOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ importedCount: number; errors: { row: number; reason: string }[] } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Parcel>>({
    code: '',
    projectId: projects[0]?.id || 'proj-1',
    district: 'Vadodara',
    locationName: '',
    areaAcres: 2.5,
    stage: 'identification',
    status: 'in_progress',
    documentationCompleteness: 45,
    ownershipVerificationStatus: 'in_progress',
    pendingApprovalsCount: 1,
    disputesCount: 0,
    compensationStatus: 'under_assessment',
    surveyStatus: 'in_progress',
    plannedStartDate: '2025-06-01',
    plannedPossessionDate: '2026-12-31',
    criticalPath: false,
    responsibleDepartment: 'Revenue & Documentation Wing',
  });

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== 'all') {
      setProjectIdFilter(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadParcels();
  }, [projectIdFilter, stageFilter, riskFilter, criticalPathOnly, searchQuery, page, sortBy, sortOrder]);

  const loadParcels = async () => {
    setLoading(true);
    try {
      const res = await api.getParcels({
        projectId: projectIdFilter,
        stage: stageFilter || undefined,
        riskCategory: riskFilter || undefined,
        criticalPath: criticalPathOnly ? true : undefined,
        search: searchQuery || undefined,
        page,
        pageSize: 15,
        sortBy,
        sortOrder,
      });
      setParcels(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.projectId || !formData.locationName) {
      alert('Please fill all required fields (Code, Project, Location).');
      return;
    }
    try {
      await api.createParcel(formData);
      setShowAddModal(false);
      loadParcels();
      alert('Land parcel added successfully with real-time risk evaluation.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkImport = async () => {
    if (!csvText.trim()) {
      alert('Please paste or provide CSV content.');
      return;
    }
    const targetProject = projectIdFilter !== 'all' ? projectIdFilter : projects[0]?.id || 'proj-1';
    try {
      const res = await api.bulkImportParcels(csvText, targetProject);
      setImportResult(res);
      loadParcels();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Land Parcels Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive registry of land acquisition holdings with ML delay risk scoring & milestone tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl(projectIdFilter !== 'all' ? projectIdFilter : undefined)}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>

          {currentUser.role !== 'analyst' && (
            <>
              <button
                onClick={() => {
                  setImportResult(null);
                  setShowImportModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Bulk CSV Import</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Parcel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, location, district..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Project Filter */}
          <select
            value={projectIdFilter}
            onChange={(e) => {
              setProjectIdFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Infrastructure Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Acquisition Stages</option>
            <option value="identification">Identification</option>
            <option value="survey">Survey & JMS</option>
            <option value="ownership_verification">Ownership Verification</option>
            <option value="valuation_and_compensation">Valuation & Compensation</option>
            <option value="approval">Approval Queue</option>
            <option value="award">Award Declaration</option>
            <option value="possession">Possession Phase</option>
            <option value="handover">Civil Handover</option>
            <option value="completed">Completed</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Delay Risk Levels</option>
            <option value="critical">Critical Risk (≥ 80%)</option>
            <option value="high">High Risk (60% - 79%)</option>
            <option value="medium">Medium Risk (30% - 59%)</option>
            <option value="low">Low Risk (&lt; 30%)</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so as any);
            }}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="riskScore:desc">Sort: Highest Risk First</option>
            <option value="riskScore:asc">Sort: Lowest Risk First</option>
            <option value="delayDays:desc">Sort: Longest Delay Days</option>
            <option value="area:desc">Sort: Largest Area</option>
            <option value="code:asc">Sort: Parcel Code (A-Z)</option>
          </select>
        </div>

        {/* Toggle Bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={criticalPathOnly}
              onChange={(e) => {
                setCriticalPathOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Critical Path Parcels Only</span>
          </label>
          <div className="text-slate-500 text-[11px]">
            Found <strong className="text-slate-900">{total}</strong> matching parcel records
          </div>
        </div>
      </div>

      {/* Parcels Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Parcel Code</th>
                <th className="py-3 px-4 font-semibold">Location & District</th>
                <th className="py-3 px-4 font-semibold">Acquisition Stage</th>
                <th className="py-3 px-4 font-semibold">Area (Acres)</th>
                <th className="py-3 px-4 font-semibold">Doc Completeness</th>
                <th className="py-3 px-4 font-semibold">Disputes</th>
                <th className="py-3 px-4 font-semibold">Delay Probability</th>
                <th className="py-3 px-4 font-semibold">Est. Delay</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Loading parcels...
                  </td>
                </tr>
              ) : parcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No land parcels found matching selected filters.
                  </td>
                </tr>
              ) : (
                parcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{parcel.code}</span>
                        {parcel.criticalPath && (
                          <span
                            title="Critical Path Activity"
                            className="px-1 py-0.2 rounded text-[9px] bg-rose-100 text-rose-800 font-bold"
                          >
                            CP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-800">{parcel.locationName}</div>
                      <div className="text-[10px] text-slate-400">{parcel.district}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <StageBadge stage={parcel.stage} />
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium">{parcel.areaAcres} ac</td>
                    <td className="py-2.5 px-4">
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mb-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            parcel.documentationCompleteness < 50
                              ? 'bg-rose-500'
                              : parcel.documentationCompleteness < 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${parcel.documentationCompleteness}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{parcel.documentationCompleteness}%</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`font-semibold ${
                          parcel.disputesCount > 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {parcel.disputesCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <RiskBadge level={parcel.riskCategory} score={parcel.delayRiskScore} />
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-rose-600">
                      {parcel.estimatedDelayDays ? `+${parcel.estimatedDelayDays}d` : '0d'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onSelectParcel(parcel)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages || 1}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Parcel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Add Land Parcel Record</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateParcel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Parcel Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NH-48-PKG2-P099"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Infrastructure Project *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Location / Survey Village *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ankleshwar Village Survey 412"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Area (Acres) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={formData.areaAcres}
                    onChange={(e) => setFormData({ ...formData, areaAcres: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Acquisition Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="identification">Identification</option>
                    <option value="survey">Survey</option>
                    <option value="ownership_verification">Ownership Verification</option>
                    <option value="valuation_and_compensation">Valuation & Compensation</option>
                    <option value="approval">Approval</option>
                    <option value="award">Award</option>
                    <option value="possession">Possession</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Doc Completeness (0-100%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.documentationCompleteness}
                    onChange={(e) => setFormData({ ...formData, documentationCompleteness: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ownership Title Status</label>
                  <select
                    value={formData.ownershipVerificationStatus}
                    onChange={(e) => setFormData({ ...formData, ownershipVerificationStatus: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="verified">Verified (Single clear title)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="disputed">Disputed (Court / Tribal caveat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Recorded Disputes Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.disputesCount}
                    onChange={(e) => setFormData({ ...formData, disputesCount: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cpCheck"
                  checked={formData.criticalPath}
                  onChange={(e) => setFormData({ ...formData, criticalPath: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="cpCheck" className="text-slate-800 font-medium">
                  Critical-path item for project schedule
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
                  Save & Predict Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Bulk CSV Land Parcel Import</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Paste CSV rows or load from file. Expected columns:
              <br />
              <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] text-slate-800 font-mono">
                code, projectId, district, location, areaAcres, stage, status, docCompleteness
              </code>
            </p>

            <textarea
              rows={7}
              placeholder={`NH-48-PKG2-P901,proj-1,Vadodara,Sector 7 Bypass,3.2,survey,in_progress,60\nNH-48-PKG2-P902,proj-1,Vadodara,Interchange North,4.5,valuation_and_compensation,in_progress,75`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 mb-3"
            />

            {importResult && (
              <div className="p-3 mb-3 rounded-lg border text-xs bg-slate-50">
                <div className="font-semibold text-emerald-700">
                  Imported: {importResult.importedCount} parcels successfully!
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-rose-700 space-y-1">
                    <span className="font-bold">Errors encountered:</span>
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-[11px]">
                        Row {err.row}: {err.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs"
              >
                Validate & Import Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
