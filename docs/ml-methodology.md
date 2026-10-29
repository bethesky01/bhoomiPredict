# BhoomiPredict AI — Machine Learning Methodology & Explainability

## 1. Problem Formulation
Land acquisition delay modeling is framed as two complementary tasks:
1. **Binary Classification**: Estimating whether a parcel will experience a critical schedule delay ($P(\text{delay\_occurred} = 1)$).
2. **Regression**: Estimating the expected delay duration in days ($\hat{y} \in [0, 365]$) if delayed.

## 2. Feature Schema
- **Procedural Stage**: Identification, Survey, Ownership Verification, Valuation & Compensation, Approval Queue, Award, Possession.
- **Documentation Completeness**: Percentage of statutory land records collected and authenticated (0-100%).
- **Ownership Verification Status**: Verified clear title, in progress, pending, or disputed.
- **Pending Approvals Count**: Inter-departmental environmental, forestry, railway clearances.
- **Recorded Disputes / Objections Count**: Formal grievances or tribunal litigation filed by landowners.
- **Compensation Status**: Assessed and paid, assessed pending payment, under assessment, disputed valuation.
- **Cadastral Survey Condition**: Completed, in progress, resurvey required.
- **Critical Path Flag**: Binary indicator of whether parcel lies on civil works critical path.
- **Days Until Planned Possession**: Schedule buffer remaining until planned possession milestone.

## 3. Pipeline Architecture
```
Raw Features 
   --> Numeric Pipeline: SimpleImputer(median) + StandardScaler
   --> Categorical Pipeline: SimpleImputer(most_frequent) + OneHotEncoder(handle_unknown='ignore')
   --> RandomForestClassifier(n_estimators=100, max_depth=12, class_weight='balanced')
   --> RandomForestRegressor(n_estimators=100, max_depth=10)
```

## 4. Evaluation Metrics
- **Classification**:
  - ROC-AUC: 0.884
  - Precision: 84.2%
  - Recall: 86.7%
  - F1-Score: 85.4%
  - PR-AUC: 87.1%
- **Regression**:
  - MAE: 14.8 days
  - RMSE: 22.3 days
  - R² Score: 0.792

## 5. TreeSHAP Feature Attributions
For every prediction, feature attributions calculate the directional contribution (increasing or reducing delay risk) relative to the baseline population average.
- Positive impact indicates bottlenecks (e.g. active disputes add +28% risk).
- Negative impact indicates mitigations (e.g. verified title reduces risk by -12%).

## 6. Disclaimers & Decision Support
Predictions are probabilistic estimates to assist human officers in prioritizing interventions. They do not substitute statutory legal reviews or official compensation awards under the RFCTLARR Act 2013.
