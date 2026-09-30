"""
Inference Module for CDVRisk_Sim.
Loads trained models and preprocessor, runs predictions, and computes SHAP explanations.
"""

import os
import json
import numpy as np
import pandas as pd
import shap
import joblib

from app.ml.preprocessor import (
    transform_patient_dict, CONTINUOUS_COLS, YN_COLS,
    BINARY_01_COLS, TARGET_COLS,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "trained_models")
EVAL_REPORT_PATH = os.path.join(MODELS_DIR, "evaluation_report.json")

VESSEL_TARGETS = ["LAD", "LCX", "RCA"]


class CardiacPredictor:
    """Loads trained models and provides prediction + SHAP explanation."""

    def __init__(self):
        print("Initializing CardiacPredictor...")

        # Load preprocessor
        saved = joblib.load(os.path.join(MODELS_DIR, "preprocessor.joblib"))
        self.preprocessor = saved["preprocessor"]
        self.feature_cols = saved["feature_cols"]
        print(f"  Loaded preprocessor with {len(self.feature_cols)} features")

        # Load models
        self.models = {}
        for target in VESSEL_TARGETS:
            path = os.path.join(MODELS_DIR, f"model_{target.lower()}.joblib")
            self.models[target] = joblib.load(path)
            print(f"  Loaded model: {target}")

        # Create SHAP explainers
        self.explainers = {}
        for target, model in self.models.items():
            self.explainers[target] = shap.TreeExplainer(model)
        print("  Created SHAP explainers")

        # Load evaluation report
        self.eval_report = {}
        if os.path.exists(EVAL_REPORT_PATH):
            with open(EVAL_REPORT_PATH, "r") as f:
                self.eval_report = json.load(f)
            print("  Loaded evaluation report")

        # Build feature name mapping for SHAP output
        self._build_feature_names()
        print("CardiacPredictor ready!\n")

    def _build_feature_names(self):
        """Build human-readable feature names for SHAP output."""
        # The ColumnTransformer produces features in order:
        # first the continuous (scaled), then the binary (passthrough)
        continuous_in_features = [c for c in CONTINUOUS_COLS if c in self.feature_cols]
        binary_in_features = [c for c in self.feature_cols if c not in continuous_in_features]
        self.output_feature_names = continuous_in_features + binary_in_features

    def predict(self, patient_dict: dict) -> dict:
        """
        Run prediction and SHAP explanation for a single patient.

        Args:
            patient_dict: Raw patient data with original column names and values.

        Returns:
            dict with predictions, SHAP values, and metadata.
        """
        # 1. Preprocess
        X = transform_patient_dict(patient_dict, self.feature_cols, self.preprocessor)

        # 2. Predict probabilities for each vessel
        vessel_results = []
        probabilities = {}
        for target in VESSEL_TARGETS:
            prob = float(self.models[target].predict_proba(X)[0][1])
            probabilities[target] = prob
            vessel_results.append({
                "vessel": target,
                "probability": round(prob, 4),
                "status": "Stenotic" if prob >= 0.5 else "Normal",
            })

        # 3. Derive overall CAD probability
        p_lad = probabilities["LAD"]
        p_lcx = probabilities["LCX"]
        p_rca = probabilities["RCA"]
        cad_prob = 1 - (1 - p_lad) * (1 - p_lcx) * (1 - p_rca)

        # 4. Compute SHAP values for each vessel model
        shap_results = {}
        for target in VESSEL_TARGETS:
            sv = self.explainers[target].shap_values(X)
            shap_array = np.array(sv).flatten()

            # Pair with feature names and patient values
            features_with_shap = []
            for i, fname in enumerate(self.output_feature_names):
                if i < len(shap_array):
                    features_with_shap.append({
                        "feature": fname,
                        "value": round(float(X[0][i]) if i < X.shape[1] else 0, 4),
                        "shap_value": round(float(shap_array[i]), 4),
                    })

            # Sort by absolute SHAP value, take top 15
            features_with_shap.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
            shap_results[target] = features_with_shap[:15]

        return {
            "cad_probability": round(cad_prob, 4),
            "cad_status": "CAD" if cad_prob >= 0.5 else "Normal",
            "vessels": vessel_results,
            "shap_lad": shap_results["LAD"],
            "shap_lcx": shap_results["LCX"],
            "shap_rca": shap_results["RCA"],
            "model_metrics": self.eval_report,
        }

    def get_metrics(self) -> dict:
        """Return the evaluation metrics."""
        return self.eval_report
