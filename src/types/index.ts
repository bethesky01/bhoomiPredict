export type UserRole = 'administrator' | 'project_manager' | 'analyst';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export type AcquisitionStage =
  | 'identification'
  | 'survey'
  | 'ownership_verification'
  | 'valuation_and_compensation'
  | 'approval'
  | 'award'
  | 'possession'
  | 'handover'
  | 'completed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  code: string;
  name: string;
  category: 'highway' | 'railway' | 'metro' | 'industrial' | 'transmission' | 'urban';
  description: string;
  state: string;
  district: string;
  projectManager: string;
  plannedStartDate: string;
  plannedCompletionDate: string;
  totalPlannedParcels: number;
  status: 'active' | 'in_progress' | 'on_hold' | 'completed' | 'archived';
  priority: PriorityLevel;
  budgetEstInrCrore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Parcel {
  id: string;
  code: string;
  projectId: string;
  district: string;
  locationName: string;
  latitude: number;
  longitude: number;
  areaAcres: number;
  stage: AcquisitionStage;
  status: 'pending' | 'in_progress' | 'disputed' | 'delayed' | 'approved' | 'acquired' | 'handed_over';
  documentationCompleteness: number; // 0 - 100 %
  ownershipVerificationStatus: 'verified' | 'in_progress' | 'pending' | 'disputed';
  pendingApprovalsCount: number;
  disputesCount: number;
  compensationStatus: 'assessed_and_paid' | 'assessed_pending_payment' | 'under_assessment' | 'disputed' | 'pending';
  surveyStatus: 'completed' | 'in_progress' | 'pending' | 'resurvey_required';
  plannedStartDate: string;
  plannedPossessionDate: string;
  actualPossessionDate?: string;
  criticalPath: boolean;
  responsibleDepartment: string;
  lastReviewDate: string;
  notes?: string;
  // Dynamic or persisted prediction summary
  delayRiskScore?: number; // 0.0 - 1.0
  riskCategory?: RiskLevel;
  estimatedDelayDays?: number;
  lastPredictedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  parcelId?: string;
  name: string;
  description: string;
  plannedStartDate: string;
  plannedCompletionDate: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  status: 'not_started' | 'in_progress' | 'delayed' | 'completed' | 'blocked';
  responsibleDepartment: string;
  dependencyIds: string[];
  blockerDescription?: string;
  criticalPath: boolean;
  notes?: string;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: string | number;
  impactScore: number; // Positive increases risk, negative decreases risk
  direction: 'increases_delay_risk' | 'reduces_delay_risk';
  description: string;
}

export interface PredictionResult {
  id: string;
  parcelId: string;
  parcelCode: string;
  projectName: string;
  delayProbability: number; // 0.0 to 1.0
  delayProbabilityPercent: number; // 0 to 100
  riskCategory: RiskLevel;
  estimatedDelayDays: number;
  modelVersion: string;
  predictedAt: string;
  dataQualityWarnings: string[];
  topContributingFactors: FeatureContribution[];
  syntheticDataIndicator: boolean;
  disclaimer: string;
}

export interface Recommendation {
  id: string;
  parcelId: string;
  parcelCode: string;
  projectId: string;
  detectedIssue: string;
  recommendedAction: string;
  priority: PriorityLevel;
  reason: string;
  assignedDepartment: string;
  assignedUser?: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'blocked' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  parcelId?: string;
  projectId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  role: string;
  action: string;
  objectType: 'parcel' | 'project' | 'milestone' | 'prediction' | 'recommendation' | 'model';
  objectId: string;
  objectIdentifier: string;
  details: string;
  timestamp: string;
}

export interface ModelMetadata {
  version: string;
  algorithm: string;
  trainingSamples: number;
  trainedAt: string;
  datasetSeed: number;
  classificationMetrics: {
    rocAuc: number;
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
    prAuc: number;
    confusionMatrix: {
      trueNegative: number;
      falsePositive: number;
      falseNegative: number;
      truePositive: number;
    };
  };
  regressionMetrics: {
    maeDays: number;
    rmseDays: number;
    medianAbsoluteErrorDays: number;
    r2Score: number;
  };
  featureImportances: {
    feature: string;
    label: string;
    importance: number;
  }[];
  thresholds: {
    lowMax: number;
    mediumMax: number;
    highMax: number;
  };
  syntheticDisclaimer: string;
}
