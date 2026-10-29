"""
BhoomiPredict AI — Machine Learning Training Pipeline
Trains RandomForestClassifier (delay probability) and RandomForestRegressor (delay duration)
using scikit-learn Pipeline and ColumnTransformer.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    confusion_matrix,
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
)

from .data_generation import generate_synthetic_dataset


def train_models(n_samples: int = 5000, seed: int = 42, output_dir: str = 'ml_models'):
    print(f"Generating {n_samples} synthetic observations (seed={seed})...")
    df = generate_synthetic_dataset(n_samples=n_samples, seed=seed)

    feature_cols = [
        'area_acres',
        'stage',
        'documentation_completeness',
        'ownership_verification_status',
        'pending_approvals_count',
        'disputes_count',
        'compensation_status',
        'survey_status',
        'critical_path',
        'project_category',
        'days_until_planned_possession',
    ]

    categorical_cols = [
        'stage',
        'ownership_verification_status',
        'compensation_status',
        'survey_status',
        'project_category',
    ]

    numeric_cols = [
        'area_acres',
        'documentation_completeness',
        'pending_approvals_count',
        'disputes_count',
        'critical_path',
        'days_until_planned_possession',
    ]

    X = df[feature_cols]
    y_clf = df['delay_occurred']
    y_reg = df['actual_delay_days']

    # Stratified Train/Val/Test Split (70/15/15)
    X_train, X_temp, y_train_clf, y_temp_clf, y_train_reg, y_temp_reg = train_test_split(
        X, y_clf, y_reg, test_size=0.30, random_state=seed, stratify=y_clf
    )
    X_val, X_test, y_val_clf, y_test_clf, y_val_reg, y_test_reg = train_test_split(
        X_temp, y_temp_clf, y_temp_reg, test_size=0.50, random_state=seed, stratify=y_temp_clf
    )

    # Preprocessing Pipeline
    numeric_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
    ])

    categorical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])

    preprocessor = ColumnTransformer([
        ('num', numeric_transformer, numeric_cols),
        ('cat', categorical_transformer, categorical_cols),
    ])

    # 1. Classifier Pipeline
    clf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=12, random_state=seed, class_weight='balanced')),
    ])

    print("Fitting Random Forest Classifier...")
    clf_pipeline.fit(X_train, y_train_clf)
    y_pred_clf = clf_pipeline.predict(X_test)
    y_prob_clf = clf_pipeline.predict_proba(X_test)[:, 1]

    clf_metrics = {
        'roc_auc': float(roc_auc_score(y_test_clf, y_prob_clf)),
        'precision': float(precision_score(y_test_clf, y_pred_clf)),
        'recall': float(recall_score(y_test_clf, y_pred_clf)),
        'f1_score': float(f1_score(y_test_clf, y_pred_clf)),
        'accuracy': float(accuracy_score(y_test_clf, y_pred_clf)),
        'confusion_matrix': confusion_matrix(y_test_clf, y_pred_clf).tolist(),
    }

    # 2. Regressor Pipeline (trained on delayed subset to learn non-zero delay duration)
    delay_mask = y_train_clf == 1
    reg_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=10, random_state=seed)),
    ])

    print("Fitting Random Forest Regressor...")
    reg_pipeline.fit(X_train[delay_mask], y_train_reg[delay_mask])
    test_delay_mask = y_test_clf == 1
    y_pred_reg = reg_pipeline.predict(X_test[test_delay_mask])

    reg_metrics = {
        'mae_days': float(mean_absolute_error(y_test_reg[test_delay_mask], y_pred_reg)),
        'rmse_days': float(root_mean_squared_error(y_test_reg[test_delay_mask], y_pred_reg)),
        'r2_score': float(r2_score(y_test_reg[test_delay_mask], y_pred_reg)),
    }

    os.makedirs(output_dir, exist_ok=True)
    clf_path = os.path.join(output_dir, 'delay_classifier.joblib')
    reg_path = os.path.join(output_dir, 'delay_regressor.joblib')
    meta_path = os.path.join(output_dir, 'model_metadata.json')

    joblib.dump(clf_pipeline, clf_path)
    joblib.dump(reg_pipeline, reg_path)

    metadata = {
        'version': f'v2.4.1-rf-{seed}',
        'trained_at': datetime.utcnow().isoformat() + 'Z',
        'n_samples': n_samples,
        'seed': seed,
        'classification_metrics': clf_metrics,
        'regression_metrics': reg_metrics,
        'features': feature_cols,
        'disclaimer': 'DEMO MODE — Synthetic dataset generated with controlled priors. Not validated for real-world land acquisition.',
    }

    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Artifacts successfully saved to {output_dir}/")
    print(f"Classification ROC-AUC: {clf_metrics['roc_auc']:.3f}, F1: {clf_metrics['f1_score']:.3f}")
    print(f"Regression MAE: {reg_metrics['mae_days']:.1f} days")
    return metadata


if __name__ == '__main__':
    train_models()
