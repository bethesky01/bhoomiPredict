import React, { useState, useEffect } from 'react';
import { Parcel, PredictionResult, Milestone, Recommendation, User } from '../types';
import { api } from '../api/client';
import { RiskBadge, StageBadge } from './RiskBadge';
import {
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  FileText,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface ParcelDetailModalProps {
  parcel: Parcel | null;
  onClose: () => void;
  currentUser: User;
  onParcelUpdated?: (updated: Parcel) => void;
}

export const ParcelDetailModal: React.FC<ParcelDetailModalProps> = ({
  parcel,
  onClose,
  currentUser,
  onParcelUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [details, setDetails] = useState<{
    parcel: Parcel;
    project?: any;
    predictions: PredictionResult[];
    milestones: Milestone[];
    recommendations: Recommendation[];
  } | null>(null);

  useEffect(() => {
    if (parcel) {
      loadParcelDetails(parcel.id);
    }
  }, [parcel]);

  const loadParcelDetails = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getParcel(id);
      setDetails(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    if (!parcel) return;
    setPredicting(true);
    try {
      const pred = await api.runPrediction(parcel.id);
      await loadParcelDetails(parcel.id);
      if (onParcelUpdated) {
        onParcelUpdated({
          ...parcel,
          delayRiskScore: pred.delayProbability,
          riskCategory: pred.riskCategory,
          estimatedDelayDays: pred.estimatedDelayDays,
          lastPredictedAt: pred.predictedAt,
        });
      }
    } catch (err: any) {
      alert(`Prediction failed: ${err.message}`);
    } finally {
      setPredicting(false);
    }
  };

  const handleToggleRecStatus = async (recId: string, currentStatus: Recommendation['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      await api.updateRecommendationStatus(recId, nextStatus);
      if (parcel) loadParcelDetails(parcel.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!parcel) return null;

  const currentParcel = details?.parcel || parcel;
  const latestPred = details?.predictions?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
              {currentParcel.code.slice(-3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">{currentParcel.code}</h2>
                {currentParcel.criticalPath && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider">
                    Critical Path
                  </span>
                )}
                <StageBadge stage={currentParcel.stage} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentParcel.locationName} • {currentParcel.district} • {currentParcel.areaAcres} Acres
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Prediction Action Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Predicted Delay Risk</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <RiskBadge level={currentParcel.riskCategory} score={currentParcel.delayRiskScore} />
                  <span className="text-xs text-slate-600 font-semibold">
                    Est. Delay: <strong className="text-rose-600">+{currentParcel.estimatedDelayDays || 0} days</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunPrediction}
              disabled={predicting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${predicting ? 'animate-spin' : ''}`} />
              <span>{predicting ? 'Evaluating Random Forest...' : 'Run Real-Time Prediction'}</span>
            </button>
          </div>

          {/* Explainable AI (SHAP-Style Feature Contribution Breakdown) */}
          {latestPred && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Model Explainability & Contributing Factors
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Marginal feature impact breakdown (SHAP-style TreeSHAP decision path)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Model: {latestPred.modelVersion}
                </span>
              </div>

              {latestPred.dataQualityWarnings.length > 0 && (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Data Quality Notice:
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {latestPred.dataQualityWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contributing factors table / waterfall */}
              <div className="space-y-2.5">
                {latestPred.topContributingFactors.map((factor, idx) => {
                  const increases = factor.direction === 'increases_delay_risk';
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-800">{factor.label}</span>
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            increases
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {increases ? '+' : ''}
                          {(factor.impactScore * 100).toFixed(1)}% Risk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{factor.description}</p>
                      <div className="mt-1 text-[10px] text-slate-400">Current observed value: <strong className="text-slate-700">{factor.value}</strong></div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-[10px] text-slate-400 italic">
                {latestPred.disclaimer}
              </div>
            </div>
          )}

          {/* Core Parcel Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Documentation Completeness</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${currentParcel.documentationCompleteness}%` }}
                  />
                </div>
                <span className="font-semibold text-slate-900">{currentParcel.documentationCompleteness}%</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ownership Verification</span>
              <p className="font-semibold text-slate-900 mt-1 capitalize">
                {currentParcel.ownershipVerificationStatus.replace('_', ' ')}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Recorded Disputes</span>
              <p className={`font-semibold mt-1 ${currentParcel.disputesCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {currentParcel.disputesCount} Dispute(s)
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Statutory Clearances</span>
              <p className="font-semibold text-slate-900 mt-1">
                {currentParcel.pendingApprovalsCount} Pending
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Compensation Status</span>
              <p className="font-semibold text-slate-900 mt-1 capitalize">
                {currentParcel.compensationStatus.replace(/_/g, ' ')}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Survey Condition</span>
              <p className="font-semibold text-slate-900 mt-1 capitalize">
                {currentParcel.surveyStatus.replace(/_/g, ' ')}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Planned Possession</span>
              <p className="font-semibold text-slate-900 mt-1">{currentParcel.plannedPossessionDate}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Responsible Division</span>
              <p className="font-semibold text-slate-900 mt-1 truncate">{currentParcel.responsibleDepartment}</p>
            </div>
          </div>

          {/* Action Recommendations Generated */}
          {details?.recommendations && details.recommendations.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Prescribed Interventions ({details.recommendations.length})
              </h3>
              <div className="space-y-2">
                {details.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rec.status === 'completed'
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-emerald-50/30 border-emerald-200/80 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{rec.recommendedAction}</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            rec.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{rec.reason}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Assigned: {rec.assignedDepartment} • Due: {rec.dueDate}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleRecStatus(rec.id, rec.status)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border shrink-0 ${
                        rec.status === 'completed'
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      }`}
                    >
                      {rec.status === 'completed' ? 'Reopen' : 'Mark Done'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Associated Milestones */}
          {details?.milestones && details.milestones.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                Procedural Milestone Timeline
              </h3>
              <div className="space-y-2">
                {details.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Target: {m.plannedCompletionDate}
                        {m.actualCompletionDate && ` • Completed: ${m.actualCompletionDate}`}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded capitalize ${
                        m.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'delayed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
