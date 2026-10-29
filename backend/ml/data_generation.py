"""
BhoomiPredict AI — Synthetic Data Generation Pipeline
Generates reproducible synthetic observations of infrastructure land acquisition parcels.

DISCLAIMER: All generated records are strictly synthetic. They do not represent official
government records, real landowner titles, or verified court litigation outcomes.
"""

import numpy as np
import pandas as pd
from typing import Tuple


def generate_synthetic_dataset(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic parcel observations with realistic distributions
    and documented probabilistic dependencies for delay modeling.
    """
    rng = np.random.default_rng(seed)

    stages = [
        'identification',
        'survey',
        'ownership_verification',
        'valuation_and_compensation',
        'approval',
        'award',
        'possession',
        'handover',
    ]
    stage_probs = [0.10, 0.12, 0.18, 0.20, 0.15, 0.10, 0.10, 0.05]

    ownership_statuses = ['verified', 'in_progress', 'pending', 'disputed']
    ownership_probs = [0.45, 0.30, 0.15, 0.10]

    compensation_statuses = ['assessed_and_paid', 'assessed_pending_payment', 'under_assessment', 'disputed']
    compensation_probs = [0.35, 0.25, 0.25, 0.15]

    survey_statuses = ['completed', 'in_progress', 'resurvey_required']
    survey_probs = [0.60, 0.25, 0.15]

    project_categories = ['highway', 'railway', 'metro', 'industrial', 'transmission']

    data = {
        'area_acres': np.round(rng.exponential(scale=2.5, size=n_samples) + 0.5, 2),
        'stage': rng.choice(stages, size=n_samples, p=stage_probs),
        'documentation_completeness': np.clip(np.round(rng.normal(loc=65, scale=22, size=n_samples)), 0, 100),
        'ownership_verification_status': rng.choice(ownership_statuses, size=n_samples, p=ownership_probs),
        'pending_approvals_count': rng.poisson(lam=1.2, size=n_samples),
        'disputes_count': rng.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.72, 0.16, 0.07, 0.03, 0.02]),
        'compensation_status': rng.choice(compensation_statuses, size=n_samples, p=compensation_probs),
        'survey_status': rng.choice(survey_statuses, size=n_samples, p=survey_probs),
        'critical_path': rng.choice([0, 1], size=n_samples, p=[0.70, 0.30]),
        'project_category': rng.choice(project_categories, size=n_samples),
        'days_until_planned_possession': np.round(rng.uniform(low=15, high=365, size=n_samples)),
    }

    df = pd.DataFrame(data)

    # Documented synthetic delay risk score rule (latent variable)
    latent_risk = (
        0.30 * (df['disputes_count'] > 0)
        + 0.25 * (df['ownership_verification_status'] == 'disputed')
        + 0.15 * (df['ownership_verification_status'] == 'pending')
        + 0.20 * (df['documentation_completeness'] < 50)
        + 0.10 * (df['compensation_status'] == 'disputed')
        + 0.08 * (df['survey_status'] == 'resurvey_required')
        + 0.06 * (df['pending_approvals_count'] >= 3)
        + 0.08 * (df['critical_path'] == 1)
        - 0.15 * (df['documentation_completeness'] >= 85)
        - 0.12 * (df['ownership_verification_status'] == 'verified')
        + rng.normal(0, 0.10, size=n_samples)
    )

    # Sigmoid mapping to delay_occurred
    prob = 1.0 / (1.0 + np.exp(-3.5 * (latent_risk - 0.20)))
    df['delay_occurred'] = (prob > rng.uniform(0, 1, size=n_samples)).astype(int)

    # Synthetic delay duration in days
    base_delay = np.maximum(0, (latent_risk * 90) + (df['disputes_count'] * 25) + rng.normal(15, 10, size=n_samples))
    df['actual_delay_days'] = np.where(df['delay_occurred'] == 1, np.round(np.clip(base_delay, 5, 365)), 0).astype(int)

    return df


if __name__ == '__main__':
    df = generate_synthetic_dataset(100)
    print(f"Generated {len(df)} synthetic samples. Delay rate: {df['delay_occurred'].mean():.2%}")
