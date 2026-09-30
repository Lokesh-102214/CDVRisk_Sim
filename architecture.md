### 1. Frontend (UI & 3D Visualization)

  • Core Framework: React (or Next.js). It is
  the most robust choice for building complex,
  state-driven dashboards.
  • 3D Rendering Library: React Three Fiber
  (R3F) & @react-three/drei.
      • Why: The prompt explicitly suggests
      Three.js, WebGL, React Three Fiber, or
      VTK.js. R3F is the best choice if you are
      using React. It provides a declarative
      way to use Three.js, making it incredibly
      easy to load .gltf / .obj models, handle
      user interactions (clicks, rotations),
      and dynamically change the color of
      specific mesh nodes (LAD, LCX, RCA) based
      on state (stenosis probabilities).
  • Styling & Component Library: Tailwind CSS
  combined with shadcn/ui or Material-UI (MUI).
  These allow for rapid development of clean,
  professional, and accessible clinical
  dashboards.
  • 2D Data Visualization: Recharts or Chart.js
  to display physiological breakdowns and the
  SHAP/LIME feature importances on the
  dashboard side panel.
  ### 2. Backend (API & Model Inference)
  • Framework: FastAPI (Python).
      • Why: Python is necessary to run your ML
      models and SHAP/LIME explainers. FastAPI
      is asynchronous, incredibly fast, and
      automatically generates API documentation
      (Swagger UI). It is the industry standard
      for serving ML models.
  • Data Validation: Pydantic (integrated into
  FastAPI) to strictly define and validate the
  incoming JSON payload of clinical features
  from the frontend.
  • Server: Uvicorn to run the FastAPI
  application.
  ### 3. Machine Learning (Modeling &          
  Interpretability)

  • Data Processing: Pandas, NumPy, and Scikit-
  learn (for preprocessing, scaling, and
  evaluation metrics like ROC-AUC, F1-score).
  • Predictive Models: XGBoost or LightGBM.
      • Why: For tabular clinical data
      (demographics, ECG, lab results), tree-
      based gradient boosting models almost
      always outperform deep learning and are
      much easier to tune and interpret. You
      can train Multi-Output classifiers to
      predict overall CAD and the vessel-
      specific risks simultaneously, or train
      separate models.
  • Interpretability: SHAP (SHapley Additive
  exPlanations).
      • Why: Mentioned in the prompt. The
      Python shap library integrates perfectly
      with XGBoost/Scikit-learn. Your FastAPI
      backend can calculate SHAP values on-the-
      fly for a specific patient's prediction
      and send them to the frontend to be
      graphed, explaining exactly why a certain
      risk score was given.
  • Model Serialization: Joblib to save your
  trained models and load them quickly when the
  FastAPI server starts.

  ### 4. 3D Assets & Preparation

  • Format: glTF / .glb
      • Why: glTF is the "JPEG of 3D". It is
      highly compressed and optimized for web
      delivery, natively supported by React
      Three Fiber.
  • Preparation Tool: Blender (Open-source).
  You will likely need to download an open-
  source heart model and use Blender to
  separate the LAD, LCX, and RCA arteries into
  distinct, selectable objects/meshes so that
  your React code can target them individually
  to apply dynamic colors (e.g., turning a
  vessel red if stenosis > 50%).

  ### Summary Workflow:

  1. User inputs clinical data on the React
  frontend.
  2. Frontend sends a POST request with the
  data to the FastAPI backend.
  3. FastAPI passes data to the loaded XGBoost
  model to get predictions (Overall CAD, LAD,
  LCX, RCA probabilities).
  4. FastAPI passes the data and predictions to
  the SHAP explainer to get feature
  contributions.
  5. Backend returns predictions and SHAP
  values to the frontend.
  6. React Three Fiber dynamically updates the
  materials of the LAD, LCX, and RCA meshes on
  the 3D heart model (e.g., green to red
  gradient) based on probabilities.
  7. Recharts displays the SHAP values in a bar
  chart explaining the prediction.