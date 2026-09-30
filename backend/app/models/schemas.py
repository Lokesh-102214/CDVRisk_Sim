"""
Pydantic schemas for CDVRisk_Sim API request/response models.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class PatientInput(BaseModel):
    """Input schema for patient clinical data. All 55 features."""

    # Demographics
    age: int = Field(default=55, ge=0, le=120, description="Patient age in years")
    weight: float = Field(default=75, ge=20, le=300, description="Weight in kg")
    length: float = Field(default=170, ge=100, le=220, description="Height in cm")
    sex: str = Field(default="Male", description="Sex: Male or Fmale")
    bmi: Optional[float] = Field(default=None, description="BMI (auto-calculated if not provided)")

    # Comorbidities (0/1)
    dm: int = Field(default=0, ge=0, le=1, description="Diabetes Mellitus")
    htn: int = Field(default=0, ge=0, le=1, description="Hypertension")
    current_smoker: int = Field(default=0, ge=0, le=1, description="Current Smoker")
    ex_smoker: int = Field(default=0, ge=0, le=1, description="Ex-Smoker")
    fh: int = Field(default=0, ge=0, le=1, description="Family History of CAD")

    # Comorbidities (Y/N)
    obesity: str = Field(default="N", description="Obesity: Y or N")
    crf: str = Field(default="N", description="Chronic Renal Failure: Y or N")
    cva: str = Field(default="N", description="Cerebrovascular Accident: Y or N")
    airway_disease: str = Field(default="N", description="Airway Disease: Y or N")
    thyroid_disease: str = Field(default="N", description="Thyroid Disease: Y or N")
    chf: str = Field(default="N", description="Congestive Heart Failure: Y or N")
    dlp: str = Field(default="N", description="Dyslipidemia: Y or N")

    # Clinical Examination
    bp: int = Field(default=120, ge=50, le=300, description="Blood Pressure (mmHg)")
    pr: int = Field(default=75, ge=30, le=250, description="Pulse Rate (bpm)")
    edema: int = Field(default=0, ge=0, le=1, description="Edema")
    weak_peripheral_pulse: str = Field(default="N", description="Weak Peripheral Pulse: Y or N")
    lung_rales: str = Field(default="N", description="Lung Rales: Y or N")
    systolic_murmur: str = Field(default="N", description="Systolic Murmur: Y or N")
    diastolic_murmur: str = Field(default="N", description="Diastolic Murmur: Y or N")

    # Symptoms
    typical_chest_pain: int = Field(default=0, ge=0, le=1, description="Typical Chest Pain")
    dyspnea: str = Field(default="N", description="Dyspnea: Y or N")
    function_class: int = Field(default=0, ge=0, le=4, description="Function Class (0-4)")
    atypical: str = Field(default="N", description="Atypical Chest Pain: Y or N")
    nonanginal: str = Field(default="N", description="Nonanginal Chest Pain: Y or N")
    exertional_cp: str = Field(default="N", description="Exertional Chest Pain: Y or N")
    lowth_ang: str = Field(default="N", description="Low Threshold Angina: Y or N")

    # ECG Findings
    q_wave: int = Field(default=0, ge=0, le=1, description="Q Wave")
    st_elevation: int = Field(default=0, ge=0, le=1, description="ST Elevation")
    st_depression: int = Field(default=0, ge=0, le=1, description="ST Depression")
    tinversion: int = Field(default=0, ge=0, le=1, description="T Inversion")
    lvh: str = Field(default="N", description="Left Ventricular Hypertrophy: Y or N")
    poor_r_progression: str = Field(default="N", description="Poor R Wave Progression: Y or N")
    bbb: str = Field(default="N", description="Bundle Branch Block: Y or N")

    # Lab Results
    fbs: int = Field(default=90, ge=30, le=600, description="Fasting Blood Sugar (mg/dL)")
    cr: float = Field(default=1.0, ge=0.1, le=20, description="Creatinine (mg/dL)")
    tg: int = Field(default=150, ge=20, le=1000, description="Triglycerides (mg/dL)")
    ldl: int = Field(default=100, ge=10, le=500, description="LDL Cholesterol (mg/dL)")
    hdl: int = Field(default=45, ge=5, le=150, description="HDL Cholesterol (mg/dL)")
    bun: int = Field(default=15, ge=1, le=150, description="Blood Urea Nitrogen (mg/dL)")
    esr: int = Field(default=10, ge=0, le=150, description="Erythrocyte Sedimentation Rate")
    hb: float = Field(default=14.0, ge=3, le=25, description="Hemoglobin (g/dL)")
    k: float = Field(default=4.5, ge=2, le=8, description="Potassium (mEq/L)")
    na: int = Field(default=140, ge=110, le=170, description="Sodium (mEq/L)")
    wbc: int = Field(default=7000, ge=1000, le=50000, description="White Blood Cell Count")
    lymph: int = Field(default=35, ge=0, le=100, description="Lymphocyte %")
    neut: int = Field(default=55, ge=0, le=100, description="Neutrophil %")
    plt: int = Field(default=250, ge=20, le=1000, description="Platelet Count (×10³)")

    # Echocardiography
    ef_tte: int = Field(default=55, ge=5, le=80, description="Ejection Fraction (TTE) %")
    region_rwma: int = Field(default=0, ge=0, le=4, description="Region with RWMA (0-4)")
    vhd: str = Field(default="N", description="Valvular Heart Disease: N/mild/Moderate/Severe")

    def to_model_dict(self) -> dict:
        """Convert to dict with original column names for the ML pipeline."""
        return {
            "Age": self.age,
            "Weight": self.weight,
            "Length": self.length,
            "Sex": self.sex,
            "BMI": self.bmi,
            "DM": self.dm,
            "HTN": self.htn,
            "Current Smoker": self.current_smoker,
            "EX-Smoker": self.ex_smoker,
            "FH": self.fh,
            "Obesity": self.obesity,
            "CRF": self.crf,
            "CVA": self.cva,
            "Airway disease": self.airway_disease,
            "Thyroid Disease": self.thyroid_disease,
            "CHF": self.chf,
            "DLP": self.dlp,
            "BP": self.bp,
            "PR": self.pr,
            "Edema": self.edema,
            "Weak Peripheral Pulse": self.weak_peripheral_pulse,
            "Lung rales": self.lung_rales,
            "Systolic Murmur": self.systolic_murmur,
            "Diastolic Murmur": self.diastolic_murmur,
            "Typical Chest Pain": self.typical_chest_pain,
            "Dyspnea": self.dyspnea,
            "Function Class": self.function_class,
            "Atypical": self.atypical,
            "Nonanginal": self.nonanginal,
            "Exertional CP": self.exertional_cp,
            "LowTH Ang": self.lowth_ang,
            "Q Wave": self.q_wave,
            "St Elevation": self.st_elevation,
            "St Depression": self.st_depression,
            "Tinversion": self.tinversion,
            "LVH": self.lvh,
            "Poor R Progression": self.poor_r_progression,
            "BBB": self.bbb,
            "FBS": self.fbs,
            "CR": self.cr,
            "TG": self.tg,
            "LDL": self.ldl,
            "HDL": self.hdl,
            "BUN": self.bun,
            "ESR": self.esr,
            "HB": self.hb,
            "K": self.k,
            "Na": self.na,
            "WBC": self.wbc,
            "Lymph": self.lymph,
            "Neut": self.neut,
            "PLT": self.plt,
            "EF-TTE": self.ef_tte,
            "Region RWMA": self.region_rwma,
            "VHD": self.vhd,
        }


class VesselPrediction(BaseModel):
    """Prediction result for a single vessel."""
    vessel: str
    probability: float
    status: str


class ShapFeature(BaseModel):
    """SHAP feature contribution."""
    feature: str
    value: float
    shap_value: float


class PredictionResponse(BaseModel):
    """Full prediction response with all vessels, SHAP, and metrics."""
    cad_probability: float
    cad_status: str
    vessels: List[VesselPrediction]
    shap_lad: List[ShapFeature]
    shap_lcx: List[ShapFeature]
    shap_rca: List[ShapFeature]
    model_metrics: Dict[str, Any] = {}
