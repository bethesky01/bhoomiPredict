# BhoomiPredict AI — System Architecture

## Overview
BhoomiPredict AI is a decision-support platform designed to predict, explain, and mitigate land acquisition delays across capital infrastructure projects (highways, railways, metro corridors, industrial parks, power transmission).

## Architectural Layers

1. **Frontend Presentation (React + TypeScript + Vite + Tailwind CSS)**:
   - High-contrast accessible design following SaaS operational guidelines.
   - Interactive components:
     - Executive KPI & Analytics Dashboard (Recharts).
     - GIS Spatial Alignment Map (Leaflet with OpenStreetMap tiles).
     - ML Prediction Studio with Sensitivity Sliders & TreeSHAP Waterfall.
     - Land Parcels Registry with CSV Bulk Import & Export.
     - Procedural Milestones & Schedule Timeline.
     - Prescriptive Intervention & Action Center.
     - Model Governance & Diagnostic Metrics.
     - Role-Based Access Control (Admin, Project Manager, Analyst).

2. **Application Server & REST API (`server.ts` & Express / Django)**:
   - Versioned REST API under `/api/v1/`.
   - Mounts Vite middlewares in local development for instantaneous execution on port 3000.
   - Authentication & role checking middleware (`x-user-role`, session verification).
   - Input validation and formula-injection prevention on exports.
   - Idempotent synthetic data seeder & database reset command.

3. **Machine Learning Pipeline**:
   - `RandomForestClassifier`: Estimating binary delay occurrence probability with calibrated decision boundaries (Low: <30%, Medium: 30-59%, High: 60-79%, Critical: ≥80%).
   - `RandomForestRegressor`: Estimating additional delay days.
   - TreeSHAP feature attributions decomposing marginal feature contributions.
   - Rule-based prescriptive intervention engine that translates detected bottlenecks into assigned tasks.

4. **Persistence Layer (PostgreSQL / Relational In-Memory Store)**:
   - Projects, Parcels, Milestones, Predictions, Recommendations, Audit Logs, Notifications, Model Metadata.
