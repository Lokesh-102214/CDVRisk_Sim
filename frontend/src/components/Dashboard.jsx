/**
 * Dashboard — Results panel showing CAD risk, vessel cards, and SHAP chart.
 */
import { HeartPulse, BarChart3, Crosshair } from 'lucide-react';
import RiskGauge from './RiskGauge';
import VesselCard from './VesselCard';
import ShapChart from './ShapChart';

export default function Dashboard({ result, selectedVessel, onVesselClick }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mb-4">
          <HeartPulse size={28} className="text-slate-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-300 mb-2">No Prediction Yet</h3>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Enter patient clinical data in the form and click
          <span className="text-teal-400 font-medium"> Predict </span>
          to see cardiovascular risk analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
      {/* Overall CAD Risk */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-3">
        <h3 className="text-sm font-semibold text-white text-center mb-1 flex items-center justify-center gap-2">
          <Crosshair size={14} className="text-teal-400" />
          Overall CAD Risk Assessment
        </h3>
        <RiskGauge probability={result.cad_probability} status={result.cad_status} />
        <p className="text-[11px] text-slate-500 text-center px-4">
          Derived from vessel probabilities: P(CAD) = 1 − (1−P<sub>LAD</sub>)(1−P<sub>LCX</sub>)(1−P<sub>RCA</sub>)
        </p>
      </div>

      {/* Vessel Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 size={14} className="text-teal-400" />
          Vessel-Specific Stenosis
        </h3>
        {result.vessels?.map((v) => (
          <VesselCard
            key={v.vessel}
            vessel={v.vessel}
            probability={v.probability}
            status={v.status}
            isSelected={selectedVessel === v.vessel}
            onClick={onVesselClick}
          />
        ))}
      </div>

      {/* SHAP Feature Importance */}
      <ShapChart
        shapLad={result.shap_lad}
        shapLcx={result.shap_lcx}
        shapRca={result.shap_rca}
      />
    </div>
  );
}
