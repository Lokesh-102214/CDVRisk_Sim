# CDVRisk_Sim

Cardiovascular Risk Visualization & Prediction System.
Built for the Multimodal AI Hackathon 2026.

## Overview
An interactive 3D visualization system that predicts coronary artery disease and overall cardiac risk from patient physiological and clinical data, mapping predictions onto an interactive 3D human anatomical model.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, React Three Fiber (3D), Recharts
- **Backend**: FastAPI (Python), Pydantic
- **Machine Learning**: XGBoost, Scikit-learn, SHAP (Explainability)

## Project Structure
- `/backend`: FastAPI server, ML training pipeline (`app/ml/trainer.py`), and pre-trained models.
- `/frontend`: React application with 3D Heart Viewer (`HeartViewer.jsx`) and Clinical Dashboard.
- `/dataset`: Original clinical dataset.
- `/heart_gltf`: Raw 3D anatomical model files.

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

*Note: The 3D model binary (`scene.bin`) is ignored in version control due to its size (>100MB). To run the project fully, ensure `scene.bin` is placed in `frontend/public/heart_model/`.*
