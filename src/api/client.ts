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
  UserRole,
} from '../types';

class ApiClient {
  private activeRole: UserRole = 'administrator';

  public setRole(role: UserRole) {
    this.activeRole = role;
  }

  public getRole(): UserRole {
    return this.activeRole;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-role': this.activeRole,
      ...options.headers,
    };

    const res = await fetch(endpoint, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }
    return res.json() as Promise<T>;
  }

  // Auth
  async getCurrentUser(): Promise<{ user: User; rolesAvailable: User[] }> {
    return this.request('/api/v1/auth/me/');
  }

  async login(role: UserRole): Promise<{ user: User; token: string }> {
    this.setRole(role);
    return this.request('/api/v1/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/api/v1/auth/logout/', { method: 'POST' });
  }

  // Projects
  async getProjects(params?: { search?: string; category?: string; status?: string }): Promise<{ results: Project[]; count: number }> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/api/v1/projects/${q ? `?${q}` : ''}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/v1/projects/${id}/`);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    return this.request('/api/v1/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    return this.request(`/api/v1/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Parcels
  async getParcels(params?: {
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
  }): Promise<{ items: Parcel[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
    }
    const q = new URLSearchParams(cleanParams).toString();
    return this.request(`/api/v1/parcels/${q ? `?${q}` : ''}`);
  }

  async getParcel(id: string): Promise<{
    parcel: Parcel;
    project?: Project;
    predictions: PredictionResult[];
    milestones: Milestone[];
    recommendations: Recommendation[];
  }> {
    return this.request(`/api/v1/parcels/${id}/`);
  }

  async createParcel(data: Partial<Parcel>): Promise<Parcel> {
    return this.request('/api/v1/parcels/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateParcel(id: string, updates: Partial<Parcel>): Promise<Parcel> {
    return this.request(`/api/v1/parcels/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteParcel(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/v1/parcels/${id}/`, { method: 'DELETE' });
  }

  async bulkImportParcels(csvData: string, projectId: string): Promise<{ importedCount: number; errors: { row: number; reason: string }[] }> {
    return this.request('/api/v1/parcels/bulk-import/', {
      method: 'POST',
      body: JSON.stringify({ csvData, projectId }),
    });
  }

  // Predictions
  async runPrediction(parcelId: string): Promise<PredictionResult> {
    return this.request(`/api/v1/parcels/${parcelId}/predict/`, { method: 'POST' });
  }

  async getParcelPredictions(parcelId: string): Promise<{ results: PredictionResult[]; count: number }> {
    return this.request(`/api/v1/parcels/${parcelId}/predictions/`);
  }

  // Model Governance
  async getModelStatus(): Promise<{ status: string; metadata: ModelMetadata }> {
    return this.request('/api/v1/models/status/');
  }

  async trainModel(samples = 5000, seed = 42): Promise<{ success: boolean; message: string; metadata: ModelMetadata }> {
    return this.request('/api/v1/models/train/', {
      method: 'POST',
      body: JSON.stringify({ samples, seed }),
    });
  }

  // Milestones
  async getMilestones(projectId?: string, parcelId?: string): Promise<{ results: Milestone[]; count: number }> {
    const q = new URLSearchParams();
    if (projectId) q.append('projectId', projectId);
    if (parcelId) q.append('parcelId', parcelId);
    return this.request(`/api/v1/milestones/?${q.toString()}`);
  }

  async createMilestone(data: Partial<Milestone>): Promise<Milestone> {
    return this.request('/api/v1/milestones/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    return this.request(`/api/v1/milestones/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Recommendations
  async getRecommendations(params?: { projectId?: string; status?: string; priority?: string }): Promise<{ results: Recommendation[]; count: number }> {
    const q = new URLSearchParams(params as any).toString();
    return this.request(`/api/v1/recommendations/${q ? `?${q}` : ''}`);
  }

  async updateRecommendationStatus(id: string, status: Recommendation['status']): Promise<Recommendation> {
    return this.request(`/api/v1/recommendations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Notifications
  async getNotifications(): Promise<{ results: NotificationItem[]; unreadCount: number }> {
    return this.request('/api/v1/notifications/');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/v1/notifications/${id}/read/`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request('/api/v1/notifications/read-all/', { method: 'POST' });
  }

  // Audit Logs
  async getAuditLogs(): Promise<{ results: AuditLogItem[] }> {
    return this.request('/api/v1/audit/');
  }

  // Dashboard Analytics
  async getDashboardAnalytics(projectId?: string): Promise<any> {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request(`/api/v1/analytics/dashboard/${q}`);
  }

  // Reports
  async getReportSummary(projectId?: string): Promise<any> {
    const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.request(`/api/v1/reports/summary/${q}`);
  }

  getExportCsvUrl(projectId?: string): string {
    return `/api/v1/reports/risk.csv${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`;
  }

  // System
  async resetDemoData(seed = 42): Promise<{ success: boolean; message: string }> {
    return this.request('/api/v1/system/seed/', {
      method: 'POST',
      body: JSON.stringify({ seed }),
    });
  }
}

export const api = new ApiClient();
