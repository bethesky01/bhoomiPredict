import React from 'react';
import { RiskLevel, AcquisitionStage } from '../types';
import { ShieldCheck, AlertCircle, AlertOctagon, AlertTriangle } from 'lucide-react';

export const RiskBadge: React.FC<{ level?: RiskLevel; score?: number; showIcon?: boolean }> = ({
  level = 'low',
  score,
  showIcon = true,
}) => {
  const configs = {
    low: {
      label: 'Low Risk',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      icon: ShieldCheck,
    },
    medium: {
      label: 'Medium Risk',
      bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
      icon: AlertTriangle,
    },
    high: {
      label: 'High Risk',
      bg: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
      icon: AlertCircle,
    },
    critical: {
      label: 'Critical Risk',
      bg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 font-semibold',
      icon: AlertOctagon,
    },
  };

  const config = configs[level] || configs.low;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border font-medium ${config.bg}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="font-mono text-[11px] opacity-80">({Math.round(score * 100)}%)</span>
      )}
    </span>
  );
};

export const StageBadge: React.FC<{ stage: AcquisitionStage }> = ({ stage }) => {
  const stageLabels: Record<AcquisitionStage, { label: string; color: string }> = {
    identification: { label: 'Identification', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    survey: { label: 'Survey & JMS', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    ownership_verification: { label: 'Ownership Verification', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    valuation_and_compensation: { label: 'Valuation & Comp.', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    approval: { label: 'Approval Queue', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    award: { label: 'Award Declaration', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    possession: { label: 'Possession Phase', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    handover: { label: 'Civil Handover', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium' },
  };

  const item = stageLabels[stage] || { label: stage, color: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${item.color}`}>
      {item.label}
    </span>
  );
};
