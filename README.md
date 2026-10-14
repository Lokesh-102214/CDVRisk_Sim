# CDVRisk_Sim: Project Technical Documentation
### *Interactive 3D Cardiovascular Risk Visualization & Multi-Vessel Stenosis Simulation System*
**Track A: Cardiovascular Risk Visualization & Prediction — Multimodal AI Hackathon 2026**

---

<!-- ========================================================================================= -->
<!-- PAGE 1: PROJECT OVERVIEW & DATASET PREPROCESSING -->
<!-- ========================================================================================= -->

## Page 1: Project Overview & Dataset Engineering

### 1.1 Executive Summary & Problem Context
Cardiovascular disease (CAD) remains the leading cause of global mortality. While statistical machine learning models can estimate cardiac risk percentages, raw numerical probabilities fail to provide clinicians or patients with an intuitive spatial understanding of where and how arterial narrowing develops. 

**CDVRisk_Sim** is an integrated full-stack clinical decision-support and simulation platform. It maps 55 physiological and clinical patient markers into multi-vessel stenosis probabilities across the three primary coronary arteries—the **Left Anterior Descending (LAD)**, **Left Circumflex (LCX)**, and **Right Coronary Artery (RCA)**—and renders real-time, explainable ischemic heatmaps directly onto an interactive 3D anatomical heart in the web browser.

```
+--------------------------+       +------------------------+       +----------------------------+
| 55 Clinical Biomarkers   |  -->  | 3x XGBoost Classifiers |  -->  | Interactive 3D Heart Twin  |
| Demographics, ECG, Echo  |       | + TreeSHAP Explainer   |       | + Custom GLSL Heatmap      |
+--------------------------+       +------------------------+       +----------------------------+
```

---

### 1.2 Dataset Description: Z-Alizadeh Sani Cardiology Dataset
The predictive models were trained on the clinically validated **Z-Alizadeh Sani Dataset**, encompassing **303 patient records** and **55 physiological features** categorized into seven distinct clinical domains:

| Category | Count | Clinical Features Included |
| :--- | :---: | :--- |
| **Demographics** | 4 | Age, Sex, Weight, Length, Recalculated Body Mass Index (BMI) |
| **Comorbidities** | 12 | Diabetes Mellitus (DM), Hypertension (HTN), Current Smoker, Ex-Smoker, Family History (FH), Chronic Renal Failure (CRF), Cerebrovascular Accident (CVA), Airway Disease, Thyroid Disease, Congestive Heart Failure (CHF), Dyslipidemia (DLP), Obesity |
| **Clinical Exam** | 7 | Blood Pressure (BP), Pulse Rate (PR), Edema, Weak Peripheral Pulse, Lung Rales, Systolic Murmur, Diastolic Murmur |
| **Symptoms** | 7 | Typical Chest Pain, Dyspnea, Atypical Chest Pain, Nonanginal Chest Pain, Exertional CP, Low Threshold Angina, Functional Class |
| **ECG Findings** | 7 | Q Wave, ST-Segment Elevation, ST-Segment Depression, T-Wave Inversion, Left Ventricular Hypertrophy (LVH), Poor R-Wave Progression, Bundle Branch Block (BBB) |
| **Laboratory Biomarkers**| 14 | Fasting Blood Sugar (FBS), Serum Creatinine (CR), Triglycerides (TG), LDL, HDL, Blood Urea Nitrogen (BUN), Erythrocyte Sedimentation Rate (ESR), Hemoglobin (HB), Potassium ($K^+$), Sodium ($Na^+$), White Blood Cell Count (WBC), Lymphocyte %, Neutrophil %, Platelet Count (PLT) |
| **Echocardiography** | 3 | Ejection Fraction (EF-TTE), Regional Wall Motion Abnormality (Region RWMA), Valvular Heart Disease (VHD) |

---

### 1.3 Preprocessing & Data Cleaning Pipeline
Raw clinical records require stringent sanitization and deterministic normalization before entering the modeling pipeline:

1. **BMI Reconstruction:** Raw records contained legacy spreadsheet formula strings; BMI was programmatically recalculated via $\text{BMI} = \frac{\text{Weight (kg)}}{(\text{Length (cm)} / 100)^2}$ and rounded to two decimal places.
2. **Binary & Categorical Standardization:**
   - 19 binary Yes/No features were mapped to discrete integers: $\{Y: 1, N: 0\}$.
   - Biological Sex was encoded as $\{\text{Male}: 1, \text{Female}: 0\}$.
   - Valvular Heart Disease (VHD) was encoded ordinally: $\{N: 0, \text{mild}: 1, \text{Moderate}: 2, \text{Severe}: 3\}$.
3. **Continuous Feature Standardization:** Continuous physiological indicators (blood pressure, lipid profiles, hematology counts) were scaled using `StandardScaler` to zero mean and unit variance ($\mu = 0, \sigma = 1$).
4. **Missing Value Imputation:** Missing continuous entries were imputed via median values, while categorical columns were imputed using modal values to preserve sample distributions without introducing variance artifacts.
5. **Strict Prevention of Target Leakage:** To ensure clinical validity, all diagnostic outcome columns—`LAD`, `LCX`, `RCA`, and `Cath`—were rigorously excluded from the input feature matrix ($X$).

---
\pagebreak
<!-- ========================================================================================= -->
<!-- PAGE 2: MODEL ARCHITECTURE & MULTI-VESSEL FORMULATION -->
<!-- ========================================================================================= -->

## Page 2: Machine Learning Architecture & Multi-Vessel Formulation

### 2.1 Multi-Target Decomposition Strategy
In clinical cardiology, coronary stenosis is not a uniform binary state; patients frequently exhibit localized single-vessel or complex multi-vessel disease. Rather than compressing risk into an opaque global label, the system decomposes prediction into **three independent gradient-boosted decision tree classifiers (XGBoost)** trained respectively for the three anatomical territories:

- **Model 1 ($\mathcal{M}_{\text{LAD}}$):** Predicts $\ge 50\%$ stenosis in the Left Anterior Descending artery.
- **Model 2 ($\mathcal{M}_{\text{LCX}}$):** Predicts $\ge 50\%$ stenosis in the Left Circumflex artery.
- **Model 3 ($\mathcal{M}_{\text{RCA}}$):** Predicts $\ge 50\%$ stenosis in the Right Coronary Artery.

```
                  +-----------------------------------+
                  |  Cleaned Patient Vector (55 Dim)  |
                  +-----------------------------------+
                     /              |              \
                    /               |               \
                   v                v                v
          +----------------+ +----------------+ +----------------+
          |  XGBoost LAD   | |  XGBoost LCX   | |  XGBoost RCA   |
          |  (Depth: 7)    | |  (Depth: 3)    | |  (Depth: 7)    |
          +----------------+ +----------------+ +----------------+
                   |                |                |
                   v                v                v
                 P(LAD)           P(LCX)           P(RCA)
                    \               |               /
                     \              v              /
                   +----------------------------------+
                   | Composite CAD Joint Probability  |
                   | P(CAD) = 1 - (1-P_LAD)(1-P_LCX)...|
                   +----------------------------------+
```

---

### 2.2 Mathematical Formulation of Composite CAD Risk
A patient is clinically diagnosed with Coronary Artery Disease ($\text{CAD} = 1$) if at least one major vessel exhibits $\ge 50\%$ narrowing. Assuming conditional independence across arterial branches given the patient's underlying systemic biomarkers, the composite probability of CAD is derived as the complement of healthy vessels:

$$P(\text{CAD}) = 1 - \prod_{v \in \{\text{LAD}, \text{LCX}, \text{RCA}\}} (1 - P(v)) = 1 - (1 - P_{\text{LAD}})(1 - P_{\text{LCX}})(1 - P_{\text{RCA}})$$

This mathematical formulation avoids target leakage while maintaining full probabilistic consistency between individual vessel stenosis estimates and overall disease diagnosis.

---

### 2.3 Hyperparameter Tuning Methodology
Each vessel classifier was optimized using a 5-fold stratified cross-validation grid search (`GridSearchCV`) with Area Under the ROC Curve (`ROC-AUC`) as the objective metric:

- **Grid Search Space:**
  - `learning_rate` $\in [0.05, 0.1, 0.2]$
  - `max_depth` $\in [3, 5, 7]$
  - `n_estimators` $\in [100, 200, 300]$
  - `subsample` $= 0.8$, `colsample_bytree` $= 0.8$
- **Selected Hyperparameter Configurations:**
  - $\mathcal{M}_{\text{LAD}}$: `learning_rate: 0.1`, `max_depth: 7`, `n_estimators: 300` (Best CV Score: 0.8207)
  - $\mathcal{M}_{\text{LCX}}$: `learning_rate: 0.2`, `max_depth: 3`, `n_estimators: 100` (Best CV Score: 0.7953)
  - $\mathcal{M}_{\text{RCA}}$: `learning_rate: 0.1`, `max_depth: 7`, `n_estimators: 300` (Best CV Score: 0.7212)

---

### 2.4 Explainable AI (XAI) Engine: TreeSHAP Integration
To ensure clinical interpretability and eliminate "black box" risks, the inference engine embeds `shap.TreeExplainer`. For every patient record, exact local Shapley values $\phi_i$ are computed in real time:

$$f(x) = \phi_0 + \sum_{i=1}^{55} \phi_i(x)$$

Where $\phi_0$ represents the baseline expected risk, and $\phi_i(x)$ denotes the positive or negative contribution of physiological feature $i$. These values populate the real-time feature attribution dashboard, allowing physicians to instantly see whether low Ejection Fraction, ST depression, or dyslipidemia drove a specific stenosis score.

---
\pagebreak
<!-- ========================================================================================= -->
<!-- PAGE 3: 3D VISUALIZATION PIPELINE & CUSTOM GLSL SHADERS -->
<!-- ========================================================================================= -->

## Page 3: 3D Visualization Pipeline & Custom GLSL Shaders

### 3.1 3D Anatomical Heart Geometry & Draco Optimization
The anatomical visualization is based on a high-fidelity 3D human heart mesh (attributed to HannahNewey under CC-BY-NC-SA-4.0). 

**The Performance Bottleneck & Solution:**
- **Raw Asset:** The uncompressed `.gltf` and `.bin` mesh exceeded **115.8 MB**, causing massive network latency and exceeding repository push limits.
- **Draco Compression Pipeline:** Using Google Draco compression via `gltf-pipeline`, the mesh was compressed down to **6.73 MB** (a **94.2% reduction in payload**) while preserving fine coronary sulci, ventricular structures, and vertex normals.
- **Client Performance:** Enables rapid delivery over standard cellular and broadband connections with zero frame drops during initial rendering.

---

### 3.2 Dynamic Spatial Risk Mapping via Custom GLSL Shaders
Rather than overlaying crude, rigid 3D cylinder tubes over the heart, CDVRisk_Sim introduces an advanced **custom GLSL fragment shader injection** technique via Three.js's `onBeforeCompile` hook:

```
                            [ Three.js MeshStandardMaterial ]
                                          |
                              (onBeforeCompile Injection)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 1. Sample Fragment Local Position vLocalPos                                       |
| 2. Compute Euclidean Distance to Arterial Trajectory:                             |
|    d_vessel = min || vLocalPos - P_segment ||                                     |
| 3. Apply Smoothstep Falloff Curve:                                                |
|    intensity = smoothstep(radius, 0.0, d_vessel) * uProbs[vessel]                 |
| 4. Interpolate Diffuse Albedo:                                                    |
|    diffuseColor.rgb = mix(baseColor, necroticDarkShade, intensity)               |
+-----------------------------------------------------------------------------------+
```

#### Mathematical Distance-Field Formulation:
1. **Extracted Anatomical Trajectories:** Precise 3D coordinate arrays along the myocardial surface were mapped for `LAD`, `LCX`, and `RCA`.
2. **Segment Distance Function:** For each screen fragment, the minimum distance $d(\mathbf{p})$ from the local fragment position $\mathbf{p}$ to the nearest segment between trajectory nodes $\mathbf{a}$ and $\mathbf{b}$ is evaluated:
   $$\mathbf{v} = \mathbf{b} - \mathbf{a}, \quad t = \operatorname{clamp}\left(\frac{(\mathbf{p} - \mathbf{a}) \cdot \mathbf{v}}{\mathbf{v} \cdot \mathbf{v}}, 0, 1\right), \quad d(\mathbf{p}) = \|\mathbf{p} - (\mathbf{a} + t\mathbf{v})\|$$
3. **Continuous Color Modulation:** As predicted stenosis probability $P(v)$ increases, the surface texture smoothly transitions from healthy myocardium to a progressive dark ischemic discoloration, providing immediate visual confirmation of localized tissue risk.

---

### 3.3 Dynamic Boundary Highlighting & Coordinate Pins
- **Exact Anatomical Anchor Pins:** Drei `<Html>` overlay tags are anchored in 3D coordinate space to mark the arterial branches:
  - **RCA Pointer:** $[-0.1943, -0.0183, 0.3157]$
  - **LCX Pointer:** $[0.4546, -0.1299, 0.2200]$
  - **LAD Pointer:** $[0.3130, -0.0468, 0.6912]$
- **Mesh Highlighting (`Object_20` & `Object_21`):** When a callout or artery is selected, the application activates an animated `@react-three/drei` `<Outlines>` boundary around the target vessel mesh, dynamically shifting color between yellowish-green and risk-graded warning colors.
- **Camera Frustum Optimization:** Default camera position is calibrated to $[0, 0, 4.5]$ with an OrbitControls distance range of $[0.2, 10]$, preventing clipping artifacts while allowing close-up inspection.

---
\pagebreak
<!-- ========================================================================================= -->
<!-- PAGE 4: SYSTEM INTEGRATION & CLOUD DEPLOYMENT ARCHITECTURE -->
<!-- ========================================================================================= -->

## Page 4: System Integration & Cloud Deployment Architecture

### 4.1 End-to-End System Architecture
CDVRisk_Sim employs a modern decoupled microservice architecture, separating computational inference from real-time client rendering:

```
+------------------------------------------------------------------------------------+
|                                CLIENT BROWSER (SPA)                                |
|  React 19 + Vite  |  Tailwind CSS  |  Lucide Icons  |  @react-three/fiber (WebGL)  |
|                                                                                    |
|   +-------------------+    +----------------------+    +-----------------------+   |
|   | Patient Intake    |    | 3D Heart Viewport    |    | Explainability Panel  |   |
|   | 55 Features + Demo|    | 60 FPS GLSL Shaders  |    | SHAP Feature Charts   |   |
|   +-------------------+    +----------------------+    +-----------------------+   |
+------------------------------------------------------------------------------------+
                                      |         ^
                       HTTP POST /predict      JSON Response:
                       (Patient Features)      {vessels, cad, shap}
                                      v         |
+------------------------------------------------------------------------------------+
|                         BACKEND INFERENCE CLOUD (RENDER)                           |
|                         FastAPI REST Server (Port 8000)                            |
|                                                                                    |
|  +---------------------+   +---------------------+   +--------------------------+  |
|  | Input Sanitization  |-->| 3x XGBoost Pipeline |-->| TreeSHAP Explainer Engine|  |
|  | StandardScaler + OHE|   | LAD, LCX, RCA Infer |   | Local Attribution Vectors|  |
|  +---------------------+   +---------------------+   +--------------------------+  |
+------------------------------------------------------------------------------------+
```

---

### 4.2 WebGL Context Preservation
In standard Single Page Applications (SPAs), navigating between routes unmounts the view hierarchy. Re-instantiating Three.js WebGL contexts is computationally expensive, clears compiled shaders, and wipes user form state. 

CDVRisk_Sim implements a **persistent canvas architecture** in `App.jsx`:
```jsx
<Layout>
  {/* Preserves WebGL context and user input without unmounting */}
  <div style={{ display: location.pathname === '/' ? 'block' : 'none' }}>
    <PredictPage />
  </div>
  {location.pathname === '/about' && <AboutPage />}
</Layout>
```
This guarantees instant route toggling between `/` and `/about` with zero latency, zero re-compilation, and complete preservation of simulated patient results.

---

### 4.3 Containerization & Production Cloud Infrastructure
The platform is fully automated and deployed across modern cloud services:

1. **Backend (Render Web Service):**
   - Packaged with an ultra-slim Python 3.11 Dockerfile (`python:3.11-slim`), eliminating C++ compilation errors associated with cutting-edge Python builds.
   - Managed via Uvicorn ASGI server with automated health probes (`GET /health`).
   - CORS middleware configured to allow authenticated cross-origin requests.
2. **Frontend (Vercel CDN):**
   - Built via Vite into static assets distributed globally across edge CDNs.
   - Configured with `vercel.json` URL rewrite rules to maintain seamless HTML5 History API routing.
   - Built-in `VITE_API_URL` environment sanitization preventing double-slash routing bugs (`//api/predict`).

---
\pagebreak
<!-- ========================================================================================= -->
<!-- PAGE 5: EVALUATION RESULTS & CLINICAL ANALYSIS -->
<!-- ========================================================================================= -->

## Page 5: Evaluation Results & Clinical Analysis

### 5.1 Comprehensive Model Performance Metrics
The prediction system was evaluated on a held-out test split (20% test partition, $N=61$ patients) stratified by stenosis status. Performance was benchmarked across standard classification metrics:

| Vessel / Target | Accuracy | Precision | Recall (Sensitivity) | F1-Score | ROC-AUC | Best Hyperparameters |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **LAD (Anterior)** | **78.69%** | **79.49%** | **86.11%** | **0.8267** | **0.8056** | $\eta=0.1, \text{depth}=7, n=300$ |
| **LCX (Circumflex)**| **65.57%** | **55.56%** | **43.48%** | **0.4878** | **0.5904** | $\eta=0.2, \text{depth}=3, n=100$ |
| **RCA (Right)** | **62.30%** | **52.38%** | **45.83%** | **0.4889** | **0.6464** | $\eta=0.1, \text{depth}=7, n=300$ |
| **CAD (Derived)** | **85.25%** | **88.89%** | **90.91%** | **0.8989** | **0.9519** | Combined probabilistic model |

```
ROC-AUC Performance Benchmark
LAD:          [========================] 0.81
LCX:          [==================] 0.59
RCA:          [====================] 0.65
Derived CAD:  [==============================>] 0.95
```

---

### 5.2 Clinical Interpretation of Evaluation Findings
1. **High Diagnostic Sensitivity on Critical Vessels (LAD):**
   The Left Anterior Descending artery carries the highest clinical risk (often termed the "widow-maker" artery). The LAD model achieved an **86.11% Recall** and **0.8056 ROC-AUC**, ensuring that true stenotic blockages are rarely missed during clinical screening.
2. **Exceptional Composite CAD Discrimination:**
   When vessel probabilities are combined through our joint independence formulation, overall CAD classification achieves an **Accuracy of 85.25%** and an outstanding **ROC-AUC of 0.9519**, demonstrating that multi-vessel integration significantly outperforms single-vessel heuristics.
3. **Data Imbalance Observations:**
   Consistent with real-world clinical registries, stenosis prevalence was highest in the LAD, followed by the RCA and LCX. The lower recall on LCX reflects its smaller sample size in positive catheterization findings, which our multi-vessel formulation mitigates by pooling overall CAD risk.

---

### 5.3 Global Feature Importance (SHAP Analysis)
Global SHAP summary analysis reveals the primary physiological drivers that governed multi-vessel risk prediction:

```
Top Physiological Contributors (SHAP Value Impact):
1. Region RWMA (Echocardiography)     |=======> (+0.38)
2. EF-TTE (Ejection Fraction)          |<======  (-0.31)
3. ST-Segment Depression (ECG)         |=====>   (+0.26)
4. Typical Chest Pain                  |====>    (+0.22)
5. Age & Systolic Blood Pressure       |===>     (+0.19)
```

- **Echocardiographic Correlation:** Regional Wall Motion Abnormalities (`Region RWMA`) and lower Ejection Fraction (`EF-TTE`) exhibited the highest feature weights for LAD and RCA stenosis.
- **Electrophysiological Markers:** ST-segment depression and T-wave inversion served as strong positive indicators for multi-vessel ischemia.
- **Symptom Congruence:** Typical angina (Functional Class III/IV) strongly separated non-cardiac chest discomfort from true structural CAD.

---
\pagebreak
<!-- ========================================================================================= -->
<!-- PAGE 6: USER OPERATING MANUAL & CLINICAL GOVERNANCE -->
<!-- ========================================================================================= -->

## Page 6: User Operating Manual & Clinical Governance

### 6.1 Step-by-Step Clinical Usage Instructions

```
  [Step 1: Patient Data Intake]
  Enter 55 clinical features or select "Load Sample Patient" (Low / High Risk Presets).
             |
             v
  [Step 2: Simulation Execution]
  Click "Run Cardiac Risk Simulation" to trigger parallel inference and TreeSHAP.
             |
             v
  [Step 3: 3D Anatomical Inspection]
  Rotate, pan, and zoom the 3D heart. Inspect LAD, LCX, and RCA callout markers.
             |
             v
  [Step 4: Clinical Factor Attribution]
  Review the SHAP attribution plot to verify which biomarkers drove the prediction.
```

1. **Intake & Preset Loading:** Open the web application. Navigate to the left-hand form. Enter patient demographics, blood work, ECG, and echocardiography metrics, or select a preset sample patient to load historical case data instantly.
2. **Execution:** Click the **"Run Cardiac Risk Simulation"** button. The system validates inputs and sends an asynchronous payload to the inference backend.
3. **Interactive 3D Review:** Once predicted, inspect the central 3D viewport. The heart dynamically highlights coronary branches:
   - Click any callout pin (LAD, LCX, RCA) to isolate vessel risk.
   - Observe the dark ischemic discoloration reflecting stenosis probability.
   - Use left-click to orbit, right-click to pan, and scroll wheel to zoom.
4. **Explainability Audit:** Examine the right-hand dashboard to verify the overall CAD probability and review the SHAP waterfall chart explaining the specific clinical causes.

---

### 6.2 Healthcare Use Cases & Value Proposition
- **Pre-Catheterization Triage:** Assists cardiologists in prioritizing patients who genuinely require invasive diagnostic angiography versus those suitable for non-invasive medical management.
- **Doctor-Patient Shared Decision Making:** Visualizing a personalized 3D heart showing regional arterial ischemia significantly improves patient comprehension, informed consent, and treatment adherence.
- **Medical Education & Residency Training:** Allows cardiology students to simulate physiological perturbations (e.g., worsening EF or newly developed ST depression) and immediately observe anatomical impacts.

---

### 6.3 Clinical Safety Disclaimer & Ethical Guardrails
> [!IMPORTANT]
> **Clinical Safety & Regulatory Notice:**  
> CDVRisk_Sim is developed strictly for **educational, investigational, and clinical decision-support research purposes**. It is **NOT** an FDA-cleared or CE-marked medical device. Model outputs represent statistical associations and must **NEVER** replace formal diagnostic coronary angiography, coronary computed tomography angiography (CCTA), or the clinical judgment of a licensed cardiologist.

---

### 6.4 Open-Source Repository & Deliverables
- **Live Frontend Application:** [https://cdvrisk-sim.vercel.app](https://cdvrisk-sim.vercel.app)
- **Backend API Docs:** [https://cdvrisk-backend.onrender.com/docs](https://cdvrisk-backend.onrender.com/docs)
- **GitHub Repository:** [https://github.com/Lokesh-102214/CDVRisk_Sim](https://github.com/Lokesh-102214/CDVRisk_Sim)
- **Model Weights & Preprocessor:** Stored in `/backend/trained_models/`
- **3D Anatomical Assets:** Draco-compressed GLB asset stored in `/frontend/public/heart_model/model.glb`
