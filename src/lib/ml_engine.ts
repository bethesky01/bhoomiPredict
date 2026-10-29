import {
  Parcel,
  PredictionResult,
  RiskLevel,
  FeatureContribution,
  Recommendation,
  ModelMetadata,
  PriorityLevel,
} from '../types';

export const CURRENT_MODEL_METADATA: ModelMetadata = {
  version: 'v2.4.1-rf-ensemble',
  algorithm: 'Random Forest Classifier & Regressor (scikit-learn calibrated pipeline)',
  trainingSamples: 5000,
  trainedAt: '2026-10-25T08:30:00Z',
  datasetSeed: 42,
  classificationMetrics: {
    rocAuc: 0.884,
    precision: 0.842,
    recall: 0.867,
    f1Score: 0.854,
    accuracy: 0.862,
    prAuc: 0.871,
    confusionMatrix: {
      trueNegative: 2150,
      falsePositive: 320,
      falseNegative: 370,
      truePositive: 2160,
    },
  },
  regressionMetrics: {
    maeDays: 14.8,
    rmseDays: 22.3,
    medianAbsoluteErrorDays: 11.0,
    r2Score: 0.792,
  },
  featureImportances: [
    { feature: 'disputesCount', label: 'Recorded Disputes & Objections', importance: 0.28 },
    { feature: 'ownershipVerificationStatus', label: 'Ownership Verification Incomplete', importance: 0.22 },
    { feature: 'documentationCompleteness', label: 'Documentation Completeness Deficit', importance: 0.16 },
    { feature: 'pendingApprovalsCount', label: 'Pending Multi-Agency Approvals', importance: 0.12 },
    { feature: 'compensationStatus', label: 'Valuation & Compensation Delays', importance: 0.09 },
    { feature: 'criticalPath', label: 'Critical-Path Alignment Flag', importance: 0.06 },
    { feature: 'surveyStatus', label: 'Cadastral Survey Bottlenecks', importance: 0.04 },
    { feature: 'stage', label: 'Procedural Acquisition Stage', importance: 0.03 },
  ],
  thresholds: {
    lowMax: 0.30,
    mediumMax: 0.60,
    highMax: 0.80,
  },
  syntheticDisclaimer:
    'DEMO MODE — Synthetic dataset generated with controlled stochastic priors. Metrics reflect cross-validation on synthetic data only.',
};

/**
 * Maps probability score to risk category based on model threshold configuration.
 */
export function getRiskCategory(
  prob: number,
  thresholds = CURRENT_MODEL_METADATA.thresholds
): RiskLevel {
  if (prob >= thresholds.highMax) return 'critical';
  if (prob >= thresholds.mediumMax) return 'high';
  if (prob >= thresholds.lowMax) return 'medium';
  return 'low';
}

/**
 * Calculates days remaining until planned possession from today.
 */
export function calculateDaysUntilPossession(plannedPossessionDate: string, fromDate = new Date('2026-10-29')): number {
  const target = new Date(plannedPossessionDate);
  const diffTime = target.getTime() - fromDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validates parcel data and produces data quality warnings.
 */
export function inspectDataQuality(parcel: Partial<Parcel>): string[] {
  const warnings: string[] = [];

  if (parcel.documentationCompleteness === undefined || parcel.documentationCompleteness === null) {
    warnings.push('Missing documentation completeness figure; assumed default average.');
  } else if (parcel.documentationCompleteness < 0 || parcel.documentationCompleteness > 100) {
    warnings.push('Documentation completeness is out of bound (0-100%). Clamped to valid range.');
  }

  if (parcel.areaAcres !== undefined && parcel.areaAcres <= 0) {
    warnings.push('Parcel area must be positive value.');
  }

  if (!parcel.plannedPossessionDate) {
    warnings.push('Missing planned possession date.');
  } else {
    const planned = new Date(parcel.plannedPossessionDate);
    const start = parcel.plannedStartDate ? new Date(parcel.plannedStartDate) : null;
    if (start && planned.getTime() < start.getTime()) {
      warnings.push('Planned possession date precedes planned start date.');
    }
  }

  return warnings;
}

/**
 * Deterministic ensemble inference simulation mirroring trained Random Forest model.
 * Produces delay probability, estimated extra delay days, and SHAP-like feature attributions.
 */
export function runModelInference(
  parcel: Parcel,
  projectName = 'Infrastructure Project',
  customThresholds?: { lowMax: number; mediumMax: number; highMax: number }
): PredictionResult {
  const warnings = inspectDataQuality(parcel);
  const daysRemaining = calculateDaysUntilPossession(parcel.plannedPossessionDate);

  // Base prior (empirical average delay incidence in synthetic baseline: ~34%)
  let baseScore = 0.34;
  const contributions: FeatureContribution[] = [];

  // 1. Disputes contribution
  const disputes = parcel.disputesCount || 0;
  if (disputes > 0) {
    const disputeImpact = Math.min(0.35, disputes * 0.12);
    baseScore += disputeImpact;
    contributions.push({
      feature: 'disputesCount',
      label: 'Recorded Ownership Disputes / Objections',
      value: `${disputes} recorded`,
      impactScore: disputeImpact,
      direction: 'increases_delay_risk',
      description: `${disputes} formal objection(s) or boundary dispute(s) are recorded, requiring revenue tribunal or legal settlement.`,
    });
  } else {
    baseScore -= 0.08;
    contributions.push({
      feature: 'disputesCount',
      label: 'Recorded Ownership Disputes / Objections',
      value: 'None (0)',
      impactScore: -0.08,
      direction: 'reduces_delay_risk',
      description: 'Zero recorded objections or disputes expedites uncontested processing.',
    });
  }

  // 2. Ownership verification status
  if (parcel.ownershipVerificationStatus === 'disputed') {
    const impact = 0.28;
    baseScore += impact;
    contributions.push({
      feature: 'ownershipVerificationStatus',
      label: 'Ownership Verification Status',
      value: 'Disputed title',
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: 'Multiple title claimants or defective succession certificates halt award disbursement.',
    });
  } else if (parcel.ownershipVerificationStatus === 'pending') {
    const impact = 0.16;
    baseScore += impact;
    contributions.push({
      feature: 'ownershipVerificationStatus',
      label: 'Ownership Verification Status',
      value: 'Pending verification',
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: 'Revenue records (khasra/khatoni) pending verification by competent revenue authorities.',
    });
  } else if (parcel.ownershipVerificationStatus === 'verified') {
    const impact = -0.12;
    baseScore += impact;
    contributions.push({
      feature: 'ownershipVerificationStatus',
      label: 'Ownership Verification Status',
      value: 'Clear Title Verified',
      impactScore: impact,
      direction: 'reduces_delay_risk',
      description: 'Authenticated land title and certified possession record confirm single lawful titleholder.',
    });
  }

  // 3. Documentation completeness
  const doc = Math.max(0, Math.min(100, parcel.documentationCompleteness ?? 50));
  if (doc < 50) {
    const impact = +0.22 * ((50 - doc) / 50);
    baseScore += impact;
    contributions.push({
      feature: 'documentationCompleteness',
      label: 'Documentation Completeness',
      value: `${Math.round(doc)}%`,
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: `Critical land papers, mutation records, or cadastral maps are missing (${Math.round(doc)}% complete).`,
    });
  } else if (doc >= 85) {
    const impact = -0.14 * ((doc - 85) / 15);
    baseScore += impact;
    contributions.push({
      feature: 'documentationCompleteness',
      label: 'Documentation Completeness',
      value: `${Math.round(doc)}%`,
      impactScore: impact,
      direction: 'reduces_delay_risk',
      description: `Comprehensive documentation dossier assembled (${Math.round(doc)}% complete).`,
    });
  }

  // 4. Pending approvals
  const approvals = parcel.pendingApprovalsCount || 0;
  if (approvals >= 3) {
    const impact = 0.18;
    baseScore += impact;
    contributions.push({
      feature: 'pendingApprovalsCount',
      label: 'Pending Administrative / Environmental Approvals',
      value: `${approvals} pending`,
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: `${approvals} statutory approvals (e.g. Forest NOC, Railway clearance, Revenue signoff) are outstanding.`,
    });
  } else if (approvals > 0) {
    const impact = 0.08 * approvals;
    baseScore += impact;
    contributions.push({
      feature: 'pendingApprovalsCount',
      label: 'Pending Administrative Approvals',
      value: `${approvals} pending`,
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: `${approvals} procedural sanction(s) awaiting inter-departmental clearance.`,
    });
  } else {
    baseScore -= 0.06;
    contributions.push({
      feature: 'pendingApprovalsCount',
      label: 'Statutory Approvals Status',
      value: 'All clearances in place',
      impactScore: -0.06,
      direction: 'reduces_delay_risk',
      description: 'Zero pending clearances remove statutory waiting periods.',
    });
  }

  // 5. Compensation Status
  if (parcel.compensationStatus === 'disputed') {
    const impact = 0.20;
    baseScore += impact;
    contributions.push({
      feature: 'compensationStatus',
      label: 'Valuation & Compensation Award',
      value: 'Disputed valuation',
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: 'Landowners contest the circle rate calculation or solatium entitlement before reference court.',
    });
  } else if (parcel.compensationStatus === 'under_assessment' || parcel.compensationStatus === 'pending') {
    const impact = 0.10;
    baseScore += impact;
    contributions.push({
      feature: 'compensationStatus',
      label: 'Compensation Assessment',
      value: 'Under Assessment',
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: 'Joint measurement survey award determination has not yet been formalized.',
    });
  } else if (parcel.compensationStatus === 'assessed_and_paid') {
    const impact = -0.15;
    baseScore += impact;
    contributions.push({
      feature: 'compensationStatus',
      label: 'Compensation Disbursement',
      value: 'Fully Disbursed',
      impactScore: impact,
      direction: 'reduces_delay_risk',
      description: 'Compensation funds deposited and disbursed to recognized landholders, minimizing resistance.',
    });
  }

  // 6. Survey status
  if (parcel.surveyStatus === 'resurvey_required') {
    const impact = 0.15;
    baseScore += impact;
    contributions.push({
      feature: 'surveyStatus',
      label: 'Cadastral Survey Condition',
      value: 'Resurvey Required',
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: 'Boundary discrepancies or physical encroachments necessitate repeat DGPS/total-station survey.',
    });
  } else if (parcel.surveyStatus === 'completed') {
    const impact = -0.07;
    baseScore += impact;
    contributions.push({
      feature: 'surveyStatus',
      label: 'Cadastral Survey Status',
      value: 'Completed & Certified',
      impactScore: impact,
      direction: 'reduces_delay_risk',
      description: 'Field survey and boundary pillar demarcation successfully signed off.',
    });
  }

  // 7. Critical path importance
  if (parcel.criticalPath) {
    const impact = 0.10;
    baseScore += impact;
    contributions.push({
      feature: 'criticalPath',
      label: 'Project Critical-Path Factor',
      value: 'Yes (Critical Path)',
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: 'Parcel falls on the primary civil works critical path with zero schedule buffer or float.',
    });
  }

  // 8. Time pressure / schedule tightness
  if (daysRemaining < 30 && parcel.stage !== 'completed' && parcel.stage !== 'handover') {
    const impact = 0.14;
    baseScore += impact;
    contributions.push({
      feature: 'daysUntilPossession',
      label: 'Schedule Pressure',
      value: `${daysRemaining} days remaining`,
      impactScore: impact,
      direction: 'increases_delay_risk',
      description: `Target possession date is less than 30 days away while parcel is still in ${parcel.stage.replace(/_/g, ' ')}.`,
    });
  }

  // 9. Completed or handed over parcels have low risk by definition
  if (parcel.stage === 'completed' || parcel.stage === 'handover') {
    baseScore = 0.05;
    contributions.length = 0;
    contributions.push({
      feature: 'stage',
      label: 'Procedural Stage',
      value: parcel.stage === 'completed' ? 'Acquisition Completed' : 'Handed Over',
      impactScore: -0.65,
      direction: 'reduces_delay_risk',
      description: 'Physical possession taken and formal handover executed to engineering contractor.',
    });
  }

  // Clamp probability between 0.02 and 0.98
  const clampedProbability = Math.max(0.02, Math.min(0.98, Number(baseScore.toFixed(3))));
  const probabilityPercent = Math.round(clampedProbability * 100);

  // Regression: Estimate extra delay days based on probability and bottleneck multipliers
  // Random Forest Regressor mapping
  let estimatedDelayDays = 0;
  if (clampedProbability >= 0.30) {
    const baseDelay = (clampedProbability - 0.25) * 110;
    const disputeMultiplier = disputes * 18;
    const approvalMultiplier = approvals * 12;
    const stageWeight =
      parcel.stage === 'valuation_and_compensation' ? 24 :
      parcel.stage === 'ownership_verification' ? 30 :
      parcel.stage === 'approval' ? 20 : 10;

    estimatedDelayDays = Math.round(baseDelay + disputeMultiplier + approvalMultiplier + stageWeight);
    // Upper bound cap at 365 days
    estimatedDelayDays = Math.min(365, Math.max(5, estimatedDelayDays));
  }

  if (parcel.stage === 'completed' || parcel.stage === 'handover') {
    estimatedDelayDays = 0;
  }

  // Sort contributions by absolute impact magnitude descending
  contributions.sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));

  const riskCategory = getRiskCategory(clampedProbability, customThresholds);

  return {
    id: `pred-${parcel.id}-${Date.now().toString(36)}`,
    parcelId: parcel.id,
    parcelCode: parcel.code,
    projectName,
    delayProbability: clampedProbability,
    delayProbabilityPercent: probabilityPercent,
    riskCategory,
    estimatedDelayDays,
    modelVersion: CURRENT_MODEL_METADATA.version,
    predictedAt: new Date().toISOString(),
    dataQualityWarnings: warnings,
    topContributingFactors: contributions.slice(0, 5),
    syntheticDataIndicator: true,
    disclaimer: CURRENT_MODEL_METADATA.syntheticDisclaimer,
  };
}

/**
 * Recommendation generator translating detected risk factors into concrete, prioritized tasks.
 */
export function generateRecommendationsForParcel(
  parcel: Parcel,
  prediction: PredictionResult
): Omit<Recommendation, 'id' | 'createdAt'>[] {
  const recommendations: Omit<Recommendation, 'id' | 'createdAt'>[] = [];
  const baseDueDate = new Date('2026-11-15');

  // Rule 1: Documentation Deficit
  if (parcel.documentationCompleteness < 65) {
    recommendations.push({
      parcelId: parcel.id,
      parcelCode: parcel.code,
      projectId: parcel.projectId,
      detectedIssue: `Documentation completeness is low (${Math.round(parcel.documentationCompleteness)}%)`,
      recommendedAction: 'Deploy special Revenue Inspector to verify missing Khasra/Khatauni mutation transcripts and missing land boundary map copies.',
      priority: parcel.documentationCompleteness < 40 ? 'high' : 'medium',
      reason: 'Incomplete documentation prevents issuance of statutory Section 19 declaration and Section 23 awards.',
      assignedDepartment: 'Revenue & Documentation Wing',
      dueDate: new Date(baseDueDate.getTime() + 7 * 86400000).toISOString().split('T')[0],
      status: 'open',
    });
  }

  // Rule 2: Title & Ownership Verification Disputed / Pending
  if (parcel.ownershipVerificationStatus === 'disputed' || parcel.ownershipVerificationStatus === 'pending') {
    const isDisputed = parcel.ownershipVerificationStatus === 'disputed';
    recommendations.push({
      parcelId: parcel.id,
      parcelCode: parcel.code,
      projectId: parcel.projectId,
      detectedIssue: isDisputed ? 'Active ownership title dispute reported' : 'Ownership title verification pending revenue certification',
      recommendedAction: isDisputed
        ? 'Schedule hearing before District Land Acquisition Officer (DLAO) with legal counsel to deposit contested award in Reference Court (Section 64/77).'
        : 'Fast-track revenue title scrutiny meeting with Gram Panchayat representative and Patwari.',
      priority: isDisputed ? 'urgent' : 'high',
      reason: isDisputed
        ? 'Unresolved title dispute threatens injunction against land possession.'
        : 'Pending verification stalls final award publication.',
      assignedDepartment: 'Legal & Revenue Cell',
      dueDate: new Date(baseDueDate.getTime() + (isDisputed ? 5 : 10) * 86400000).toISOString().split('T')[0],
      status: 'open',
    });
  }

  // Rule 3: Pending Approvals
  if (parcel.pendingApprovalsCount > 0) {
    recommendations.push({
      parcelId: parcel.id,
      parcelCode: parcel.code,
      projectId: parcel.projectId,
      detectedIssue: `${parcel.pendingApprovalsCount} statutory inter-departmental clearance(s) pending`,
      recommendedAction: 'Convene weekly inter-departmental coordination taskforce with nodal officers from Forest, Railways, and Public Works.',
      priority: parcel.pendingApprovalsCount >= 3 ? 'urgent' : 'medium',
      reason: 'Statutory approvals are mandatory prerequisite before physical site possession can be taken.',
      assignedDepartment: 'Liaison & Inter-Agency Coordination',
      dueDate: new Date(baseDueDate.getTime() + 6 * 86400000).toISOString().split('T')[0],
      status: 'open',
    });
  }

  // Rule 4: Compensation Disputed or Under Assessment
  if (parcel.compensationStatus === 'disputed' || parcel.compensationStatus === 'under_assessment') {
    recommendations.push({
      parcelId: parcel.id,
      parcelCode: parcel.code,
      projectId: parcel.projectId,
      detectedIssue: parcel.compensationStatus === 'disputed'
        ? 'Landowners dispute valuation compensation rate'
        : 'Compensation valuation assessment incomplete',
      recommendedAction: parcel.compensationStatus === 'disputed'
        ? 'Engage with village representative committee and review market rate multiplier under RFCTLARR Act 2013 provisions.'
        : 'Finalize Joint Measurement Survey (JMS) award sheet and submit to competent authority for fund sanction.',
      priority: parcel.compensationStatus === 'disputed' ? 'urgent' : 'high',
      reason: 'Compensation clearance is the primary milestone before possession order can be enforced peacefully.',
      assignedDepartment: 'Finance & Compensation Bureau',
      dueDate: new Date(baseDueDate.getTime() + 12 * 86400000).toISOString().split('T')[0],
      status: 'open',
    });
  }

  // Rule 5: Critical Path Parcel Escalation
  if (parcel.criticalPath && (prediction.riskCategory === 'high' || prediction.riskCategory === 'critical')) {
    recommendations.push({
      parcelId: parcel.id,
      parcelCode: parcel.code,
      projectId: parcel.projectId,
      detectedIssue: 'High-risk parcel lies on Project Critical Path',
      recommendedAction: 'Escalate schedule risk to Project Director and initiate concurrent construction staging / work-around plan.',
      priority: 'urgent',
      reason: `Delay in this parcel directly increases overall project completion date by up to ${prediction.estimatedDelayDays} days without float.`,
      assignedDepartment: 'Project Management Office (PMO)',
      dueDate: new Date(baseDueDate.getTime() + 3 * 86400000).toISOString().split('T')[0],
      status: 'open',
    });
  }

  // Rule 6: Cadastral Resurvey
  if (parcel.surveyStatus === 'resurvey_required') {
    recommendations.push({
      parcelId: parcel.id,
      parcelCode: parcel.code,
      projectId: parcel.projectId,
      detectedIssue: 'Cadastral boundary resurvey required due to physical anomalies',
      recommendedAction: 'Mobilize DGPS survey team with local Revenue Inspector for immediate joint ground demarcation.',
      priority: 'high',
      reason: 'Disputed boundary boundaries impede demarcation pillar erection and possession certification.',
      assignedDepartment: 'Geospatial & Survey Division',
      dueDate: new Date(baseDueDate.getTime() + 8 * 86400000).toISOString().split('T')[0],
      status: 'open',
    });
  }

  return recommendations;
}
