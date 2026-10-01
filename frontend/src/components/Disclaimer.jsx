/**
 * Disclaimer — Clinical safety disclaimer banner using Lucide icons.
 */
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 px-5 py-4 rounded-xl">
      <p className="font-semibold text-amber-400 text-sm flex items-center gap-2">
        <ShieldAlert size={16} />
        Clinical Safety Disclaimer
      </p>
      <p className="text-amber-300/80 text-xs mt-1.5 leading-relaxed">
        This tool is designed for <strong>educational and decision-support purposes only</strong>.
        Predictions are based on statistical models trained on a limited dataset and should{' '}
        <strong>NOT</strong> be used as a substitute for formal diagnostic imaging, angiography,
        or clinical judgment by a qualified healthcare professional. Always consult a cardiologist
        for definitive diagnosis.
      </p>
    </div>
  );
}
