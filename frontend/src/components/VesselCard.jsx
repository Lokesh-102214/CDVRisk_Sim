/**
 * VesselCard — Displays risk for a single vessel (LAD, LCX, or RCA).
 * Uses centralized VESSELS config and probabilityToColor for consistency with 3D.
 */
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { probabilityToColor } from '../utils/colorScale';
import { VESSELS } from '../config/vessels';
import { Badge } from './ui/primitives';

export default function VesselCard({ vessel, probability, status, isSelected, onClick }) {
  const pct = Math.round((probability || 0) * 100);
  const color = probabilityToColor(probability || 0);
  const info = VESSELS[vessel] || {};
  const isStenotic = status === 'Stenotic';

  return (
    <div
      onClick={() => onClick?.(vessel)}
      className={`
        p-3.5 rounded-xl cursor-pointer transition-all duration-200
        border-2
        ${isSelected
          ? 'border-teal-400 bg-slate-700/80 shadow-lg shadow-teal-500/10 scale-[1.01]'
          : 'border-slate-700/50 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-700/60'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h4 className="font-bold text-white text-sm">{vessel}</h4>
          </div>
          <p className="text-xs text-slate-400 ml-[18px]">{info.fullName}</p>
        </div>
        <Badge variant={isStenotic ? 'danger' : 'success'}>
          {isStenotic ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {status}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-700/60 rounded-full h-2 mb-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Stenosis probability</span>
        <span className="font-semibold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5 ml-[18px]">Supplies: {info.supplies}</p>
    </div>
  );
}
