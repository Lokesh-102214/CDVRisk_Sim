"""
API Router for predictions.
POST /predict — accepts patient data, returns predictions + SHAP.
GET /sample-patients — returns sample patient profiles for demo.
GET /model-metrics — returns evaluation metrics.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    PatientInput, PredictionResponse, VesselPrediction, ShapFeature,
)

router = APIRouter()

# Will be set by main.py on startup
predictor = None


def set_predictor(p):
    """Set the global predictor instance."""
    global predictor
    predictor = p


@router.post("/predict", response_model=PredictionResponse)
async def predict(patient: PatientInput):
    """Predict CAD and vessel stenosis from patient clinical data."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        # Convert Pydantic model to dict with original column names
        model_dict = patient.to_model_dict()
        result = predictor.predict(model_dict)

        return PredictionResponse(
            cad_probability=result["cad_probability"],
            cad_status=result["cad_status"],
            vessels=[VesselPrediction(**v) for v in result["vessels"]],
            shap_lad=[ShapFeature(**s) for s in result["shap_lad"]],
            shap_lcx=[ShapFeature(**s) for s in result["shap_lcx"]],
            shap_rca=[ShapFeature(**s) for s in result["shap_rca"]],
            model_metrics=result["model_metrics"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/sample-patients")
async def sample_patients():
    """Return sample patient profiles for demo purposes."""
    return [
        {
            "name": "High Risk — Male, 65, Smoker",
            "description": "Older male with multiple risk factors, ST depression, low EF",
            "data": {
                "age": 65, "weight": 95, "length": 172, "sex": "Male",
                "dm": 1, "htn": 1, "current_smoker": 1, "ex_smoker": 0,
                "fh": 1, "obesity": "Y", "crf": "N", "cva": "N",
                "airway_disease": "N", "thyroid_disease": "N", "chf": "N",
                "dlp": "Y", "bp": 155, "pr": 88, "edema": 1,
                "weak_peripheral_pulse": "N", "lung_rales": "N",
                "systolic_murmur": "N", "diastolic_murmur": "N",
                "typical_chest_pain": 1, "dyspnea": "Y", "function_class": 2,
                "atypical": "N", "nonanginal": "N", "exertional_cp": "Y",
                "lowth_ang": "N", "q_wave": 1, "st_elevation": 0,
                "st_depression": 1, "tinversion": 1, "lvh": "Y",
                "poor_r_progression": "N", "bbb": "N",
                "fbs": 180, "cr": 1.2, "tg": 280, "ldl": 175, "hdl": 28,
                "bun": 22, "esr": 35, "hb": 13.5, "k": 4.8, "na": 139,
                "wbc": 8500, "lymph": 30, "neut": 62, "plt": 220,
                "ef_tte": 35, "region_rwma": 3, "vhd": "N",
            },
        },
        {
            "name": "Low Risk — Female, 38, Healthy",
            "description": "Young female with no significant risk factors",
            "data": {
                "age": 38, "weight": 62, "length": 165, "sex": "Fmale",
                "dm": 0, "htn": 0, "current_smoker": 0, "ex_smoker": 0,
                "fh": 0, "obesity": "N", "crf": "N", "cva": "N",
                "airway_disease": "N", "thyroid_disease": "N", "chf": "N",
                "dlp": "N", "bp": 110, "pr": 72, "edema": 0,
                "weak_peripheral_pulse": "N", "lung_rales": "N",
                "systolic_murmur": "N", "diastolic_murmur": "N",
                "typical_chest_pain": 0, "dyspnea": "N", "function_class": 0,
                "atypical": "N", "nonanginal": "N", "exertional_cp": "N",
                "lowth_ang": "N", "q_wave": 0, "st_elevation": 0,
                "st_depression": 0, "tinversion": 0, "lvh": "N",
                "poor_r_progression": "N", "bbb": "N",
                "fbs": 85, "cr": 0.8, "tg": 110, "ldl": 95, "hdl": 55,
                "bun": 12, "esr": 8, "hb": 13.0, "k": 4.2, "na": 141,
                "wbc": 6200, "lymph": 38, "neut": 54, "plt": 280,
                "ef_tte": 60, "region_rwma": 0, "vhd": "N",
            },
        },
        {
            "name": "Mixed Risk — Male, 52, Moderate",
            "description": "Middle-aged male with moderate risk, some ECG changes",
            "data": {
                "age": 52, "weight": 80, "length": 175, "sex": "Male",
                "dm": 0, "htn": 1, "current_smoker": 0, "ex_smoker": 1,
                "fh": 0, "obesity": "N", "crf": "N", "cva": "N",
                "airway_disease": "N", "thyroid_disease": "N", "chf": "N",
                "dlp": "Y", "bp": 135, "pr": 78, "edema": 0,
                "weak_peripheral_pulse": "N", "lung_rales": "N",
                "systolic_murmur": "N", "diastolic_murmur": "N",
                "typical_chest_pain": 1, "dyspnea": "N", "function_class": 1,
                "atypical": "N", "nonanginal": "N", "exertional_cp": "N",
                "lowth_ang": "N", "q_wave": 0, "st_elevation": 0,
                "st_depression": 1, "tinversion": 0, "lvh": "N",
                "poor_r_progression": "N", "bbb": "N",
                "fbs": 100, "cr": 1.0, "tg": 200, "ldl": 130, "hdl": 38,
                "bun": 16, "esr": 15, "hb": 14.5, "k": 4.5, "na": 140,
                "wbc": 7100, "lymph": 35, "neut": 58, "plt": 245,
                "ef_tte": 45, "region_rwma": 1, "vhd": "mild",
            },
        },
    ]


@router.get("/model-metrics")
async def model_metrics():
    """Return evaluation metrics for all models."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    return predictor.get_metrics()
