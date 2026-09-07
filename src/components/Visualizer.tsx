import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import type { QueryResult } from '../types/database';

interface VisualizerProps {
  result: QueryResult | null;
  suggestedType?: 'bar' | 'line' | 'pie' | 'none';
}

const NEON_COLORS = [
  '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b',
  '#6366f1', '#3b82f6', '#14b8a6', '#f43f5e', '#a855f7'
];

export const Visualizer: React.FC<VisualizerProps> = ({ result, suggestedType = 'bar' }) => {
  const [chart, setChart] = useState<'bar' | 'line' | 'area' | 'pie'>(
    suggestedType === 'pie' ? 'pie' : suggestedType === 'line' ? 'line' : 'bar'
  );

  React.useEffect(() => {
    if (suggestedType && suggestedType !== 'none') {
      setChart(suggestedType === 'pie' ? 'pie' : suggestedType === 'line' ? 'line' : 'bar');
    }
  }, [suggestedType]);

  const { data, labelKey, valueKey, stats, ok } = useMemo(() => {
    if (!result || result.values.length === 0 || result.columns.length < 2) {
      return { data: [], labelKey: '', valueKey: '', stats: null, ok: false };
    }

    let numIdx = -1;
    let txtIdx = -1;

    for (let c = 0; c < result.columns.length; c++) {
      const v = result.values[0][c];
      if (typeof v === 'number' && numIdx === -1) {
        numIdx = c;
      } else if (typeof v === 'string' && txtIdx === -1) {
        txtIdx = c;
      }
    }

    if (txtIdx === -1) txtIdx = 0;
    if (numIdx === -1) {
      for (let c = 0; c < result.columns.length; c++) {
        if (c !== txtIdx && !isNaN(Number(result.values[0][c]))) {
          numIdx = c;
          break;
        }
      }
    }

    if (numIdx === -1) {
      return { data: [], labelKey: '', valueKey: '', stats: null, ok: false };
    }

    const lk = result.columns[txtIdx];
    const vk = result.columns[numIdx];

    const d = result.values.slice(0, 25).map((r) => ({
      [lk]: String(r[txtIdx] ?? ''),
      [vk]: Number(r[numIdx] ?? 0),
    }));

    const rawVals = d.map((item) => Number(item[vk]) || 0);
    const sum = rawVals.reduce((acc, v) => acc + v, 0);
    const avg = rawVals.length > 0 ? sum / rawVals.length : 0;
    const max = Math.max(...rawVals, 0);

    return {
      data: d,
      labelKey: lk,
      valueKey: vk,
      stats: {
        count: d.length,
        sum: sum > 1000 ? sum.toLocaleString(undefined, { maximumFractionDigits: 1 }) : sum.toFixed(2),
        avg: avg.toFixed(2),
        max: max.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      },
      ok: true,
    };
  }, [result]);

  if (!ok) {
    return (
      <div style={{
        padding: '70px 20px',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)'
      }}>
        <BarChart3 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)' }}>
          No Numeric Chartable Data
        </p>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Query must return at least one text category column and one numeric metric column
        </p>
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(14, 16, 23, 0.95)',
          border: '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'blur(8px)',
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {labelKey}: <strong style={{ color: '#fff' }}>{label}</strong>
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--cyan-light)', fontWeight: 700 }}>
            {valueKey}: {Number(payload[0].value).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Metric Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Sample Records
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {stats.count}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Total Sum ({valueKey})
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-light)', marginTop: '4px' }}>
              {stats.sum}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Average Value
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cyan-light)', marginTop: '4px' }}>
              {stats.avg}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Peak Value
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-light)', marginTop: '4px' }}>
              {stats.max}
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas Card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px 20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Chart Header Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
              Visualizing <span style={{ color: 'var(--accent-light)' }}>{valueKey}</span> by <span style={{ color: 'var(--cyan-light)' }}>{labelKey}</span>
            </span>
          </div>

          {/* Type Selector Tabs */}
          <div className="pill-tabs" style={{ padding: '3px' }}>
            <button
              className={`pill-tab ${chart === 'bar' ? 'active' : ''}`}
              onClick={() => setChart('bar')}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <BarChart3 size={12} /> Bar
            </button>
            <button
              className={`pill-tab ${chart === 'line' ? 'active' : ''}`}
              onClick={() => setChart('line')}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <LineIcon size={12} /> Line
            </button>
            <button
              className={`pill-tab ${chart === 'area' ? 'active' : ''}`}
              onClick={() => setChart('area')}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <TrendingUp size={12} /> Area
            </button>
            <button
              className={`pill-tab ${chart === 'pie' ? 'active' : ''}`}
              onClick={() => setChart('pie')}
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            >
              <PieIcon size={12} /> Donut
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div style={{ width: '100%', height: '360px' }}>
          <ResponsiveContainer>
            {chart === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey={labelKey}
                  stroke="#64748b"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Bar dataKey={valueKey} fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : chart === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey={labelKey} stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" interval={0} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Line
                  type="monotone"
                  dataKey={valueKey}
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: '#22d3ee', r: 4, strokeWidth: 2, stroke: '#0e1017' }}
                  activeDot={{ r: 7, fill: '#8b5cf6' }}
                />
              </LineChart>
            ) : chart === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <defs>
                  <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey={labelKey} stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" interval={0} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Area
                  type="monotone"
                  dataKey={valueKey}
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGlow)"
                />
              </AreaChart>
            ) : (
              <PieChart>
                <Tooltip content={customTooltip} />
                <Pie
                  data={data}
                  dataKey={valueKey}
                  nameKey={labelKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={65}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
