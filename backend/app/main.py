"""
FastAPI Main Application for CDVRisk_Sim.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add backend dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.predict import router as predict_router, set_predictor
from app.ml.inference import CardiacPredictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    print("Starting CDVRisk API...")
    try:
        predictor = CardiacPredictor()
        set_predictor(predictor)
        print("Models loaded successfully!")
    except Exception as e:
        print(f"WARNING: Could not load models: {e}")
        print("Run trainer.py first to train models.")
    yield
    print("Shutting down CDVRisk API...")


app = FastAPI(
    title="CDVRisk_Sim API",
    description="Cardiovascular Risk Prediction API with SHAP Explanations",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict_router, prefix="/api", tags=["Predictions"])


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "CDVRisk_Sim API"}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "CDVRisk_Sim API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "predict": "POST /api/predict",
            "sample_patients": "GET /api/sample-patients",
            "model_metrics": "GET /api/model-metrics",
        },
    }
