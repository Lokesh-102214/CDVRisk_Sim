/**
 * VesselCard — Displays risk for a single vessel (LAD, LCX, or RCA).
 */
import { probabilityToColor } from '../utils/colorScale';

const VESSEL_DETAILS = {
  LAD: {
    full: 'Left Anterior Descending',
    supplies: 'Front of the heart',
    icon: '🫀',
  },
  LCX: {
    full: 'Left Circumflex',
    supplies: 'Side and back of the heart',
    icon: '🫀',
  },
  RCA: {
    full: 'Right Coronary Artery',
    supplies: 'Right side and bottom',
    icon: '🫀',
  },
};

export default function VesselCard({ vessel, probability, status, isSelected, onClick }) {
  const pct = Math.round((probability || 0) * 100);
  const color = probabilityToColor(probability || 0);
  const info = VESSEL_DETAILS[vessel] || {};

  return (
    <div
      onClick={() => onClick?.(vessel)}
      className={`
        p-3 rounded-lg cursor-pointer transition-all duration-300
        border-2
        ${isSelected
          ? 'border-teal-400 bg-slate-700/80 shadow-lg shadow-teal-500/20'
          : 'border-slate-600 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-700/60'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-bold text-white text-sm">{vessel}</h4>
          <p className="text-xs text-slate-400">{info.full}</p>
        </div>
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold"
          style={{
            backgroundColor: status === 'Stenotic' ? '#ef444420' : '#22c55e20',
            color: status === 'Stenotic' ? '#ef4444' : '#22c55e',
          }}
        >
          {status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-1">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Stenosis probability</span>
        <span className="font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">Supplies: {info.supplies}</p>
    </div>
  );
}
