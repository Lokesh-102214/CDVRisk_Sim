/**
 * RiskGauge — Circular SVG gauge showing overall CAD probability.
 */
import { probabilityToColor, getRiskLevel } from '../utils/colorScale';

export default function RiskGauge({ probability, status }) {
  const pct = Math.round((probability || 0) * 100);
  const risk = getRiskLevel(probability || 0);
  const color = probabilityToColor(probability || 0);

  // SVG circle math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability || 0) * circumference;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            stroke="#334155" strokeWidth="10" fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="80" cy="80" r={radius}
            stroke={color} strokeWidth="10" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{pct}%</span>
          <span className="text-xs text-slate-400 mt-1">CAD Risk</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: status === 'CAD' ? '#ef444420' : '#22c55e20',
            color: status === 'CAD' ? '#ef4444' : '#22c55e',
          }}
        >
          {status === 'CAD' ? '⚠ CAD Detected' : '✓ Normal'}
        </span>
        <p className="text-xs mt-1" style={{ color: risk.color }}>{risk.label}</p>
      </div>
    </div>
  );
}
