import React, { useState, useEffect } from 'react';
import { ModelMetadata, User } from '../types';
import { api } from '../api/client';
import {
  Cpu,
  RotateCw,
  CheckCircle,
  AlertTriangle,
  Layers,
  BarChart2,
  TrendingUp,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ModelGovernancePage: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [samplesCount, setSamplesCount] = useState(5000);
  const [randomSeed, setRandomSeed] = useState(42);

  useEffect(() => {
    loadModelStatus();
  }, []);

  const loadModelStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getModelStatus();
      setMetadata(res.metadata);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    if (currentUser.role !== 'administrator') {
      alert('Only administrators have permissions to trigger model training pipelines.');
      return;
    }
    setIsRetraining(true);
    try {
      const res = await api.trainModel(samplesCount, randomSeed);
      setMetadata(res.metadata);
      alert(res.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRetraining(false);
    }
  };

  if (!metadata) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading model governance...</div>;
  }

  const cm = metadata.classificationMetrics.confusionMatrix;
  const totalPreds = cm.trueNegative + cm.falsePositive + cm.falseNegative + cm.truePositive;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Machine Learning Model Governance</h1>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
              {metadata.version}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            scikit-learn Pipeline architecture, evaluation diagnostics, confusion matrix, and feature importances.
          </p>
        </div>

        {currentUser.role === 'administrator' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetrain}
              disabled={isRetraining}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
              <span>{isRetraining ? 'Training Pipeline...' : 'Retrain Pipeline'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Synthetic Warning */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Synthetic Training Data Policy:</strong>
          <p className="mt-0.5 text-[11px] leading-relaxed">
            All training data features, observations, and outcome delays were produced with synthetic controlled priors. Metrics evaluate generalization on synthetic validation sets only and are not field-calibrated against official revenue tribunal records.
          </p>
        </div>
      </div>

      {/* Pipeline Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Classification Algorithm</span>
          <div className="font-bold text-slate-900 text-sm mt-1">RandomForestClassifier</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ensemble of 100 decision trees with Gini criterion, max_depth 12, calibrated probability outputs.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Regression Algorithm</span>
          <div className="font-bold text-slate-900 text-sm mt-1">RandomForestRegressor</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Non-negative delay day estimator predicting schedule slippage duration (MAE: {metadata.regressionMetrics.maeDays}d).
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Preprocessing Pipeline</span>
          <div className="font-bold text-slate-900 text-sm mt-1">ColumnTransformer & OneHotEncoder</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Median numerical imputation, one-hot categorical encoding, and tree SHAP explainer integration.
          </p>
        </div>
      </div>

      {/* Classification & Regression Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification Metrics Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Classification Diagnostics (Delay Occurrence)
            </h2>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              ROC-AUC: {metadata.classificationMetrics.rocAuc}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Precision</span>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                {Math.round(metadata.classificationMetrics.precision * 100)}%
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Recall</span>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                {Math.round(metadata.classificationMetrics.recall * 100)}%
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">F1-Score</span>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                {metadata.classificationMetrics.f1Score}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">PR-AUC</span>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                {metadata.classificationMetrics.prAuc}
              </div>
            </div>
          </div>

          {/* 2x2 Confusion Matrix */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Confusion Matrix ({totalPreds} test samples)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase">True Negative (On-Time)</span>
                <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">{cm.trueNegative}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] text-amber-800 font-semibold uppercase">False Positive (False Alarm)</span>
                <div className="text-lg font-bold font-mono text-amber-900 mt-0.5">{cm.falsePositive}</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-center">
                <span className="text-[10px] text-rose-800 font-semibold uppercase">False Negative (Missed Delay)</span>
                <div className="text-lg font-bold font-mono text-rose-900 mt-0.5">{cm.falseNegative}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 font-semibold uppercase">True Positive (Caught Delay)</span>
                <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">{cm.truePositive}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Regression Metrics & Thresholds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Regression Diagnostics (Extra Delay Days)
            </h2>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold">
              R²: {metadata.regressionMetrics.r2Score}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Mean Absolute Error</span>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {metadata.regressionMetrics.maeDays} days
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">RMSE</span>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {metadata.regressionMetrics.rmseDays} days
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Median Abs. Error</span>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {metadata.regressionMetrics.medianAbsoluteErrorDays} days
              </div>
            </div>
          </div>

          {/* Configured Thresholds Table */}
          <div className="pt-2">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Decision Boundary Risk Thresholds
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                <span className="text-[10px] font-sans font-semibold">Low</span>
                <div className="font-bold">&lt; 30%</div>
              </div>
              <div className="p-2 rounded bg-amber-50 text-amber-800 text-xs border border-amber-200">
                <span className="text-[10px] font-sans font-semibold">Medium</span>
                <div className="font-bold">30% - 59%</div>
              </div>
              <div className="p-2 rounded bg-orange-50 text-orange-800 text-xs border border-orange-200">
                <span className="text-[10px] font-sans font-semibold">High</span>
                <div className="font-bold">60% - 79%</div>
              </div>
              <div className="p-2 rounded bg-rose-50 text-rose-800 text-xs border border-rose-200">
                <span className="text-[10px] font-sans font-semibold">Critical</span>
                <div className="font-bold">≥ 80%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
          Random Forest Gini Feature Importance Ranking
        </h2>
        <p className="text-[11px] text-slate-500 mb-4">
          Relative contribution of land acquisition features across 100 ensemble trees
        </p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metadata.featureImportances}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 0.35]} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 10, fill: '#334155' }}
                interval={0}
              />
              <Tooltip
                formatter={(val: any) => [`${(val * 100).toFixed(1)}% importance`, 'Weight']}
                contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
              />
              <Bar dataKey="importance" fill="#0D9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
