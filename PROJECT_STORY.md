# CDVRisk_Sim: Project Story & Hackathon Submission

## 🚀 Elevator Pitch

> **"CDVRisk_Sim transforms complex patient clinical data into an interactive 3D anatomical heart twin, mapping multi-vessel stenosis risk and explainable AI insights directly onto coronary arteries in real time."**

---

## 📖 Project Story: About the Project

### 💡 Inspiration
Cardiovascular disease remains the leading cause of mortality worldwide. In clinical practice, cardiologists routinely synthesize dozens of complex diagnostic signals—such as resting ECG abnormalities, serum lipid biomarkers, and echocardiographic wall motion anomalies. 

However, we noticed a critical communication gap: **raw numbers and statistical probabilities fail to give clinicians or patients an intuitive understanding of where and how disease is developing inside the human body.** A patient told they have a "70% cardiovascular risk" leaves the clinic anxious, not knowing which vessel is in jeopardy or whether the front, lateral, or posterior myocardium is at risk. 

We were inspired to build **CDVRisk_Sim** to turn abstract clinical spreadsheets into an interactive, spatial digital twin—enabling non-invasive pre-catheterization triage, transparent AI explainability, and empathetic doctor-patient communication.

---

### 🛠️ How We Built It

CDVRisk_Sim is architected as an end-to-end full-stack medical simulation platform:

#### 1. Data Engineering & Machine Learning
We trained our predictive pipeline on the clinically validated **Z-Alizadeh Sani Cardiology Dataset** (303 patients, 55 features across demographics, symptoms, ECG findings, laboratory profiles, and echocardiography).
- **Target Leakage Prevention:** All diagnostic outcome columns (`LAD`, `LCX`, `RCA`, and `Cath`) were strictly isolated from the input space.
- **Multi-Vessel Decomposition:** Rather than predicting an ambiguous single binary outcome, we trained three independent **XGBoost gradient-boosted tree classifiers** ($\mathcal{M}_{\text{LAD}}$, $\mathcal{M}_{\text{LCX}}$, $\mathcal{M}_{\text{RCA}}$) optimized through 5-fold stratified cross-validation.
- **Probabilistic CAD Formulation:** Overall CAD risk is mathematically derived through the complement of healthy vessels:
  $$P(\text{CAD}) = 1 - \prod_{v \in \{\text{LAD}, \text{LCX}, \text{RCA}\}} (1 - P(v)) = 1 - (1 - P_{\text{LAD}})(1 - P_{\text{LCX}})(1 - P_{\text{RCA}})$$
  This formulation achieved **85.25% Accuracy** and an **ROC-AUC of 0.9519** on the held-out test cohort, alongside an **86.11% Recall** on the critical Left Anterior Descending (LAD) artery.
- **Explainable AI (TreeSHAP):** We integrated `shap.TreeExplainer` directly into the inference loop to compute exact local attribution values $\phi_i(x)$ for all 55 features:
  $$f(x) = \phi_0 + \sum_{i=1}^{55} \phi_i(x)$$
  This allows clinicians to see whether low Ejection Fraction (EF-TTE), ST-segment depression, or systolic hypertension was the primary driver for a specific arterial risk score.

#### 2. 3D WebGL Pipeline & Custom GLSL Shaders
The frontend is built with **React 19**, **React Three Fiber (R3F)**, and **Three.js**:
- **Geometry Optimization:** We started with a detailed human anatomical heart mesh originally weighing **115.8 MB**. Using Google Draco geometry compression via `gltf-pipeline`, we reduced the asset footprint by **94.2% down to 6.73 MB**, enabling 60 FPS rendering in standard web browsers without requiring high-end discrete GPUs.
- **Custom GLSL Shader Distance Fields:** Rather than overlaying rigid, unrealistic 3D tubes onto the heart, we injected custom GLSL fragment code into Three.js's physical materials via `onBeforeCompile`. The shader computes Euclidean distances from fragments to the true 3D coronary trajectories:
  $$\mathbf{v} = \mathbf{b} - \mathbf{a}, \quad t = \operatorname{clamp}\left(\frac{(\mathbf{p} - \mathbf{a}) \cdot \mathbf{v}}{\mathbf{v} \cdot \mathbf{v}}, 0, 1\right), \quad d(\mathbf{p}) = \|\mathbf{p} - (\mathbf{a} + t\mathbf{v})\|$$
  As the predicted stenosis probability $P(v)$ rises, the surface smoothly blends into a localized, dark ischemic discoloration along the anatomical vessel course.
- **Spatial UI & Outlines:** Anchored `@react-three/drei` `<Html>` callout tags track the LAD, LCX, and RCA in 3D coordinate space, while dynamic `<Outlines>` boundaries highlight target vessels upon interaction.

#### 3. Cloud Deployment
- **Backend:** Packaged with an ultra-lightweight Dockerfile on **Render**, serving endpoints (`/api/predict`, `/api/sample-patients`, `/api/model-metrics`) via FastAPI and Uvicorn.
- **Frontend:** Deployed to **Vercel** with client-side routing rewrites and automatic URL sanitization.

---

### ⚡ Challenges We Faced

1. **The 115 MB Mesh Bottleneck:**  
   The initial raw GLTF mesh crashed mobile browsers and violated GitHub's 100 MB file limit. We solved this by creating an automated Draco compression pipeline that quantized vertex buffers and normal vectors, achieving a ~94% reduction without losing fine anatomical sulci.
2. **Dynamic Tissue Heatmaps on a Single Baked Mesh:**  
   Standard 3D viewers cannot easily recolor specific parts of a single baked organ mesh. Developing the custom GLSL distance-field shader required transforming local vertex coordinates and calculating real-time segment falloffs directly inside Three.js's standard PBR material pipeline.
3. **Preventing WebGL Context Destruction on Route Navigation:**  
   In standard React routers, navigating between the Predict and About pages destroys the WebGL context, causing annoying canvas re-instantiation and wiping user-entered clinical data. We engineered a persistent display wrapper that keeps the 3D scene alive in memory while toggling route visibility.
4. **Preventing Data Leakage in Clinical Modeling:**  
   Coronary catheterization reports inherently correlate with individual vessel labels. We had to ensure a strict mathematical boundary: diagnostic catheterization outcomes were completely stripped from input matrices, forcing models to rely purely on non-invasive biomarkers.

---

### 🧠 What We Learned

- **Bridging Clinical Nuance with Computer Graphics:** We learned how distinct vascular territories correlate with clinical ECG leads and echocardiographic wall motion abnormalities, and how to represent this relationship visually rather than purely numerically.
- **Trust Through Explainability:** In healthcare, accuracy without interpretability is unusable. Embedding real-time TreeSHAP explanations transformed our product from a black-box toy into a defensible clinical decision-support tool.
- **Performance Optimization in Modern WebGL:** We gained deep expertise in shader compilation lifecycles, Draco decompression, and memory management in React Three Fiber.

---

### 🔮 What's Next for CDVRisk_Sim

- **Direct DICOM & CT Angiography Ingestion:** Enabling automatic patient-specific mesh deformation directly from 3D CT/MRI scans.
- **Simulated Interventional Planning:** Allowing cardiologists to simulate virtual coronary stenting or balloon angioplasty and visualize predicted post-procedural perfusion recovery.
- **Multi-Center Clinical Validation:** Expanding our training corpus beyond the Z-Alizadeh Sani registry to validate generalization across diverse global patient demographics.
