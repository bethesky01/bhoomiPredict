import {
  Project,
  Parcel,
  Milestone,
  PredictionResult,
  Recommendation,
  NotificationItem,
  AuditLogItem,
  ModelMetadata,
  User,
} from '../types';
import { runModelInference, generateRecommendationsForParcel, CURRENT_MODEL_METADATA } from '../lib/ml_engine';

export interface DatabaseState {
  users: User[];
  projects: Project[];
  parcels: Parcel[];
  milestones: Milestone[];
  predictions: PredictionResult[];
  recommendations: Recommendation[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  modelMetadata: ModelMetadata;
}

// In-memory persistent database store initialized with rich deterministic synthetic data
export class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.seedInitialData();
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetData(seed = 42): void {
    this.state = this.seedInitialData(seed);
  }

  private seedInitialData(seed = 42): DatabaseState {
    const users: User[] = [
      {
        id: 'user-admin',
        username: 'admin',
        name: 'Rajesh Sharma',
        email: 'r.sharma@nhai.gov.in',
        role: 'administrator',
        department: 'National Highway Infrastructure Authority',
      },
      {
        id: 'user-pm',
        username: 'pm_priya',
        name: 'Priya Narayanan',
        email: 'priya.n@dfccil.in',
        role: 'project_manager',
        department: 'Dedicated Freight Corridor Corporation',
      },
      {
        id: 'user-analyst',
        username: 'analyst_arun',
        name: 'Arun Verma',
        email: 'arun.verma@metro-rail.org',
        role: 'analyst',
        department: 'Regional Urban Transport Corporation',
      },
    ];

    const projects: Project[] = [
      {
        id: 'proj-1',
        code: 'NH-48-PKG2',
        name: 'Delhi-Mumbai Expressway Package 2 (Vadodara Section)',
        category: 'highway',
        description: 'Greenfield 8-lane access controlled expressway alignment spanning 42 km.',
        state: 'Gujarat',
        district: 'Vadodara',
        projectManager: 'Priya Narayanan',
        plannedStartDate: '2025-01-15',
        plannedCompletionDate: '2027-06-30',
        totalPlannedParcels: 64,
        status: 'active',
        priority: 'urgent',
        budgetEstInrCrore: 3850,
        createdAt: '2025-01-10T10:00:00Z',
        updatedAt: '2026-10-25T14:30:00Z',
      },
      {
        id: 'proj-2',
        code: 'WDFC-PH3',
        name: 'Western Dedicated Freight Corridor Phase 3 (Rewari-Palanpur)',
        category: 'railway',
        description: 'High-axle-load freight railway line acquisition across agricultural & industrial zones.',
        state: 'Rajasthan',
        district: 'Alwar',
        projectManager: 'Vikram Singh',
        plannedStartDate: '2024-09-01',
        plannedCompletionDate: '2026-12-31',
        totalPlannedParcels: 48,
        status: 'active',
        priority: 'high',
        budgetEstInrCrore: 4200,
        createdAt: '2024-08-15T09:00:00Z',
        updatedAt: '2026-10-20T11:15:00Z',
      },
      {
        id: 'proj-3',
        code: 'BMRCL-PH2B',
        name: 'Bangalore Metro Airport Line Corridor Phase 2B',
        category: 'metro',
        description: 'Elevated and at-grade rapid metro corridor linking city core to International Airport.',
        state: 'Karnataka',
        district: 'Bengaluru Rural',
        projectManager: 'Sunil Hegde',
        plannedStartDate: '2025-03-01',
        plannedCompletionDate: '2027-09-30',
        totalPlannedParcels: 36,
        status: 'active',
        priority: 'urgent',
        budgetEstInrCrore: 2950,
        createdAt: '2025-02-10T14:00:00Z',
        updatedAt: '2026-10-26T16:00:00Z',
      },
      {
        id: 'proj-4',
        code: 'NICDC-DMIC',
        name: 'Dholera Special Investment Region Nodes A & B',
        category: 'industrial',
        description: 'Smart industrial node smart city acquisition for high-tech manufacturing parks.',
        state: 'Gujarat',
        district: 'Ahmedabad Rural',
        projectManager: 'Meera Patel',
        plannedStartDate: '2024-11-01',
        plannedCompletionDate: '2028-03-31',
        totalPlannedParcels: 32,
        status: 'in_progress',
        priority: 'medium',
        budgetEstInrCrore: 5100,
        createdAt: '2024-10-05T08:00:00Z',
        updatedAt: '2026-10-22T09:30:00Z',
      },
      {
        id: 'proj-5',
        code: 'PGCIL-HVDC',
        name: '765kV Green Energy Power Transmission Corridor',
        category: 'transmission',
        description: 'Transmission tower footings and right-of-way corridor for renewable evacuation.',
        state: 'Rajasthan',
        district: 'Jaisalmer',
        projectManager: 'Kavita Joshi',
        plannedStartDate: '2025-05-01',
        plannedCompletionDate: '2027-02-28',
        totalPlannedParcels: 20,
        status: 'active',
        priority: 'high',
        budgetEstInrCrore: 1450,
        createdAt: '2025-04-12T11:00:00Z',
        updatedAt: '2026-10-18T10:45:00Z',
      },
    ];

    // Synthetic base coordinates for projects
    const projectGeoAnchors: Record<string, { lat: number; lng: number }> = {
      'proj-1': { lat: 22.3072, lng: 73.1812 }, // Vadodara
      'proj-2': { lat: 27.5530, lng: 76.6346 }, // Alwar
      'proj-3': { lat: 13.1986, lng: 77.7066 }, // Bengaluru North
      'proj-4': { lat: 22.2587, lng: 72.1945 }, // Dholera
      'proj-5': { lat: 26.9157, lng: 70.9083 }, // Jaisalmer
    };

    const stages: Parcel['stage'][] = [
      'identification',
      'survey',
      'ownership_verification',
      'valuation_and_compensation',
      'approval',
      'award',
      'possession',
      'handover',
      'completed',
    ];

    const departments = [
      'Revenue & Documentation Wing',
      'Geospatial & Survey Division',
      'Legal & Revenue Cell',
      'Finance & Compensation Bureau',
      'Liaison & Inter-Agency Coordination',
      'Engineering & Handover Division',
    ];

    const parcels: Parcel[] = [];
    const predictions: PredictionResult[] = [];
    const recommendations: Recommendation[] = [];
    const notifications: NotificationItem[] = [];
    const auditLogs: AuditLogItem[] = [];

    let recIdCounter = 1;
    let notifIdCounter = 1;
    let auditIdCounter = 1;

    // Pseudo-random deterministic generator using seed
    let s = seed;
    const random = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    projects.forEach((proj) => {
      const anchor = projectGeoAnchors[proj.id];
      const count = proj.totalPlannedParcels;

      for (let i = 1; i <= count; i++) {
        const parcelCode = `${proj.code}-P${String(i).padStart(3, '0')}`;
        const parcelId = `parcel-${proj.id}-${i}`;

        // Distribute stages across project lifecycle
        const stageIndex = Math.min(
          stages.length - 1,
          Math.floor((i / count) * stages.length * 0.95 + random() * 1.5)
        );
        const stage = stages[stageIndex];

        // Area in acres
        const areaAcres = Number((0.8 + random() * 6.5).toFixed(2));

        // Location offset from anchor
        const latitude = Number((anchor.lat + (random() - 0.5) * 0.08).toFixed(5));
        const longitude = Number((anchor.lng + (random() - 0.5) * 0.08).toFixed(5));

        // Ownership & documentation
        let documentationCompleteness = Math.round(30 + random() * 65);
        let ownershipStatus: Parcel['ownershipVerificationStatus'] = 'in_progress';
        let disputesCount = 0;
        let pendingApprovals = Math.floor(random() * 3);
        let compensationStatus: Parcel['compensationStatus'] = 'under_assessment';
        let surveyStatus: Parcel['surveyStatus'] = 'in_progress';
        let status: Parcel['status'] = 'in_progress';
        const isCriticalPath = i % 4 === 0 || i % 7 === 0;

        if (stage === 'completed' || stage === 'handover') {
          documentationCompleteness = 100;
          ownershipStatus = 'verified';
          disputesCount = 0;
          pendingApprovals = 0;
          compensationStatus = 'assessed_and_paid';
          surveyStatus = 'completed';
          status = stage === 'completed' ? 'acquired' : 'handed_over';
        } else if (stage === 'identification' || stage === 'survey') {
          documentationCompleteness = Math.round(20 + random() * 35);
          ownershipStatus = random() > 0.4 ? 'pending' : 'in_progress';
          disputesCount = random() > 0.8 ? 1 : 0;
          surveyStatus = stage === 'survey' && random() > 0.7 ? 'resurvey_required' : 'in_progress';
          compensationStatus = 'pending';
          status = 'pending';
        } else {
          // Middle stages
          if (random() > 0.72) {
            ownershipStatus = 'disputed';
            disputesCount = Math.floor(1 + random() * 3);
            status = 'disputed';
          } else if (random() > 0.4) {
            ownershipStatus = 'in_progress';
          } else {
            ownershipStatus = 'verified';
          }

          if (random() > 0.65) {
            compensationStatus = 'disputed';
          } else if (random() > 0.3) {
            compensationStatus = 'under_assessment';
          } else {
            compensationStatus = 'assessed_pending_payment';
          }

          if (random() > 0.75) {
            surveyStatus = 'resurvey_required';
          } else {
            surveyStatus = 'completed';
          }

          if (random() > 0.7) {
            pendingApprovals = Math.floor(2 + random() * 3);
          }
        }

        const parcel: Parcel = {
          id: parcelId,
          code: parcelCode,
          projectId: proj.id,
          district: proj.district,
          locationName: `${proj.district} Village Survey No. ${100 + i}`,
          latitude,
          longitude,
          areaAcres,
          stage,
          status,
          documentationCompleteness,
          ownershipVerificationStatus: ownershipStatus,
          pendingApprovalsCount: pendingApprovals,
          disputesCount,
          compensationStatus,
          surveyStatus,
          plannedStartDate: '2025-04-01',
          plannedPossessionDate: i % 3 === 0 ? '2026-11-15' : '2027-03-31',
          actualPossessionDate: (stage === 'completed' || stage === 'handover') ? '2026-05-10' : undefined,
          criticalPath: isCriticalPath,
          responsibleDepartment: departments[i % departments.length],
          lastReviewDate: '2026-10-24',
          notes: disputesCount > 0 ? 'Boundary demarcation contested by adjacent co-parceners.' : undefined,
        };

        // Run baseline prediction for seeded parcel
        const pred = runModelInference(parcel, proj.name);
        parcel.delayRiskScore = pred.delayProbability;
        parcel.riskCategory = pred.riskCategory;
        parcel.estimatedDelayDays = pred.estimatedDelayDays;
        parcel.lastPredictedAt = pred.predictedAt;

        parcels.push(parcel);
        predictions.push(pred);

        // Generate recommendations for high/critical parcels
        if (pred.riskCategory === 'high' || pred.riskCategory === 'critical') {
          const recs = generateRecommendationsForParcel(parcel, pred);
          recs.forEach((r) => {
            recommendations.push({
              ...r,
              id: `rec-${recIdCounter++}`,
              createdAt: '2026-10-26T09:00:00Z',
              assignedUser: r.priority === 'urgent' ? 'Priya Narayanan' : 'Arun Verma',
            });
          });

          // Generate notification
          if (notifications.length < 15) {
            notifications.push({
              id: `notif-${notifIdCounter++}`,
              title: `High Delay Risk Flagged: ${parcel.code}`,
              message: `Estimated delay of ${pred.estimatedDelayDays} days detected due to ${pred.topContributingFactors[0]?.label || 'bottlenecks'}.`,
              severity: pred.riskCategory === 'critical' ? 'critical' : 'warning',
              parcelId: parcel.id,
              projectId: proj.id,
              read: notifIdCounter > 4, // first few unread
              createdAt: '2026-10-27T10:30:00Z',
            });
          }
        }
      }
    });

    // Milestones seeding
    const milestones: Milestone[] = [
      {
        id: 'ms-1',
        projectId: 'proj-1',
        parcelId: 'parcel-proj-1-1',
        name: 'Section 4(1) Preliminary Notification Publication',
        description: 'Gazette publication of preliminary acquisition notice and Gram Sabha public consultation.',
        plannedStartDate: '2025-02-01',
        plannedCompletionDate: '2025-04-15',
        actualStartDate: '2025-02-01',
        actualCompletionDate: '2025-04-10',
        status: 'completed',
        responsibleDepartment: 'Revenue & Documentation Wing',
        dependencyIds: [],
        criticalPath: true,
      },
      {
        id: 'ms-2',
        projectId: 'proj-1',
        parcelId: 'parcel-proj-1-4',
        name: 'Joint Measurement Survey (JMS) & Demarcation',
        description: 'Total station and DGPS physical boundary verification with landowners.',
        plannedStartDate: '2025-04-16',
        plannedCompletionDate: '2025-07-31',
        actualStartDate: '2025-04-20',
        actualCompletionDate: '2025-08-15',
        status: 'completed',
        responsibleDepartment: 'Geospatial & Survey Division',
        dependencyIds: ['ms-1'],
        criticalPath: true,
      },
      {
        id: 'ms-3',
        projectId: 'proj-1',
        parcelId: 'parcel-proj-1-8',
        name: 'Section 19 Declaration Publication',
        description: 'Declaration of public purpose and social impact assessment approval.',
        plannedStartDate: '2025-09-01',
        plannedCompletionDate: '2025-11-30',
        actualStartDate: '2025-09-05',
        status: 'completed',
        actualCompletionDate: '2025-12-05',
        responsibleDepartment: 'Revenue & Documentation Wing',
        dependencyIds: ['ms-2'],
        criticalPath: true,
      },
      {
        id: 'ms-4',
        projectId: 'proj-1',
        parcelId: 'parcel-proj-1-12',
        name: 'Section 23 Valuation & Award Determination',
        description: 'Market rate determination with solatium and multi-party hearing.',
        plannedStartDate: '2026-01-10',
        plannedCompletionDate: '2026-05-30',
        actualStartDate: '2026-01-15',
        status: 'in_progress',
        responsibleDepartment: 'Finance & Compensation Bureau',
        dependencyIds: ['ms-3'],
        criticalPath: true,
        notes: 'Disputes on circle rate valuation filed by 6 landowners in Sector 4B.',
      },
      {
        id: 'ms-5',
        projectId: 'proj-1',
        parcelId: 'parcel-proj-1-16',
        name: 'Statutory Forest & Railway Clearance Sign-off',
        description: 'Tree felling permission and Railway Right-of-Way crossing approval.',
        plannedStartDate: '2026-03-01',
        plannedCompletionDate: '2026-08-31',
        status: 'delayed',
        responsibleDepartment: 'Liaison & Inter-Agency Coordination',
        dependencyIds: ['ms-3'],
        blockerDescription: 'Regional Forest Officer inspection pending due to staff reallocation.',
        criticalPath: true,
      },
      {
        id: 'ms-6',
        projectId: 'proj-1',
        parcelId: 'parcel-proj-1-20',
        name: 'Physical Possession & Handover to Civil Contractor',
        description: 'Execution of Panchnama, physical boundary trenching, and handover certificate.',
        plannedStartDate: '2026-09-01',
        plannedCompletionDate: '2026-11-30',
        status: 'not_started',
        responsibleDepartment: 'Engineering & Handover Division',
        dependencyIds: ['ms-4', 'ms-5'],
        criticalPath: true,
      },
      {
        id: 'ms-7',
        projectId: 'proj-2',
        name: 'Alwar Freight Yard Section 11 Notification',
        description: 'Notification for rail yard expansion and multi-modal logistics terminal.',
        plannedStartDate: '2025-01-01',
        plannedCompletionDate: '2025-05-15',
        actualStartDate: '2025-01-05',
        actualCompletionDate: '2025-05-20',
        status: 'completed',
        responsibleDepartment: 'Revenue & Documentation Wing',
        dependencyIds: [],
        criticalPath: true,
      },
      {
        id: 'ms-8',
        projectId: 'proj-2',
        name: 'Agricultural Land Title Regularization',
        description: 'Mutation resolution of ancestral lands with multiple co-claimants.',
        plannedStartDate: '2025-06-01',
        plannedCompletionDate: '2026-03-31',
        status: 'delayed',
        responsibleDepartment: 'Legal & Revenue Cell',
        dependencyIds: ['ms-7'],
        blockerDescription: 'Court case sub-judice in District Civil Court regarding partition deed.',
        criticalPath: true,
      },
    ];

    // Initial audit logs
    auditLogs.push(
      {
        id: `audit-${auditIdCounter++}`,
        user: 'Rajesh Sharma',
        role: 'administrator',
        action: 'SYSTEM_SEED',
        objectType: 'model',
        objectId: CURRENT_MODEL_METADATA.version,
        objectIdentifier: 'RandomForest Ensemble v2.4.1',
        details: 'Initialized synthetic demonstration dataset with 5 infrastructure projects and 200 parcels.',
        timestamp: '2026-10-25T08:35:00Z',
      },
      {
        id: `audit-${auditIdCounter++}`,
        user: 'Priya Narayanan',
        role: 'project_manager',
        action: 'PREDICTION_EXECUTE',
        objectType: 'prediction',
        objectId: 'pred-batch-001',
        objectIdentifier: 'NH-48-PKG2-P042',
        details: 'Evaluated delay risk probability (78% - High). Generated 3 targeted mitigation recommendations.',
        timestamp: '2026-10-26T11:20:00Z',
      }
    );

    return {
      users,
      projects,
      parcels,
      milestones,
      predictions,
      recommendations,
      notifications,
      auditLogs,
      modelMetadata: { ...CURRENT_MODEL_METADATA },
    };
  }

  // --- Projects ---
  public getProjects(filters?: { search?: string; category?: string; status?: string }): Project[] {
    let list = [...this.state.projects];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.district.toLowerCase().includes(q));
    }
    if (filters?.category) {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    return list;
  }

  public getProjectById(id: string): Project | undefined {
    return this.state.projects.find((p) => p.id === id);
  }

  public createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, user: User): Project {
    const newProj: Project = {
      ...data,
      id: `proj-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.projects.unshift(newProj);
    this.addAuditLog(user, 'PROJECT_CREATE', 'project', newProj.id, newProj.code, `Created project ${newProj.name}`);
    return newProj;
  }

  public updateProject(id: string, updates: Partial<Project>, user: User): Project | undefined {
    const idx = this.state.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.state.projects[idx] = {
      ...this.state.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.addAuditLog(user, 'PROJECT_UPDATE', 'project', id, this.state.projects[idx].code, `Updated project fields: ${Object.keys(updates).join(', ')}`);
    return this.state.projects[idx];
  }

  // --- Parcels ---
  public getParcels(params?: {
    projectId?: string;
    stage?: string;
    riskCategory?: string;
    status?: string;
    search?: string;
    criticalPath?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): { items: Parcel[]; total: number; page: number; pageSize: number; totalPages: number } {
    let list = [...this.state.parcels];

    if (params?.projectId && params.projectId !== 'all') {
      list = list.filter((p) => p.projectId === params.projectId);
    }
    if (params?.stage) {
      list = list.filter((p) => p.stage === params.stage);
    }
    if (params?.riskCategory) {
      list = list.filter((p) => p.riskCategory === params.riskCategory);
    }
    if (params?.status) {
      list = list.filter((p) => p.status === params.status);
    }
    if (params?.criticalPath !== undefined) {
      list = list.filter((p) => p.criticalPath === params.criticalPath);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.code.toLowerCase().includes(q) || p.locationName.toLowerCase().includes(q) || p.district.toLowerCase().includes(q));
    }

    // Sort
    const sortBy = params?.sortBy || 'code';
    const order = params?.sortOrder === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      if (sortBy === 'riskScore') {
        return ((a.delayRiskScore || 0) - (b.delayRiskScore || 0)) * order;
      }
      if (sortBy === 'delayDays') {
        return ((a.estimatedDelayDays || 0) - (b.estimatedDelayDays || 0)) * order;
      }
      if (sortBy === 'area') {
        return (a.areaAcres - b.areaAcres) * order;
      }
      if (sortBy === 'documentationCompleteness') {
        return (a.documentationCompleteness - b.documentationCompleteness) * order;
      }
      return a.code.localeCompare(b.code) * order;
    });

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const total = list.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    return { items, total, page, pageSize, totalPages };
  }

  public getParcelById(id: string): Parcel | undefined {
    return this.state.parcels.find((p) => p.id === id);
  }

  public createParcel(data: Omit<Parcel, 'id'>, user: User): Parcel {
    // Check duplicate code in same project
    const duplicate = this.state.parcels.find((p) => p.projectId === data.projectId && p.code.toLowerCase() === data.code.toLowerCase());
    if (duplicate) {
      throw new Error(`Parcel code "${data.code}" already exists in this project.`);
    }

    const newParcel: Parcel = {
      ...data,
      id: `parcel-${Date.now().toString(36)}`,
    };

    // Calculate prediction immediately
    const proj = this.getProjectById(newParcel.projectId);
    const pred = runModelInference(newParcel, proj?.name || 'Project');
    newParcel.delayRiskScore = pred.delayProbability;
    newParcel.riskCategory = pred.riskCategory;
    newParcel.estimatedDelayDays = pred.estimatedDelayDays;
    newParcel.lastPredictedAt = pred.predictedAt;

    this.state.parcels.unshift(newParcel);
    this.state.predictions.unshift(pred);

    this.addAuditLog(user, 'PARCEL_CREATE', 'parcel', newParcel.id, newParcel.code, `Created parcel ${newParcel.code} in ${proj?.name || newParcel.projectId}`);
    return newParcel;
  }

  public updateParcel(id: string, updates: Partial<Parcel>, user: User): Parcel | undefined {
    const idx = this.state.parcels.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    // Check duplicate code if code changed
    if (updates.code && updates.code !== this.state.parcels[idx].code) {
      const projId = updates.projectId || this.state.parcels[idx].projectId;
      const dup = this.state.parcels.find((p) => p.projectId === projId && p.id !== id && p.code.toLowerCase() === updates.code!.toLowerCase());
      if (dup) {
        throw new Error(`Parcel code "${updates.code}" already exists in this project.`);
      }
    }

    this.state.parcels[idx] = {
      ...this.state.parcels[idx],
      ...updates,
      lastReviewDate: new Date().toISOString().split('T')[0],
    };

    // Re-run inference with updated parameters
    const proj = this.getProjectById(this.state.parcels[idx].projectId);
    const pred = runModelInference(this.state.parcels[idx], proj?.name || 'Project');
    this.state.parcels[idx].delayRiskScore = pred.delayProbability;
    this.state.parcels[idx].riskCategory = pred.riskCategory;
    this.state.parcels[idx].estimatedDelayDays = pred.estimatedDelayDays;
    this.state.parcels[idx].lastPredictedAt = pred.predictedAt;

    this.state.predictions.unshift(pred);

    this.addAuditLog(user, 'PARCEL_UPDATE', 'parcel', id, this.state.parcels[idx].code, `Updated parcel attributes: ${Object.keys(updates).join(', ')}`);
    return this.state.parcels[idx];
  }

  public deleteParcel(id: string, user: User): boolean {
    const idx = this.state.parcels.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const code = this.state.parcels[idx].code;
    this.state.parcels.splice(idx, 1);
    this.addAuditLog(user, 'PARCEL_DELETE', 'parcel', id, code, `Archived / deleted parcel ${code}`);
    return true;
  }

  // --- Predictions ---
  public predictForParcel(parcelId: string, user: User): PredictionResult {
    const parcel = this.getParcelById(parcelId);
    if (!parcel) throw new Error(`Parcel ${parcelId} not found`);

    const proj = this.getProjectById(parcel.projectId);
    const result = runModelInference(parcel, proj?.name || 'Project');

    // Persist prediction
    this.state.predictions.unshift(result);

    // Update parcel state
    parcel.delayRiskScore = result.delayProbability;
    parcel.riskCategory = result.riskCategory;
    parcel.estimatedDelayDays = result.estimatedDelayDays;
    parcel.lastPredictedAt = result.predictedAt;

    // Auto-generate recommendations if high/critical
    if (result.riskCategory === 'high' || result.riskCategory === 'critical') {
      const recs = generateRecommendationsForParcel(parcel, result);
      recs.forEach((r) => {
        // Prevent duplicate open recommendation for same issue on same parcel
        const exists = this.state.recommendations.some((er) => er.parcelId === parcel.id && er.detectedIssue === r.detectedIssue && er.status !== 'completed');
        if (!exists) {
          const newRec: Recommendation = {
            ...r,
            id: `rec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            createdAt: new Date().toISOString(),
          };
          this.state.recommendations.unshift(newRec);
        }
      });
    }

    this.addAuditLog(user, 'PREDICTION_EXECUTE', 'prediction', result.id, parcel.code, `Calculated delay risk: ${result.delayProbabilityPercent}% (${result.riskCategory.toUpperCase()}), ${result.estimatedDelayDays} days`);
    return result;
  }

  public getPredictionsForParcel(parcelId: string): PredictionResult[] {
    return this.state.predictions.filter((p) => p.parcelId === parcelId);
  }

  // --- Milestones ---
  public getMilestones(projectId?: string, parcelId?: string): Milestone[] {
    let list = [...this.state.milestones];
    if (projectId && projectId !== 'all') {
      list = list.filter((m) => m.projectId === projectId);
    }
    if (parcelId) {
      list = list.filter((m) => m.parcelId === parcelId);
    }
    return list;
  }

  public createMilestone(data: Omit<Milestone, 'id'>, user: User): Milestone {
    const newMilestone: Milestone = {
      ...data,
      id: `ms-${Date.now().toString(36)}`,
    };
    this.state.milestones.push(newMilestone);
    this.addAuditLog(user, 'MILESTONE_CREATE', 'milestone', newMilestone.id, newMilestone.name, `Created milestone ${newMilestone.name}`);
    return newMilestone;
  }

  public updateMilestone(id: string, updates: Partial<Milestone>, user: User): Milestone | undefined {
    const idx = this.state.milestones.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.state.milestones[idx] = {
      ...this.state.milestones[idx],
      ...updates,
    };
    this.addAuditLog(user, 'MILESTONE_UPDATE', 'milestone', id, this.state.milestones[idx].name, `Updated milestone: ${Object.keys(updates).join(', ')}`);
    return this.state.milestones[idx];
  }

  // --- Recommendations ---
  public getRecommendations(filters?: { projectId?: string; status?: string; priority?: string }): Recommendation[] {
    let list = [...this.state.recommendations];
    if (filters?.projectId && filters.projectId !== 'all') {
      list = list.filter((r) => r.projectId === filters.projectId);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.priority) {
      list = list.filter((r) => r.priority === filters.priority);
    }
    return list;
  }

  public updateRecommendationStatus(id: string, status: Recommendation['status'], user: User): Recommendation | undefined {
    const idx = this.state.recommendations.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.state.recommendations[idx].status = status;
    if (status === 'completed') {
      this.state.recommendations[idx].completedAt = new Date().toISOString();
    }
    this.addAuditLog(user, 'RECOMMENDATION_STATUS', 'recommendation', id, this.state.recommendations[idx].parcelCode, `Status changed to ${status}`);
    return this.state.recommendations[idx];
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return this.state.notifications;
  }

  public markNotificationRead(id: string): boolean {
    const item = this.state.notifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(): void {
    this.state.notifications.forEach((n) => (n.read = true));
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogItem[] {
    return this.state.auditLogs;
  }

  public addAuditLog(
    user: User,
    action: string,
    objectType: AuditLogItem['objectType'],
    objectId: string,
    objectIdentifier: string,
    details: string
  ): void {
    const log: AuditLogItem = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      user: user.name,
      role: user.role,
      action,
      objectType,
      objectId,
      objectIdentifier,
      details,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs.pop();
    }
  }

  // --- Dashboard & Analytics Aggregates ---
  public getDashboardAnalytics(projectId?: string) {
    let parcels = this.state.parcels;
    let milestones = this.state.milestones;
    let recommendations = this.state.recommendations;

    if (projectId && projectId !== 'all') {
      parcels = parcels.filter((p) => p.projectId === projectId);
      milestones = milestones.filter((m) => m.projectId === projectId);
      recommendations = recommendations.filter((r) => r.projectId === projectId);
    }

    const totalParcels = parcels.length;
    const completedParcels = parcels.filter((p) => p.stage === 'completed' || p.stage === 'handover').length;
    const delayedParcels = parcels.filter((p) => (p.estimatedDelayDays || 0) > 15).length;
    const highRiskParcels = parcels.filter((p) => p.riskCategory === 'high').length;
    const criticalRiskParcels = parcels.filter((p) => p.riskCategory === 'critical').length;
    const overdueMilestones = milestones.filter((m) => m.status === 'delayed' || (m.status === 'in_progress' && new Date(m.plannedCompletionDate) < new Date('2026-10-29'))).length;
    const openRecommendations = recommendations.filter((r) => r.status === 'open' || r.status === 'in_progress').length;

    const overallProgressPercent = totalParcels > 0 ? Math.round((completedParcels / totalParcels) * 100) : 0;

    // Risk distribution
    const riskCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    parcels.forEach((p) => {
      const cat = p.riskCategory || 'low';
      riskCounts[cat] = (riskCounts[cat] || 0) + 1;
    });

    // Stage distribution
    const stageCounts: Record<string, number> = {};
    parcels.forEach((p) => {
      stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
    });

    // Project comparison
    const projectComparison = this.state.projects.map((proj) => {
      const projParcels = this.state.parcels.filter((p) => p.projectId === proj.id);
      const projCompleted = projParcels.filter((p) => p.stage === 'completed' || p.stage === 'handover').length;
      const projHighCrit = projParcels.filter((p) => p.riskCategory === 'high' || p.riskCategory === 'critical').length;
      const avgDelay = projParcels.length > 0 ? Math.round(projParcels.reduce((acc, p) => acc + (p.estimatedDelayDays || 0), 0) / projParcels.length) : 0;

      return {
        id: proj.id,
        code: proj.code,
        name: proj.name,
        category: proj.category,
        totalParcels: projParcels.length,
        completedParcels: projCompleted,
        highCriticalRiskCount: projHighCrit,
        completionPercent: projParcels.length > 0 ? Math.round((projCompleted / projParcels.length) * 100) : 0,
        averageDelayDays: avgDelay,
      };
    });

    return {
      totalProjects: this.state.projects.length,
      totalParcels,
      completedParcels,
      delayedParcels,
      highRiskParcels,
      criticalRiskParcels,
      overdueMilestones,
      openRecommendations,
      overallProgressPercent,
      riskDistribution: [
        { name: 'Low Risk', value: riskCounts.low, color: '#10B981' },
        { name: 'Medium Risk', value: riskCounts.medium, color: '#F59E0B' },
        { name: 'High Risk', value: riskCounts.high, color: '#F97316' },
        { name: 'Critical Risk', value: riskCounts.critical, color: '#EF4444' },
      ],
      stageDistribution: Object.entries(stageCounts).map(([stage, count]) => ({
        stage: stage.replace(/_/g, ' '),
        count,
      })),
      projectComparison,
    };
  }

  // --- CSV Export with formula injection sanitization ---
  public generateParcelsCSV(projectId?: string): string {
    let parcels = this.state.parcels;
    if (projectId && projectId !== 'all') {
      parcels = parcels.filter((p) => p.projectId === projectId);
    }

    const headers = [
      'Parcel Code',
      'Project ID',
      'District',
      'Location',
      'Area (Acres)',
      'Stage',
      'Status',
      'Doc Completeness (%)',
      'Ownership Status',
      'Pending Approvals',
      'Disputes Count',
      'Compensation Status',
      'Critical Path',
      'Risk Score',
      'Risk Category',
      'Est. Delay Days',
      'Planned Possession Date',
      'Synthetic Data Flag',
    ];

    // Sanitize values to prevent formula injection in Excel/Sheets
    const sanitize = (val: unknown): string => {
      let str = String(val ?? '');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = parcels.map((p) => [
      sanitize(p.code),
      sanitize(p.projectId),
      sanitize(p.district),
      sanitize(p.locationName),
      sanitize(p.areaAcres),
      sanitize(p.stage),
      sanitize(p.status),
      sanitize(p.documentationCompleteness),
      sanitize(p.ownershipVerificationStatus),
      sanitize(p.pendingApprovalsCount),
      sanitize(p.disputesCount),
      sanitize(p.compensationStatus),
      sanitize(p.criticalPath ? 'YES' : 'NO'),
      sanitize((p.delayRiskScore || 0).toFixed(2)),
      sanitize(p.riskCategory || 'low'),
      sanitize(p.estimatedDelayDays || 0),
      sanitize(p.plannedPossessionDate),
      sanitize('TRUE (Synthetic demo data)'),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // --- Bulk CSV Import with row validation ---
  public bulkImportParcelsFromCSV(
    csvText: string,
    projectId: string,
    user: User
  ): { importedCount: number; errors: { row: number; reason: string }[] } {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      throw new Error('CSV file has no data rows.');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const errors: { row: number; reason: string }[] = [];
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 4) {
        errors.push({ row: i + 1, reason: 'Insufficient columns; expected minimum code, area, stage, planned date' });
        continue;
      }

      const code = cols[0];
      if (!code) {
        errors.push({ row: i + 1, reason: 'Parcel code is required.' });
        continue;
      }

      // Check duplicate
      const dup = this.state.parcels.find((p) => p.projectId === projectId && p.code.toLowerCase() === code.toLowerCase());
      if (dup) {
        errors.push({ row: i + 1, reason: `Duplicate parcel code "${code}" already exists in project.` });
        continue;
      }

      const area = parseFloat(cols[4] || '1.5');
      if (isNaN(area) || area <= 0) {
        errors.push({ row: i + 1, reason: 'Area in acres must be a positive number.' });
        continue;
      }

      const stage = (cols[5] || 'identification') as Parcel['stage'];
      const doc = parseInt(cols[7] || '50', 10);

      try {
        const proj = this.getProjectById(projectId);
        const newParcel: Parcel = {
          id: `parcel-${Date.now().toString(36)}-${i}`,
          code,
          projectId,
          district: proj?.district || 'District',
          locationName: cols[3] || `Survey Parcel ${code}`,
          latitude: 22.3 + Math.random() * 0.05,
          longitude: 73.1 + Math.random() * 0.05,
          areaAcres: area,
          stage,
          status: 'in_progress',
          documentationCompleteness: isNaN(doc) ? 50 : Math.max(0, Math.min(100, doc)),
          ownershipVerificationStatus: 'in_progress',
          pendingApprovalsCount: 1,
          disputesCount: 0,
          compensationStatus: 'under_assessment',
          surveyStatus: 'in_progress',
          plannedStartDate: '2025-06-01',
          plannedPossessionDate: cols[16] || '2026-12-31',
          criticalPath: false,
          responsibleDepartment: 'Revenue & Documentation Wing',
          lastReviewDate: new Date().toISOString().split('T')[0],
        };

        const pred = runModelInference(newParcel, proj?.name || 'Project');
        newParcel.delayRiskScore = pred.delayProbability;
        newParcel.riskCategory = pred.riskCategory;
        newParcel.estimatedDelayDays = pred.estimatedDelayDays;
        newParcel.lastPredictedAt = pred.predictedAt;

        this.state.parcels.unshift(newParcel);
        this.state.predictions.unshift(pred);
        importedCount++;
      } catch (err: unknown) {
        errors.push({ row: i + 1, reason: err instanceof Error ? err.message : 'Parsing error' });
      }
    }

    this.addAuditLog(user, 'PARCEL_BULK_IMPORT', 'parcel', projectId, `Imported ${importedCount}`, `Bulk imported ${importedCount} parcels (${errors.length} failed rows)`);
    return { importedCount, errors };
  }
}

export const db = new Database();
