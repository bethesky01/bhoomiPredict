import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRiskCategory,
  runModelInference,
  generateRecommendationsForParcel,
  inspectDataQuality,
  calculateDaysUntilPossession,
} from './ml_engine';
import { Parcel } from '../types';

const mockParcelHighRisk: Parcel = {
  id: 'P-101',
  code: 'NH-48-PKG2-042',
  projectId: 'proj-1',
  district: 'Vadodara',
  locationName: 'Sector 4B Bypass',
  latitude: 22.3072,
  longitude: 73.1812,
  areaAcres: 4.85,
  stage: 'ownership_verification',
  status: 'disputed',
  documentationCompleteness: 35,
  ownershipVerificationStatus: 'disputed',
  pendingApprovalsCount: 3,
  disputesCount: 2,
  compensationStatus: 'disputed',
  surveyStatus: 'resurvey_required',
  plannedStartDate: '2026-01-10',
  plannedPossessionDate: '2026-11-20',
  criticalPath: true,
  responsibleDepartment: 'Revenue & Documentation Wing',
  lastReviewDate: '2026-10-20',
};

const mockParcelCompleted: Parcel = {
  id: 'P-102',
  code: 'NH-48-PKG2-001',
  projectId: 'proj-1',
  district: 'Vadodara',
  locationName: 'Interchange Alpha',
  latitude: 22.312,
  longitude: 73.195,
  areaAcres: 2.1,
  stage: 'completed',
  status: 'handed_over',
  documentationCompleteness: 100,
  ownershipVerificationStatus: 'verified',
  pendingApprovalsCount: 0,
  disputesCount: 0,
  compensationStatus: 'assessed_and_paid',
  surveyStatus: 'completed',
  plannedStartDate: '2025-06-01',
  plannedPossessionDate: '2026-04-01',
  actualPossessionDate: '2026-03-25',
  criticalPath: false,
  responsibleDepartment: 'Engineering & Handover Division',
  lastReviewDate: '2026-04-02',
};

test('Risk Category mapping adheres to configured thresholds', () => {
  assert.equal(getRiskCategory(0.15), 'low');
  assert.equal(getRiskCategory(0.30), 'medium');
  assert.equal(getRiskCategory(0.59), 'medium');
  assert.equal(getRiskCategory(0.60), 'high');
  assert.equal(getRiskCategory(0.79), 'high');
  assert.equal(getRiskCategory(0.80), 'critical');
  assert.equal(getRiskCategory(0.95), 'critical');
});

test('Inference correctly identifies high risk parcel with disputes and missing documentation', () => {
  const result = runModelInference(mockParcelHighRisk, 'Vadodara Expressway Phase 2');

  assert.equal(result.parcelId, 'P-101');
  assert.equal(result.parcelCode, 'NH-48-PKG2-042');
  assert.ok(result.delayProbability >= 0.70, `Expected probability >= 0.70, got ${result.delayProbability}`);
  assert.ok(result.riskCategory === 'high' || result.riskCategory === 'critical');
  assert.ok(result.estimatedDelayDays > 30, `Expected estimated delay days > 30, got ${result.estimatedDelayDays}`);
  assert.equal(result.syntheticDataIndicator, true);
  assert.ok(result.topContributingFactors.length > 0);

  // Check that the top factors include disputes, ownership verification, or documentation
  const factorFeatures = result.topContributingFactors.map((f) => f.feature);
  assert.ok(factorFeatures.includes('disputesCount') || factorFeatures.includes('ownershipVerificationStatus'));
});

test('Inference correctly assigns low risk and zero extra delay to completed parcel', () => {
  const result = runModelInference(mockParcelCompleted, 'Vadodara Expressway Phase 2');

  assert.equal(result.riskCategory, 'low');
  assert.ok(result.delayProbability <= 0.10, `Expected probability <= 0.10, got ${result.delayProbability}`);
  assert.equal(result.estimatedDelayDays, 0);
  assert.equal(result.topContributingFactors[0].direction, 'reduces_delay_risk');
});

test('Data quality inspector flags missing and out of bound values', () => {
  const warnings = inspectDataQuality({
    areaAcres: -1,
    documentationCompleteness: 150,
  });

  assert.ok(warnings.some((w) => w.includes('out of bound')));
  assert.ok(warnings.some((w) => w.includes('positive value')));
  assert.ok(warnings.some((w) => w.includes('Missing planned possession date')));
});

test('Days remaining calculation computes accurate signed delta', () => {
  const days = calculateDaysUntilPossession('2026-11-28', new Date('2026-10-29'));
  assert.equal(days, 30);
});

test('Recommendation engine generates targeted actions for disputed critical path parcel', () => {
  const prediction = runModelInference(mockParcelHighRisk, 'Vadodara Expressway Phase 2');
  const recommendations = generateRecommendationsForParcel(mockParcelHighRisk, prediction);

  assert.ok(recommendations.length >= 3, `Expected at least 3 recommendations, got ${recommendations.length}`);

  // Check critical path recommendation exists
  const hasCriticalPath = recommendations.some((r) => r.detectedIssue.includes('Critical Path'));
  assert.equal(hasCriticalPath, true);

  // Check documentation action exists
  const hasDocIssue = recommendations.some((r) => r.detectedIssue.includes('Documentation completeness'));
  assert.equal(hasDocIssue, true);

  // Check ownership dispute action exists
  const hasDispute = recommendations.some((r) => r.detectedIssue.includes('dispute'));
  assert.equal(hasDispute, true);
});
