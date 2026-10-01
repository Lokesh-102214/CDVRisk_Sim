/**
 * PredictPage — Main prediction page with Patient Form, 3D Heart Viewer, and Dashboard.
 * This is the primary interactive page of the application.
 */
import { useState } from 'react';
import {
  Stethoscope,
  Heart,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/primitives';
import HeartViewer from '../components/HeartViewer';
import PatientForm from '../components/PatientForm';
import Dashboard from '../components/Dashboard';
import Disclaimer from '../components/Disclaimer';
import { usePrediction } from '../hooks/usePrediction';

export default function PredictPage() {
  const { result, loading, error, predict } = usePrediction();
  const [selectedVessel, setSelectedVessel] = useState(null);

  const handlePredict = async (formData) => {
    try {
      await predict(formData);
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── Left Column: Patient Form ─── */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                <Stethoscope size={16} className="text-teal-400" />
                Patient Clinical Data
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-220px)] overflow-y-auto">
              <PatientForm onSubmit={handlePredict} loading={loading} />
            </CardContent>
          </Card>
        </div>

        {/* ─── Center: 3D Heart Viewer ─── */}
        <div className="lg:col-span-5">
          <Card className="overflow-hidden sticky top-[72px]" style={{ height: 'calc(100vh - 100px)' }}>
            <CardHeader className="py-3">
              <CardTitle>
                <Heart size={16} className="text-rose-400" />
                3D Heart Visualization
                {selectedVessel && (
                  <span className="ml-auto text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded-full font-medium">
                    {selectedVessel} selected
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <div className="h-[calc(100%-52px)]">
              <HeartViewer
                predictions={result}
                selectedVessel={selectedVessel}
                onVesselClick={setSelectedVessel}
              />
            </div>
          </Card>
        </div>

        {/* ─── Right Column: Dashboard ─── */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <BarChart3 size={16} className="text-teal-400" />
                Risk Analysis Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dashboard
                result={result}
                selectedVessel={selectedVessel}
                onVesselClick={setSelectedVessel}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
