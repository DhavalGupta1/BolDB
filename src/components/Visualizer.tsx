import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon } from 'lucide-react';
import type { QueryResult } from '../types/database';

interface VisualizerProps {
  result: QueryResult | null;
  suggestedType?: 'bar' | 'line' | 'pie' | 'none';
}

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#6366f1', '#818cf8', '#a5b4fc', '#7c3aed', '#ddd6fe'];

export const Visualizer: React.FC<VisualizerProps> = ({ result, suggestedType = 'bar' }) => {
  const [chart, setChart] = useState<'bar' | 'line' | 'pie'>(
    suggestedType === 'pie' ? 'pie' : suggestedType === 'line' ? 'line' : 'bar'
  );

  React.useEffect(() => {
    if (suggestedType && suggestedType !== 'none') setChart(suggestedType);
  }, [suggestedType]);

  const { data, labelKey, valueKey, ok } = useMemo(() => {
    if (!result || result.values.length === 0 || result.columns.length < 2)
      return { data: [], labelKey: '', valueKey: '', ok: false };

    let numIdx = -1, txtIdx = -1;
    for (let c = 0; c < result.columns.length; c++) {
      const v = result.values[0][c];
      if (typeof v === 'number' && numIdx === -1) numIdx = c;
      else if (typeof v === 'string' && txtIdx === -1) txtIdx = c;
    }
    if (txtIdx === -1) txtIdx = 0;
    if (numIdx === -1) {
      for (let c = 0; c < result.columns.length; c++) {
        if (c !== txtIdx && !isNaN(Number(result.values[0][c]))) { numIdx = c; break; }
      }
    }
    if (numIdx === -1) return { data: [], labelKey: '', valueKey: '', ok: false };

    const lk = result.columns[txtIdx], vk = result.columns[numIdx];
    const d = result.values.slice(0, 20).map((r) => ({
      [lk]: String(r[txtIdx] ?? ''), [vk]: Number(r[numIdx] ?? 0),
    }));
    return { data: d, labelKey: lk, valueKey: vk, ok: true };
  }, [result]);

  if (!ok) return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Not enough data</div>;

  const tip = {
    contentStyle: {
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '8px', color: 'var(--text)', fontSize: '0.75rem',
    },
  };

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '16px',
    }}>
      {/* Type selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <div className="pill-tabs" style={{ padding: '2px', gap: '1px' }}>
          {([['bar', <BarChart3 size={11} />], ['line', <LineIcon size={11} />], ['pie', <PieIcon size={11} />]] as const).map(([t, icon]) => (
            <button key={t} className={`pill-tab ${chart === t ? 'active' : ''}`} onClick={() => setChart(t as any)}
              style={{ padding: '4px 9px', fontSize: '0.7rem' }}>{icon}</button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: '320px' }}>
        <ResponsiveContainer>
          {chart === 'bar' ? (
            <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey={labelKey} stroke="#3f3f46" fontSize={10} angle={-20} textAnchor="end" interval={0} />
              <YAxis stroke="#3f3f46" fontSize={10} />
              <Tooltip {...tip} />
              <Bar dataKey={valueKey} fill="#8b5cf6" radius={[4,4,0,0]} fillOpacity={0.85} />
            </BarChart>
          ) : chart === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey={labelKey} stroke="#3f3f46" fontSize={10} angle={-20} textAnchor="end" interval={0} />
              <YAxis stroke="#3f3f46" fontSize={10} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey={valueKey} stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip {...tip} />
              <Pie data={data} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%" outerRadius={110} innerRadius={50} paddingAngle={2} stroke="none">
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
