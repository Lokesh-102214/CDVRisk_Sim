/**
 * AboutPage — Information about the CDVRisk_Sim system,
 * model architecture, dataset, and clinical disclaimer.
 */
import {
  Heart,
  Brain,
  Database,
  Shield,
  GitBranch,
  BarChart3,
  Layers,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Separator } from '../components/ui/primitives';
import Disclaimer from '../components/Disclaimer';

const MODEL_METRICS = [
  { vessel: 'LAD', accuracy: '89%', roc: '0.93', f1: '0.88' },
  { vessel: 'LCX', accuracy: '91%', roc: '0.95', f1: '0.90' },
  { vessel: 'RCA', accuracy: '88%', roc: '0.92', f1: '0.87' },
];

const TECH_STACK = [
  { icon: Layers, name: 'React + Vite', desc: 'Fast SPA with Hot Module Replacement' },
  { icon: Heart, name: 'React Three Fiber', desc: 'Declarative 3D rendering via Three.js' },
  { icon: Brain, name: 'XGBoost + SHAP', desc: 'Gradient boosted trees with explainability' },
  { icon: Activity, name: 'FastAPI', desc: 'High-performance Python backend' },
  { icon: Database, name: 'Z-Alizadeh Sani', desc: '303 patients, 55 clinical features' },
  { icon: Shield, name: 'Scikit-learn', desc: 'Preprocessing, scaling, and evaluation' },
];

const FEATURES_CATEGORIES = [
  { name: 'Demographics', count: 4, examples: 'Age, Sex, BMI, Weight' },
  { name: 'Comorbidities', count: 12, examples: 'DM, HTN, Smoking, Obesity' },
  { name: 'Clinical Exam', count: 7, examples: 'BP, Pulse, Edema, Murmurs' },
  { name: 'Symptoms', count: 7, examples: 'Chest Pain, Dyspnea, Angina' },
  { name: 'ECG', count: 7, examples: 'Q Wave, ST Changes, LVH, BBB' },
  { name: 'Lab Results', count: 14, examples: 'FBS, Lipids, CBC, Electrolytes' },
  { name: 'Echocardiography', count: 3, examples: 'EF, RWMA, VHD' },
];

export default function AboutPage() {
  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="text-teal-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          CDVRisk<span className="text-teal-400">Sim</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
          An interactive 3D visualization system that predicts coronary artery disease
          and overall cardiac risk from patient physiological and clinical data,
          mapping predictions onto an interactive 3D human anatomical model.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button>
              <Heart size={16} />
              Start Predicting
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>
            <GitBranch size={16} className="text-teal-400" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Input', desc: 'Enter 55 clinical features including demographics, lab results, ECG findings, and echocardiography data.', icon: '📋' },
              { step: '2', title: 'Predict', desc: '3 XGBoost classifiers independently predict stenosis probability for LAD, LCX, and RCA vessels.', icon: '🧠' },
              { step: '3', title: 'Visualize', desc: 'Predictions map onto an interactive 3D heart model with color-coded coronary arteries (green → red).', icon: '🫀' },
              { step: '4', title: 'Explain', desc: 'SHAP values reveal which clinical features drove each prediction, enabling interpretable decision support.', icon: '🔍' },
            ].map((s) => (
              <div key={s.step} className="text-center p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="text-2xl mb-2">{s.icon}</div>
                <Badge variant="info" className="mb-2">Step {s.step}</Badge>
                <h4 className="text-white font-semibold text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>
            <BarChart3 size={16} className="text-teal-400" />
            Model Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Vessel</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Accuracy</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">ROC-AUC</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">F1 Score</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_METRICS.map((m) => (
                  <tr key={m.vessel} className="border-b border-slate-800/50">
                    <td className="py-3 px-3 font-semibold text-white">{m.vessel}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{m.accuracy}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="success">{m.roc}</Badge>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">{m.f1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Overall CAD is derived: P(CAD) = 1 − (1−P<sub>LAD</sub>)(1−P<sub>LCX</sub>)(1−P<sub>RCA</sub>).
            Target leakage is prevented by excluding LAD, LCX, RCA, and Cath columns from input features.
          </p>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Database size={16} className="text-teal-400" />
            Clinical Features (55 Total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES_CATEGORIES.map((cat) => (
              <div key={cat.name} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{cat.name}</span>
                  <Badge variant="default">{cat.count}</Badge>
                </div>
                <p className="text-xs text-slate-500">{cat.examples}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Layers size={16} className="text-teal-400" />
            Technology Stack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TECH_STACK.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-teal-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{name}</h4>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3D Model Credit */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Heart size={16} className="text-rose-400" />
            3D Model Attribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300 leading-relaxed">
            This work is based on{' '}
            <a
              href="https://sketchfab.com/3d-models/cardiac-anatomy-external-view-of-human-heart-a3f0ea2030214a6bbaa97e7357eebd58"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
            >
              "Cardiac Anatomy: External view of human heart"
              <ExternalLink size={12} />
            </a>{' '}
            by{' '}
            <a
              href="https://sketchfab.com/HannahNewey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300"
            >
              HannahNewey
            </a>{' '}
            licensed under{' '}
            <a
              href="http://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300"
            >
              CC-BY-NC-SA-4.0
            </a>.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
