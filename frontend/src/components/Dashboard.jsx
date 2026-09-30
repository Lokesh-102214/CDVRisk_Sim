/**
 * Dashboard — Results panel showing CAD risk, vessel cards, and SHAP chart.
 */
import RiskGauge from './RiskGauge';
import VesselCard from './VesselCard';
import ShapChart from './ShapChart';

export default function Dashboard({ result, selectedVessel, onVesselClick }) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">🫀</div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Prediction Yet</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Enter patient clinical data in the form below and click
          <span className="text-teal-400 font-medium"> Predict </span>
          to see cardiovascular risk analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
      {/* Overall CAD Risk */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-2">
        <h3 className="text-sm font-semibold text-white text-center mb-1">
          Overall CAD Risk Assessment
        </h3>
        <RiskGauge probability={result.cad_probability} status={result.cad_status} />
        <p className="text-xs text-slate-500 text-center px-4">
          Derived from vessel probabilities: P(CAD) = 1 − (1−P<sub>LAD</sub>)(1−P<sub>LCX</sub>)(1−P<sub>RCA</sub>)
        </p>
      </div>

      {/* Vessel Cards */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Vessel-Specific Stenosis</h3>
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
