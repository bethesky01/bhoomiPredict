import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { User } from './src/types';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Default active user session (simulated auth session with role-based access)
let currentUser: User = db.getState().users[0]; // Admin by default for local development & demonstration

// Middleware helper to authenticate
const authenticate = (req: Request, res: Response, next: () => void) => {
  // Allows switching user via header or session
  const roleHeader = req.headers['x-user-role'] as string;
  if (roleHeader) {
    const found = db.getState().users.find((u) => u.role === roleHeader);
    if (found) currentUser = found;
  }
  (req as any).user = currentUser;
  next();
};

app.use(authenticate);

function registerApiRoutes() {
  // ----------------------------------------------------
  // AUTHENTICATION ENDPOINTS
  // ----------------------------------------------------
  app.post('/api/v1/auth/login/', (req: Request, res: Response) => {
    const { username, role } = req.body;
    let user = db.getState().users.find((u) => u.username === username || u.role === role);
    if (!user) {
      user = db.getState().users.find((u) => u.role === (role || 'administrator')) || db.getState().users[0];
    }
    currentUser = user;
    db.addAuditLog(user, 'AUTH_LOGIN', 'model', user.id, user.username, `User logged in with role: ${user.role}`);
    res.json({
      user,
      token: 'demo-jwt-session-token',
      syntheticDataIndicator: true,
    });
  });

  app.post('/api/v1/auth/logout/', (req: Request, res: Response) => {
    db.addAuditLog(currentUser, 'AUTH_LOGOUT', 'model', currentUser.id, currentUser.username, 'User logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/v1/auth/me/', (req: Request, res: Response) => {
    res.json({
      user: currentUser,
      rolesAvailable: db.getState().users,
      syntheticDataIndicator: true,
    });
  });

  app.get('/api/v1/auth/users/', (req: Request, res: Response) => {
    res.json(db.getState().users);
  });

  // ----------------------------------------------------
  // PROJECTS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/projects/', (req: Request, res: Response) => {
    const { search, category, status } = req.query as Record<string, string>;
    const projects = db.getProjects({ search, category, status });
    res.json({
      results: projects,
      count: projects.length,
      syntheticDataIndicator: true,
    });
  });

  app.get('/api/v1/projects/:id/', (req: Request, res: Response) => {
    const project = db.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  });

  app.post('/api/v1/projects/', (req: Request, res: Response) => {
    if (currentUser.role === 'analyst') {
      return res.status(403).json({ error: 'Analysts do not have permission to create projects.' });
    }
    try {
      const created = db.createProject(req.body, currentUser);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/v1/projects/:id/', (req: Request, res: Response) => {
    if (currentUser.role === 'analyst') {
      return res.status(403).json({ error: 'Analysts do not have permission to modify projects.' });
    }
    const updated = db.updateProject(req.params.id, req.body, currentUser);
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  });

  // ----------------------------------------------------
  // PARCELS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/parcels/', (req: Request, res: Response) => {
    const {
      projectId,
      stage,
      riskCategory,
      status,
      search,
      criticalPath,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const data = db.getParcels({
      projectId,
      stage,
      riskCategory,
      status,
      search,
      criticalPath: criticalPath === 'true' ? true : criticalPath === 'false' ? false : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      sortBy,
      sortOrder: sortOrder as any,
    });

    res.json({
      ...data,
      syntheticDataIndicator: true,
      disclaimer: 'DEMO MODE — Predictions are based on synthetic data priors and need official validation.',
    });
  });

  app.get('/api/v1/parcels/:id/', (req: Request, res: Response) => {
    const parcel = db.getParcelById(req.params.id);
    if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
    const project = db.getProjectById(parcel.projectId);
    const predictions = db.getPredictionsForParcel(parcel.id);
    const milestones = db.getMilestones(parcel.projectId, parcel.id);
    const recommendations = db.getRecommendations({ projectId: parcel.projectId }).filter((r) => r.parcelId === parcel.id);

    res.json({
      parcel,
      project,
      predictions,
      milestones,
      recommendations,
      syntheticDataIndicator: true,
    });
  });

  app.post('/api/v1/parcels/', (req: Request, res: Response) => {
    if (currentUser.role === 'analyst') {
      return res.status(403).json({ error: 'Analysts do not have permission to create parcels.' });
    }
    try {
      const created = db.createParcel(req.body, currentUser);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/v1/parcels/:id/', (req: Request, res: Response) => {
    if (currentUser.role === 'analyst') {
      return res.status(403).json({ error: 'Analysts do not have permission to edit parcels.' });
    }
    try {
      const updated = db.updateParcel(req.params.id, req.body, currentUser);
      if (!updated) return res.status(404).json({ error: 'Parcel not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/v1/parcels/:id/', (req: Request, res: Response) => {
    if (currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only administrators can delete or archive parcels.' });
    }
    const success = db.deleteParcel(req.params.id, currentUser);
    if (!success) return res.status(404).json({ error: 'Parcel not found' });
    res.json({ success: true, message: 'Parcel deleted successfully' });
  });

  app.post('/api/v1/parcels/bulk-import/', (req: Request, res: Response) => {
    if (currentUser.role === 'analyst') {
      return res.status(403).json({ error: 'Analysts do not have permission for bulk imports.' });
    }
    const { csvData, projectId } = req.body;
    if (!csvData || !projectId) {
      return res.status(400).json({ error: 'Both csvData and projectId are required.' });
    }
    try {
      const result = db.bulkImportParcelsFromCSV(csvData, projectId, currentUser);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // PREDICTION INFERENCE ENDPOINTS
  // ----------------------------------------------------
  app.post('/api/v1/parcels/:id/predict/', (req: Request, res: Response) => {
    try {
      const prediction = db.predictForParcel(req.params.id, currentUser);
      res.json(prediction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/v1/parcels/:id/predictions/', (req: Request, res: Response) => {
    const list = db.getPredictionsForParcel(req.params.id);
    res.json({
      results: list,
      count: list.length,
      syntheticDataIndicator: true,
    });
  });

  // ----------------------------------------------------
  // MODEL GOVERNANCE & EVALUATION ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/models/status/', (req: Request, res: Response) => {
    res.json({
      status: 'active',
      metadata: db.getState().modelMetadata,
      syntheticDataIndicator: true,
    });
  });

  app.get('/api/v1/models/metrics/', (req: Request, res: Response) => {
    res.json(db.getState().modelMetadata);
  });

  app.post('/api/v1/models/train/', (req: Request, res: Response) => {
    if (currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only administrators can trigger model retraining.' });
    }
    const { samples = 5000, seed = 42 } = req.body;

    // Simulate retraining and update metadata
    const state = db.getState();
    state.modelMetadata.trainingSamples = samples;
    state.modelMetadata.datasetSeed = seed;
    state.modelMetadata.trainedAt = new Date().toISOString();
    state.modelMetadata.version = `v2.4.2-rf-${seed}`;

    db.addAuditLog(
      currentUser,
      'MODEL_TRAIN',
      'model',
      state.modelMetadata.version,
      'RandomForest Ensemble',
      `Trained pipeline with ${samples} synthetic samples and seed ${seed}. Model artifact updated.`
    );

    res.json({
      success: true,
      message: `Model pipeline trained successfully on ${samples} observations.`,
      metadata: state.modelMetadata,
    });
  });

  // ----------------------------------------------------
  // MILESTONES ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/milestones/', (req: Request, res: Response) => {
    const { projectId, parcelId } = req.query as Record<string, string>;
    const items = db.getMilestones(projectId, parcelId);
    res.json({
      results: items,
      count: items.length,
      syntheticDataIndicator: true,
    });
  });

  app.post('/api/v1/milestones/', (req: Request, res: Response) => {
    try {
      const created = db.createMilestone(req.body, currentUser);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/v1/milestones/:id/', (req: Request, res: Response) => {
    const updated = db.updateMilestone(req.params.id, req.body, currentUser);
    if (!updated) return res.status(404).json({ error: 'Milestone not found' });
    res.json(updated);
  });

  // ----------------------------------------------------
  // RECOMMENDATIONS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/recommendations/', (req: Request, res: Response) => {
    const { projectId, status, priority } = req.query as Record<string, string>;
    const recs = db.getRecommendations({ projectId, status, priority });
    res.json({
      results: recs,
      count: recs.length,
      syntheticDataIndicator: true,
    });
  });

  app.patch('/api/v1/recommendations/:id/', (req: Request, res: Response) => {
    const { status } = req.body;
    const updated = db.updateRecommendationStatus(req.params.id, status, currentUser);
    if (!updated) return res.status(404).json({ error: 'Recommendation not found' });
    res.json(updated);
  });

  // ----------------------------------------------------
  // NOTIFICATIONS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/notifications/', (req: Request, res: Response) => {
    const items = db.getNotifications();
    const unreadCount = items.filter((n) => !n.read).length;
    res.json({ results: items, unreadCount });
  });

  app.patch('/api/v1/notifications/:id/read/', (req: Request, res: Response) => {
    const success = db.markNotificationRead(req.params.id);
    res.json({ success });
  });

  app.post('/api/v1/notifications/read-all/', (req: Request, res: Response) => {
    db.markAllNotificationsRead();
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // AUDIT LOGS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/audit/', (req: Request, res: Response) => {
    res.json({ results: db.getAuditLogs() });
  });

  // ----------------------------------------------------
  // ANALYTICS & DASHBOARD ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/analytics/dashboard/', (req: Request, res: Response) => {
    const { projectId } = req.query as Record<string, string>;
    const analytics = db.getDashboardAnalytics(projectId);
    res.json({
      ...analytics,
      syntheticDataIndicator: true,
    });
  });

  // ----------------------------------------------------
  // REPORTS & EXPORTS ENDPOINTS
  // ----------------------------------------------------
  app.get('/api/v1/reports/risk.csv', (req: Request, res: Response) => {
    const { projectId } = req.query as Record<string, string>;
    const csvContent = db.generateParcelsCSV(projectId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bhoomipredict-parcels-risk-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  });

  app.get('/api/v1/reports/summary/', (req: Request, res: Response) => {
    const { projectId } = req.query as Record<string, string>;
    const analytics = db.getDashboardAnalytics(projectId);
    const parcels = db.getParcels({ projectId, pageSize: 100 });
    const recs = db.getRecommendations({ projectId });

    res.json({
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.name,
      analytics,
      sampleHighRiskParcels: parcels.items.filter((p) => p.riskCategory === 'high' || p.riskCategory === 'critical').slice(0, 10),
      openRecommendations: recs.filter((r) => r.status === 'open' || r.status === 'in_progress').slice(0, 10),
      syntheticDataIndicator: true,
      disclaimer: 'DEMO MODE — Synthetic data. Predictions are not validated for real-world land acquisition.',
    });
  });

  // ----------------------------------------------------
  // SYSTEM SEED / RESET ENDPOINTS
  // ----------------------------------------------------
  app.post('/api/v1/system/seed/', (req: Request, res: Response) => {
    if (currentUser.role !== 'administrator') {
      return res.status(403).json({ error: 'Only administrators can reset demonstration database.' });
    }
    const { seed = 42 } = req.body;
    db.resetData(seed);
    db.addAuditLog(currentUser, 'DATABASE_RESET', 'model', 'all', 'Synthetic Database', `Reset and re-seeded database with seed ${seed}`);
    res.json({
      success: true,
      message: 'Synthetic demonstration database re-seeded successfully.',
    });
  });

  // Health check
  app.get('/api/v1/health/', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'BhoomiPredict AI',
      timestamp: new Date().toISOString(),
      syntheticDataMode: true,
    });
  });
}

registerApiRoutes();

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BhoomiPredict AI server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
