"""
Model Training Pipeline for CDVRisk_Sim.
Trains 3 XGBoost classifiers (LAD, LCX, RCA) with hyperparameter tuning,
evaluates them, creates SHAP explainers, and saves everything.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report,
)
import xgboost as xgb
import shap
import joblib

from app.ml.preprocessor import (
    run_preprocessing, get_feature_columns, TARGET_COLS,
    PROCESSED_CSV_PATH, PREPROCESSOR_PATH,
)

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "trained_models")
EVAL_REPORT_PATH = os.path.join(MODELS_DIR, "evaluation_report.json")

VESSEL_TARGETS = ["LAD", "LCX", "RCA"]


def train_models():
    """Main training pipeline."""
    print("=" * 60)
    print("CDVRisk_Sim — Model Training Pipeline")
    print("=" * 60)

    # Step 1: Run preprocessing if needed
    if not os.path.exists(PROCESSED_CSV_PATH) or not os.path.exists(PREPROCESSOR_PATH):
        print("\nRunning preprocessing first...")
        df, preprocessor, feature_cols = run_preprocessing()
    else:
        print("\nLoading preprocessed data...")
        df = pd.read_csv(PROCESSED_CSV_PATH)
        saved = joblib.load(PREPROCESSOR_PATH)
        preprocessor = saved["preprocessor"]
        feature_cols = saved["feature_cols"]

    # Step 2: Prepare features and targets
    X = df[feature_cols]
    X_processed = preprocessor.transform(X)
    print(f"\nFeature matrix shape: {X_processed.shape}")

    # Step 3: Train/test split (stratified on LAD as the largest stenotic class)
    X_train, X_test, y_train_df, y_test_df = train_test_split(
        X_processed,
        df[VESSEL_TARGETS],
        test_size=0.2,
        random_state=42,
        stratify=df["LAD"],
    )
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    # Step 4: Train 3 XGBoost models with GridSearchCV
    models = {}
    evaluation = {}

    param_grid = {
        "max_depth": [3, 5, 7],
        "n_estimators": [100, 200, 300],
        "learning_rate": [0.05, 0.1, 0.2],
    }

    for target in VESSEL_TARGETS:
        print(f"\n{'='*40}")
        print(f"Training model for: {target}")
        print(f"{'='*40}")

        y_train = y_train_df[target].values
        y_test = y_test_df[target].values

        clf = xgb.XGBClassifier(
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        )

        grid = GridSearchCV(
            clf, param_grid,
            cv=5,
            scoring="roc_auc",
            n_jobs=-1,
            verbose=0,
        )
        grid.fit(X_train, y_train)

        best_model = grid.best_estimator_
        models[target] = best_model
        print(f"  Best params: {grid.best_params_}")
        print(f"  Best CV ROC-AUC: {grid.best_score_:.4f}")

        # Evaluate on test set
        y_pred = best_model.predict(X_test)
        y_pred_proba = best_model.predict_proba(X_test)[:, 1]

        metrics = {
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
            "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
            "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
            "roc_auc": round(roc_auc_score(y_test, y_pred_proba), 4),
            "best_params": grid.best_params_,
            "best_cv_score": round(grid.best_score_, 4),
        }
        evaluation[target] = metrics

        print(f"  Test Metrics:")
        print(f"    Accuracy:  {metrics['accuracy']}")
        print(f"    Precision: {metrics['precision']}")
        print(f"    Recall:    {metrics['recall']}")
        print(f"    F1-Score:  {metrics['f1_score']}")
        print(f"    ROC-AUC:   {metrics['roc_auc']}")
        print(f"\n  Classification Report:")
        print(classification_report(y_test, y_pred, target_names=["Normal", "Stenotic"]))

    # Step 5: Save models
    os.makedirs(MODELS_DIR, exist_ok=True)
    for target, model in models.items():
        path = os.path.join(MODELS_DIR, f"model_{target.lower()}.joblib")
        joblib.dump(model, path)
        print(f"Saved model: {path}")

    # Step 6: Save evaluation report
    # Add derived CAD evaluation
    # For each test sample, derive CAD from vessel probabilities
    p_lad = models["LAD"].predict_proba(X_test)[:, 1]
    p_lcx = models["LCX"].predict_proba(X_test)[:, 1]
    p_rca = models["RCA"].predict_proba(X_test)[:, 1]
    p_cad = 1 - (1 - p_lad) * (1 - p_lcx) * (1 - p_rca)
    y_cad_pred = (p_cad >= 0.5).astype(int)

    # Derive actual CAD from actual vessel labels
    y_cad_actual = ((y_test_df["LAD"].values == 1) |
                    (y_test_df["LCX"].values == 1) |
                    (y_test_df["RCA"].values == 1)).astype(int)

    cad_metrics = {
        "accuracy": round(accuracy_score(y_cad_actual, y_cad_pred), 4),
        "precision": round(precision_score(y_cad_actual, y_cad_pred, zero_division=0), 4),
        "recall": round(recall_score(y_cad_actual, y_cad_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_cad_actual, y_cad_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_cad_actual, p_cad), 4),
        "note": "Derived from vessel probabilities: P(CAD) = 1 - (1-P_LAD)(1-P_LCX)(1-P_RCA)",
    }
    evaluation["CAD_derived"] = cad_metrics

    print(f"\n{'='*40}")
    print("Derived CAD Performance:")
    print(f"{'='*40}")
    print(f"  Accuracy:  {cad_metrics['accuracy']}")
    print(f"  Precision: {cad_metrics['precision']}")
    print(f"  Recall:    {cad_metrics['recall']}")
    print(f"  F1-Score:  {cad_metrics['f1_score']}")
    print(f"  ROC-AUC:   {cad_metrics['roc_auc']}")

    with open(EVAL_REPORT_PATH, "w") as f:
        json.dump(evaluation, f, indent=2)
    print(f"\nSaved evaluation report: {EVAL_REPORT_PATH}")

    # Step 7: Create and save SHAP explainers (test with a sample)
    print("\nCreating SHAP explainers...")
    for target, model in models.items():
        explainer = shap.TreeExplainer(model)
        sv = explainer.shap_values(X_test[:1])
        print(f"  {target} SHAP values shape: {np.array(sv).shape}")

    print("\n" + "=" * 60)
    print("Training complete! All models and reports saved.")
    print("=" * 60)

    return models, evaluation


if __name__ == "__main__":
    train_models()
