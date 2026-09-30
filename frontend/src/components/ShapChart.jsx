/**
 * ShapChart — Horizontal bar chart showing SHAP feature importances.
 */
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const TABS = ['LAD', 'LCX', 'RCA'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-600 p-2 rounded-lg text-xs">
      <p className="font-semibold text-white">{d.feature}</p>
      <p className="text-slate-300">Patient value: <span className="font-mono">{d.displayValue}</span></p>
      <p style={{ color: d.shap_value > 0 ? '#ef4444' : '#22c55e' }}>
        SHAP: {d.shap_value > 0 ? '+' : ''}{d.shap_value.toFixed(4)}
      </p>
      <p className="text-slate-400 mt-1">
        {d.shap_value > 0 ? '↑ Pushes toward disease' : '↓ Pushes toward healthy'}
      </p>
    </div>
  );
}

export default function ShapChart({ shapLad, shapLcx, shapRca }) {
  const [activeTab, setActiveTab] = useState('LAD');

  const shapData = { LAD: shapLad, LCX: shapLcx, RCA: shapRca };
  const data = (shapData[activeTab] || []).map((d) => ({
    ...d,
    displayValue: typeof d.value === 'number' ? d.value.toFixed(2) : d.value,
    absShap: Math.abs(d.shap_value),
  }));

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-white mb-3">
        🔍 SHAP Feature Importance
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                : 'bg-slate-700/50 text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-2">
        <span className="text-red-400">Red</span> = pushes toward stenosis •{' '}
        <span className="text-green-400">Green</span> = pushes toward normal
      </p>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(250, data.length * 28)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis
              dataKey="feature"
              type="category"
              width={130}
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155' }} />
            <ReferenceLine x={0} stroke="#475569" />
            <Bar dataKey="shap_value" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.shap_value > 0 ? '#ef4444' : '#22c55e'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-slate-500 text-sm text-center py-8">
          Run a prediction to see SHAP explanations
        </p>
      )}
    </div>
  );
}
