# BhoomiPredict AI — REST API Reference (`/api/v1/`)

All endpoints require appropriate role permissions and return JSON payloads with a synthetic data flag.

### Authentication
- `POST /api/v1/auth/login/`
  - Body: `{"role": "administrator" | "project_manager" | "analyst"}`
  - Returns user profile and session token.
- `POST /api/v1/auth/logout/`
- `GET /api/v1/auth/me/`
  - Returns current user context, department, and role permissions.

### Infrastructure Projects
- `GET /api/v1/projects/?search=&category=&status=`
  - Returns list of projects and portfolio totals.
- `GET /api/v1/projects/:id/`
- `POST /api/v1/projects/` (Admin & PM only)
- `PATCH /api/v1/projects/:id/` (Admin & PM only)

### Land Parcels
- `GET /api/v1/parcels/?projectId=&stage=&riskCategory=&criticalPath=&search=&page=&pageSize=&sortBy=&sortOrder=`
  - Returns paginated parcels with risk indicators.
- `GET /api/v1/parcels/:id/`
  - Returns parcel, related milestones, predictions, and recommendations.
- `POST /api/v1/parcels/` (Admin & PM only)
- `PATCH /api/v1/parcels/:id/` (Admin & PM only)
- `DELETE /api/v1/parcels/:id/` (Admin only)
- `POST /api/v1/parcels/bulk-import/`
  - Validates CSV rows against project code uniqueness and value constraints.

### Real-Time Inference & Predictions
- `POST /api/v1/parcels/:id/predict/`
  - Runs Random Forest inference, calculates delay probability, extra delay days, SHAP feature attributions, generates interventions, and stores prediction in audit history.
- `GET /api/v1/parcels/:id/predictions/`
  - Historical prediction log for the parcel.

### Model Governance
- `GET /api/v1/models/status/`
- `GET /api/v1/models/metrics/`
- `POST /api/v1/models/train/` (Admin only)

### Milestones & Interventions
- `GET /api/v1/milestones/?projectId=&parcelId=`
- `POST /api/v1/milestones/`
- `PATCH /api/v1/milestones/:id/`
- `GET /api/v1/recommendations/?projectId=&status=&priority=`
- `PATCH /api/v1/recommendations/:id/` (toggle status)

### Analytics & Reports
- `GET /api/v1/analytics/dashboard/?projectId=`
- `GET /api/v1/reports/risk.csv` (CSV download with formula injection sanitization)
- `GET /api/v1/reports/summary/?projectId=`
