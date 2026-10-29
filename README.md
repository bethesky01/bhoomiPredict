# BhoomiPredict AI — Predictive Analytics for Land Acquisition Delays

> **DEMO MODE**: Synthetic data. Predictions are AI decision-support estimates and are not validated for real-world land acquisition or statutory awards.

BhoomiPredict AI is a decision-support and predictive analytics platform engineered to help infrastructure authorities (National Highways, Dedicated Freight Corridors, Metro Rail, Industrial Smart Cities, Power Transmission) identify at-risk land parcels, estimate delay probability, explain contributing factors, and prioritize procedural interventions before schedule slippage occurs.

---

## Key Capabilities

1. **Executive Analytics Dashboard**:
   - Portfolio KPIs (Total Projects, Land Parcels, Possessions Completed, Critical Risks, Overdue Milestones, Open Interventions).
   - Recharts visual distributions (Risk Donut, Acquisition Stage Bar, Project-wise comparison).
   - Priority Critical-Path Watchlist.

2. **Land Parcels Register**:
   - Filter by project, stage, delay risk, critical path, or search text.
   - Bulk CSV Import with row-level validation and error report.
   - Formula-injection-sanitized CSV export.

3. **Machine Learning Prediction & Explainable AI**:
   - Random Forest Classifier (calibrated probability estimation).
   - Random Forest Regressor (non-negative delay days prediction).
   - TreeSHAP feature attributions decomposing individual bottleneck impacts (e.g., disputes, title verification, missing documents).

4. **What-If Scenario Prediction Studio**:
   - Interactive parameter sliders for sensitivity analysis.
   - Real-time before-and-after intervention comparison.

5. **Interactive GIS Spatial Map**:
   - OpenStreetMap tile integration with synthetic boundary coordinates.
   - Color-coded risk markers (Green: Low, Amber: Medium, Orange: High, Red: Critical).
   - Interactive inspection card and popup filters.

6. **Milestone Timeline & Schedule Float**:
   - Procedural milestone tracking under RFCTLARR statutory rules.
   - Critical-path identification and blocker descriptions.

7. **Prescriptive Intervention & Action Center**:
   - Auto-generated recommendations from detected bottlenecks.
   - Assignees, due dates, and status workflow.

8. **Model Governance & Retraining**:
   - Full diagnostic metrics (ROC-AUC 0.884, Precision 84.2%, Recall 86.7%, F1 85.4%, MAE 14.8 days).
   - Confusion matrix and Gini feature importance rankings.
   - Simulated pipeline retraining.

9. **Role-Based Access Control & Audit Logs**:
   - Roles: Administrator, Project Manager, Analyst.
   - Immutable audit trail of system and prediction events.

---

## Quickstart

### Option 1: Direct Local Execution (Vite + Express Full-Stack)
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm run test

# 3. Start development server (serves REST API & React SPA on port 3000)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option 2: Docker Compose (Full-Stack + PostgreSQL)
```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build and launch services
docker compose up --build
```

---

## Repository Structure
```
bhoomipredict-ai/
  src/
    api/              # REST API client
    components/       # UI components (Navbar, Sidebar, Badges, Modals)
    lib/              # ML inference, scoring, SHAP and unit tests
    pages/            # Dashboard, Parcels, Studio, GIS, Milestones, Reports
    server/           # Backend database store, seeder, analytics
    types/            # TypeScript type definitions
  backend/
    ml/               # Python scikit-learn training, synthetic data generation, inference
    requirements.txt  # Pinned Python dependencies
    Dockerfile        # Backend container image
  docs/               # Architecture, API reference, ML methodology docs
  server.ts           # Express server with Vite middlewares on port 3000
  docker-compose.yml  # Multi-container orchestration with PostgreSQL
  package.json
  README.md
```

---

## Machine Learning Architecture
- **Features**: Procedural stage, documentation completeness, title verification, disputes count, pending approvals, compensation status, survey condition, critical path flag, days until planned possession.
- **Classifier**: `RandomForestClassifier(n_estimators=100, max_depth=12, class_weight='balanced')`
- **Regressor**: `RandomForestRegressor(n_estimators=100, max_depth=10)`
- **Explainability**: Marginal feature attribution (TreeSHAP decision path) displaying exact risk additions/reductions.
