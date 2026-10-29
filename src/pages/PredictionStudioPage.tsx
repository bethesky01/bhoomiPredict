import React, { useState } from 'react';
import { Parcel, Project, PredictionResult } from '../types';
import { runModelInference, generateRecommendationsForParcel } from '../lib/ml_engine';
import { RiskBadge, StageBadge } from '../components/RiskBadge';
import {
  Sparkles,
  Sliders,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PredictionStudioPageProps {
  parcels: Parcel[];
  projects: Project[];
  onSelectParcel: (parcel: Parcel) => void;
}

export const PredictionStudioPage: React.FC<PredictionStudioPageProps> = ({
  parcels,
  projects,
  onSelectParcel,
}) => {
  // Currently simulated scenario parcel
  const [selectedParcelId, setSelectedParcelId] = useState<string>(parcels[0]?.id || '');

  const baseParcel = parcels.find((p) => p.id === selectedParcelId) || parcels[0];

  // What-if scenario state
  const [docCompleteness, setDocCompleteness] = useState<number>(baseParcel?.documentationCompleteness ?? 45);
  const [disputesCount, setDisputesCount] = useState<number>(baseParcel?.disputesCount ?? 1);
  const [pendingApprovals, setPendingApprovals] = useState<number>(baseParcel?.pendingApprovalsCount ?? 2);
  const [ownershipStatus, setOwnershipStatus] = useState<Parcel['ownershipVerificationStatus']>(
    baseParcel?.ownershipVerificationStatus ?? 'in_progress'
  );
  const [compensationStatus, setCompensationStatus] = useState<Parcel['compensationStatus']>(
    baseParcel?.compensationStatus ?? 'under_assessment'
  );
  const [criticalPath, setCriticalPath] = useState<boolean>(baseParcel?.criticalPath ?? true);
  const [stage, setStage] = useState<Parcel['stage']>(baseParcel?.stage ?? 'valuation_and_compensation');

  // When parcel changes, reset sliders to its base values
  const handleSelectParcel = (id: string) => {
    setSelectedParcelId(id);
    const p = parcels.find((x) => x.id === id);
    if (p) {
      setDocCompleteness(p.documentationCompleteness);
      setDisputesCount(p.disputesCount);
      setPendingApprovals(p.pendingApprovalsCount);
      setOwnershipStatus(p.ownershipVerificationStatus);
      setCompensationStatus(p.compensationStatus);
      setCriticalPath(p.criticalPath);
      setStage(p.stage);
    }
  };

  // Synthetic simulated scenario parcel
  const simulatedParcel: Parcel = {
    ...baseParcel,
    documentationCompleteness: docCompleteness,
    disputesCount,
    pendingApprovalsCount: pendingApprovals,
    ownershipVerificationStatus: ownershipStatus,
    compensationStatus,
    criticalPath,
    stage,
  };

  const project = projects.find((pr) => pr.id === simulatedParcel.projectId);
  const prediction: PredictionResult = runModelInference(simulatedParcel, project?.name || 'Project');
  const recommendations = generateRecommendationsForParcel(simulatedParcel, prediction);

  // Compare with baseline
  const baselinePrediction: PredictionResult = baseParcel
    ? runModelInference(baseParcel, project?.name || 'Project')
    : prediction;

  const probDelta = prediction.delayProbability - baselinePrediction.delayProbability;
  const daysDelta = prediction.estimatedDelayDays - baselinePrediction.estimatedDelayDays;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ML Delay Risk Prediction Studio</h1>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
              RandomForest AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inference & sensitivity simulator: assess what happens when land bottlenecks are mitigated.
          </p>
        </div>

        {/* Parcel Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium">Select Parcel Baseline:</label>
          <select
            value={selectedParcelId}
            onChange={(e) => handleSelectParcel(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-500"
          >
            {parcels.slice(0, 50).map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} ({p.riskCategory?.toUpperCase()} • {p.stage})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: What-If Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                What-If Scenario Tuning
              </h2>
            </div>
            <button
              onClick={() => handleSelectParcel(selectedParcelId)}
              className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Slider 1: Documentation Completeness */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Documentation Completeness</span>
              <span className="font-mono font-bold text-emerald-700">{docCompleteness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={docCompleteness}
              onChange={(e) => setDocCompleteness(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% Missing Records</span>
              <span>100% Fully Certified Dossier</span>
            </div>
          </div>

          {/* Slider 2: Recorded Disputes Count */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Recorded Objections & Disputes</span>
              <span className="font-mono font-bold text-rose-600">{disputesCount} Dispute(s)</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={disputesCount}
              onChange={(e) => setDisputesCount(parseInt(e.target.value, 10))}
              className="w-full accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 Uncontested</span>
              <span>5 Heavy Legal Challenges</span>
            </div>
          </div>

          {/* Slider 3: Pending Approvals */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">Pending Statutory Approvals</span>
              <span className="font-mono font-bold text-slate-800">{pendingApprovals} Clearances</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={pendingApprovals}
              onChange={(e) => setPendingApprovals(parseInt(e.target.value, 10))}
              className="w-full accent-sky-600"
            />
          </div>

          {/* Select: Title & Ownership Verification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title Ownership Verification Status
            </label>
            <select
              value={ownershipStatus}
              onChange={(e) => setOwnershipStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="verified">Verified (Clear Authenticated Title)</option>
              <option value="in_progress">In Progress (Revenue scrutiny)</option>
              <option value="pending">Pending (Not yet submitted)</option>
              <option value="disputed">Disputed (Caveat / Rival Claimants)</option>
            </select>
          </div>

          {/* Select: Compensation Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Compensation Valuation & Disbursement
            </label>
            <select
              value={compensationStatus}
              onChange={(e) => setCompensationStatus(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="assessed_and_paid">Assessed & Fully Disbursed</option>
              <option value="assessed_pending_payment">Assessed (Awaiting Payment)</option>
              <option value="under_assessment">Under Assessment (Joint Measurement)</option>
              <option value="disputed">Disputed Award Valuation</option>
            </select>
          </div>

          {/* Select: Acquisition Stage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Procedural Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="identification">Identification</option>
              <option value="survey">Survey</option>
              <option value="ownership_verification">Ownership Verification</option>
              <option value="valuation_and_compensation">Valuation & Compensation</option>
              <option value="approval">Approval</option>
              <option value="award">Award</option>
              <option value="possession">Possession</option>
              <option value="completed">Completed / Handed Over</option>
            </select>
          </div>

          {/* Critical Path Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Project Critical Path Item</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={criticalPath}
                onChange={(e) => setCriticalPath(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Right Column: Live Model Inference & SHAP Decomposition (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Output Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Scenario Inference Result</h2>
                  <p className="text-[11px] text-slate-400">RandomForest Ensemble Model Output</p>
                </div>
              </div>
              <RiskBadge level={prediction.riskCategory} score={prediction.delayProbability} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Delay Probability</span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {prediction.delayProbabilityPercent}%
                </div>
                {probDelta !== 0 && (
                  <div
                    className={`text-[10px] flex items-center gap-0.5 mt-0.5 font-semibold ${
                      probDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {probDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {probDelta > 0 ? '+' : ''}
                    {Math.round(probDelta * 100)}% vs baseline
                  </div>
                )}
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Estimated Delay Days</span>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  +{prediction.estimatedDelayDays}d
                </div>
                {daysDelta !== 0 && (
                  <div
                    className={`text-[10px] flex items-center gap-0.5 mt-0.5 font-semibold ${
                      daysDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {daysDelta > 0 ? '+' : ''}
                    {daysDelta} days delta
                  </div>
                )}
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400">Intervention Impact</span>
                <div className="text-xs font-semibold text-slate-200 mt-1">
                  {probDelta < -0.15 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Strong Delay Reduction
                    </span>
                  ) : probDelta > 0.15 ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertOctagon className="w-4 h-4" /> High Critical Escalation
                    </span>
                  ) : (
                    <span className="text-slate-300">Marginal Variance</span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-800/80">
              {prediction.disclaimer}
            </p>
          </div>

          {/* Top Contributing Feature Breakdown (SHAP-Style) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Feature Attributions for this Scenario
            </h2>
            <div className="space-y-2">
              {prediction.topContributingFactors.map((factor, idx) => {
                const increases = factor.direction === 'increases_delay_risk';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{factor.label}</div>
                      <div className="text-[11px] text-slate-500">{factor.description}</div>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 ml-3 ${
                        increases
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {increases ? '+' : ''}
                      {(factor.impactScore * 100).toFixed(1)}% Risk
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Interventions Generated by Decision Engine */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Prioritized Remediation Actions ({recommendations.length})
            </h2>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-xl border border-emerald-200/60 bg-emerald-50/20 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{rec.recommendedAction}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        rec.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{rec.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
