import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-medium flex items-center justify-between border-b border-amber-600 shadow-xs z-50">
      <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
        <span className="inline-flex items-center gap-1 font-bold tracking-wider uppercase bg-slate-900 text-amber-400 px-2 py-0.5 rounded text-[10px]">
          <AlertTriangle className="w-3 h-3" /> DEMO MODE
        </span>
        <span className="truncate">
          Synthetic data for evaluation. Predictions are AI decision-support estimates and are not validated for official land acquisition or statutory decisions.
        </span>
      </div>
    </div>
  );
};
