"""
Data Preprocessing Pipeline for CDVRisk_Sim.
Loads the Z-Alizadeh Sani dataset, cleans it, encodes features,
and builds a reusable sklearn preprocessing pipeline.
"""

import os
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, FunctionTransformer
from sklearn.impute import SimpleImputer
import joblib

# --- Constants ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASET_PATH = os.path.join(
    BASE_DIR, "..", "dataset",
    "extention+of+z+alizadeh+sani+dataset",
    "extention of Z-Alizadeh sani dataset.xlsx",
)
PROCESSED_CSV_PATH = os.path.join(BASE_DIR, "app", "data", "processed.csv")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "trained_models", "preprocessor.joblib")

# Target columns — MUST be excluded from features
TARGET_COLS = ["LAD", "LCX", "RCA", "Cath"]

# Columns that use Y/N encoding
YN_COLS = [
    "Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF",
    "DLP", "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur",
    "Diastolic Murmur", "Dyspnea", "Atypical", "Nonanginal",
    "Exertional CP", "LowTH Ang", "LVH", "Poor R Progression", "BBB",
]

# Columns already using 0/1 encoding
BINARY_01_COLS = [
    "DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Edema",
    "Typical Chest Pain", "Function Class", "Q Wave", "St Elevation",
    "St Depression", "Tinversion",
]

# Continuous numeric columns (will be scaled)
CONTINUOUS_COLS = [
    "Age", "Weight", "Length", "BMI", "BP", "PR", "FBS", "CR", "TG",
    "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC", "Lymph",
    "Neut", "PLT", "EF-TTE", "Region RWMA",
]

# Ordinal: VHD
VHD_MAP = {"N": 0, "mild": 1, "Moderate": 2, "Severe": 3}
SEX_MAP = {"Male": 1, "Fmale": 0}
YN_MAP = {"Y": 1, "N": 0}
TARGET_VESSEL_MAP = {"Stenotic": 1, "Normal": 0}
TARGET_CAD_MAP = {"CAD": 1, "Normal": 0}


def load_and_clean_data() -> pd.DataFrame:
    """Load the xlsx dataset and perform all cleaning/encoding."""
    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_excel(DATASET_PATH)
    print(f"  Raw shape: {df.shape}")

    # 1. Fix BMI — contains Excel formulas, recalculate
    df["BMI"] = df["Weight"] / ((df["Length"] / 100) ** 2)
    df["BMI"] = df["BMI"].round(2)
    print("  Fixed BMI column (recalculated from Weight/Length)")

    # 2. Encode Sex
    df["Sex"] = df["Sex"].map(SEX_MAP)
    print("  Encoded Sex (Male=1, Fmale=0)")

    # 3. Encode Y/N columns
    for col in YN_COLS:
        df[col] = df[col].map(YN_MAP)
    print(f"  Encoded {len(YN_COLS)} Y/N columns to 0/1")

    # 4. Encode VHD (ordinal)
    df["VHD"] = df["VHD"].map(VHD_MAP).fillna(0).astype(int)
    print("  Encoded VHD (ordinal: N=0, mild=1, Moderate=2, Severe=3)")

    # 5. Encode targets
    for col in ["LAD", "LCX", "RCA"]:
        df[col] = df[col].map(TARGET_VESSEL_MAP)
    df["Cath"] = df["Cath"].map(TARGET_CAD_MAP)
    print("  Encoded target columns")

    # 6. Ensure all numeric
    for col in BINARY_01_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    for col in CONTINUOUS_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # 7. Handle missing values
    n_missing = df.isnull().sum().sum()
    if n_missing > 0:
        print(f"  Filling {n_missing} missing values...")
        # Numeric: median, Categorical: mode
        for col in df.columns:
            if df[col].isnull().any():
                if df[col].dtype in [np.float64, np.int64, float, int]:
                    df[col].fillna(df[col].median(), inplace=True)
                else:
                    df[col].fillna(df[col].mode()[0], inplace=True)

    print(f"  Final shape: {df.shape}")
    print(f"  Columns: {list(df.columns)}")
    return df


def get_feature_columns(df: pd.DataFrame) -> list:
    """Return the list of feature columns (excluding targets)."""
    return [c for c in df.columns if c not in TARGET_COLS]


def build_preprocessor(df: pd.DataFrame) -> ColumnTransformer:
    """Build and fit a sklearn ColumnTransformer for the feature columns."""
    feature_cols = get_feature_columns(df)

    # Identify which feature columns are continuous vs binary
    continuous_in_features = [c for c in CONTINUOUS_COLS if c in feature_cols]
    binary_in_features = [c for c in feature_cols if c not in continuous_in_features]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]), continuous_in_features),
            ("bin", Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
            ]), binary_in_features),
        ],
        remainder="drop",
    )

    X = df[feature_cols]
    preprocessor.fit(X)
    print(f"  Preprocessor fitted on {len(feature_cols)} features")
    print(f"    Continuous ({len(continuous_in_features)}): {continuous_in_features}")
    print(f"    Binary ({len(binary_in_features)}): {binary_in_features}")

    return preprocessor, feature_cols


def transform_patient_dict(patient_dict: dict, feature_cols: list, preprocessor: ColumnTransformer) -> np.ndarray:
    """
    Transform a raw patient dictionary (with original values like 'Y'/'N', 'Male'/'Fmale')
    into a model-ready numpy array.
    """
    # Apply the same encoding as we did during training
    d = dict(patient_dict)

    # Encode Sex
    if isinstance(d.get("Sex"), str):
        d["Sex"] = SEX_MAP.get(d["Sex"], 0)

    # Encode Y/N columns
    for col in YN_COLS:
        if isinstance(d.get(col), str):
            d[col] = YN_MAP.get(d[col], 0)

    # Encode VHD
    if isinstance(d.get("VHD"), str):
        d["VHD"] = VHD_MAP.get(d["VHD"], 0)

    # Recalculate BMI if it looks like a formula or is missing
    if "BMI" not in d or d["BMI"] is None or isinstance(d.get("BMI"), str):
        weight = float(d.get("Weight", 70))
        length = float(d.get("Length", 170))
        d["BMI"] = round(weight / ((length / 100) ** 2), 2)

    # Build DataFrame with correct column order
    df = pd.DataFrame([d])

    # Ensure all feature columns exist
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0

    df = df[feature_cols]

    # Ensure numeric
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    return preprocessor.transform(df)


def run_preprocessing():
    """Main preprocessing pipeline: load, clean, save."""
    print("=" * 60)
    print("CDVRisk_Sim — Data Preprocessing Pipeline")
    print("=" * 60)

    # Load and clean
    df = load_and_clean_data()

    # Build preprocessor
    preprocessor, feature_cols = build_preprocessor(df)

    # Save processed CSV
    os.makedirs(os.path.dirname(PROCESSED_CSV_PATH), exist_ok=True)
    df.to_csv(PROCESSED_CSV_PATH, index=False)
    print(f"\n  Saved processed CSV to: {PROCESSED_CSV_PATH}")

    # Save preprocessor + feature column list
    os.makedirs(os.path.dirname(PREPROCESSOR_PATH), exist_ok=True)
    joblib.dump({
        "preprocessor": preprocessor,
        "feature_cols": feature_cols,
    }, PREPROCESSOR_PATH)
    print(f"  Saved preprocessor to: {PREPROCESSOR_PATH}")

    # Print summary
    print(f"\n  Target distribution:")
    for t in TARGET_COLS:
        print(f"    {t}: {dict(df[t].value_counts())}")

    print("\nPreprocessing complete!")
    return df, preprocessor, feature_cols


if __name__ == "__main__":
    run_preprocessing()
