import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { api } from '../api/client';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldAlert,
  Calendar,
  Building2,
  CheckCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface ReportsPageProps {
  projects: Project[];
  selectedProjectId: string;
  currentUser: User;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  projects,
  selectedProjectId,
  currentUser,
}) => {
  const [projectFilter, setProjectFilter] = useState(selectedProjectId || 'all');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [projectFilter]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReportSummary(projectFilter !== 'all' ? projectFilter : undefined);
      setReportData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentProject = projects.find((p) => p.id === projectFilter);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Reports & Data Exports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download certified audit rosters, spreadsheet registers, and executive delay briefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Infrastructure Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          <a
            href={api.getExportCsvUrl(projectFilter !== 'all' ? projectFilter : undefined)}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download CSV</span>
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 text-slate-800 text-xs print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">BhoomiPredict AI</span>
              <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold uppercase">
                EXECUTIVE BRIEF
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-600 mt-1">
              Land Acquisition Delay Assessment & Intervention Register
            </h2>
            <div className="text-[11px] text-slate-400 mt-1">
              Scope: {currentProject ? `${currentProject.code} - ${currentProject.name}` : 'All Active Corridors'}
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 font-mono">
            <div>Generated: {reportData?.generatedAt ? new Date(reportData.generatedAt).toLocaleDateString() : '2026-10-29'}</div>
            <div>Officer: {reportData?.generatedBy || currentUser.name}</div>
            <div className="text-amber-600 font-bold mt-1">SYNTHETIC DATA DEMO</div>
          </div>
        </div>

        {/* Disclaimer Box */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Demonstration Policy & Methodology Disclaimer:</strong>
            <p className="mt-0.5">
              This report contains synthetic simulation data generated for algorithm benchmarking and workflow evaluation. Model risk probabilities and delay estimations do not constitute binding land acquisition awards or statutory legal judgments.
            </p>
          </div>
        </div>

        {/* Key Portfolio Metrics */}
        {reportData?.analytics && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              1. Executive Summary & KPIs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Land Parcels</span>
                <div className="text-base font-bold text-slate-900">{reportData.analytics.totalParcels}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Possession Handover</span>
                <div className="text-base font-bold text-emerald-700">
                  {reportData.analytics.overallProgressPercent}% ({reportData.analytics.completedParcels} parcels)
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Critical / High Risk</span>
                <div className="text-base font-bold text-rose-600">
                  {(reportData.analytics.criticalRiskParcels || 0) + (reportData.analytics.highRiskParcels || 0)}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Open Interventions</span>
                <div className="text-base font-bold text-purple-700">{reportData.analytics.openRecommendations}</div>
              </div>
            </div>
          </div>
        )}

        {/* High-Risk Parcels Roster */}
        {reportData?.sampleHighRiskParcels && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              2. Priority High-Risk Parcels Roster
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-2 border-b">Parcel Code</th>
                  <th className="p-2 border-b">Location</th>
                  <th className="p-2 border-b">Stage</th>
                  <th className="p-2 border-b">Disputes</th>
                  <th className="p-2 border-b">Risk Category</th>
                  <th className="p-2 border-b">Est. Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {reportData.sampleHighRiskParcels.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-2 font-bold text-slate-900">{p.code}</td>
                    <td className="p-2 font-sans">{p.locationName}</td>
                    <td className="p-2 font-sans capitalize">{p.stage.replace(/_/g, ' ')}</td>
                    <td className="p-2 font-sans">{p.disputesCount} dispute(s)</td>
                    <td className="p-2 uppercase font-bold text-rose-600">{p.riskCategory}</td>
                    <td className="p-2 text-rose-600 font-bold">+{p.estimatedDelayDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Items Required */}
        {reportData?.openRecommendations && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              3. Immediate Action Plan & Assigned Divisions
            </h3>
            <div className="space-y-2">
              {reportData.openRecommendations.map((rec: any) => (
                <div key={rec.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{rec.parcelCode}: {rec.recommendedAction}</span>
                    <span className="text-[10px] text-rose-700 font-mono uppercase bg-rose-50 px-2 py-0.5 rounded">
                      {rec.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{rec.reason}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Division: {rec.assignedDepartment} • Due: {rec.dueDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
          BhoomiPredict AI • Decision Support System for National & State Infrastructure Development • Generated from PostgreSQL Storage
        </div>
      </div>
    </div>
  );
};
