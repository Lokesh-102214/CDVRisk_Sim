/**
 * App.jsx — Main application layout for CDVRisk_Sim.
 */
import { useState } from 'react';
import { Heart, Activity } from 'lucide-react';
import HeartViewer from './components/HeartViewer';
import PatientForm from './components/PatientForm';
import Dashboard from './components/Dashboard';
import Disclaimer from './components/Disclaimer';
import { usePrediction } from './hooks/usePrediction';

export default function App() {
  const { result, loading, error, predict } = usePrediction();
  const [selectedVessel, setSelectedVessel] = useState(null);

  const handlePredict = async (formData) => {
    try {
      await predict(formData);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <Heart className="text-teal-400" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                CDVRisk<span className="text-teal-400">Sim</span>
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Cardiovascular Risk Visualization & Prediction
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity size={14} className="text-teal-500" />
            <span>3D Interactive • ML-Powered • SHAP Explained</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            ⚠ Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: 3D Viewer + Patient Form */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
              <h2 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                📋 Patient Clinical Data
              </h2>
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                <PatientForm onSubmit={handlePredict} loading={loading} />
              </div>
            </div>
          </div>

          {/* Center: 3D Heart Viewer */}
          <div className="lg:col-span-4">
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden sticky top-20" style={{ height: 'calc(100vh - 160px)' }}>
              <div className="p-3 border-b border-slate-700/50">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  🫀 3D Heart Visualization
                  {selectedVessel && (
                    <span className="ml-auto text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded">
                      {selectedVessel} selected
                    </span>
                  )}
                </h2>
              </div>
              <HeartViewer
                predictions={result}
                selectedVessel={selectedVessel}
                onVesselClick={setSelectedVessel}
              />
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="lg:col-span-4">
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-3">
              <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                📊 Risk Analysis Dashboard
              </h2>
              <Dashboard
                result={result}
                selectedVessel={selectedVessel}
                onVesselClick={setSelectedVessel}
              />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
