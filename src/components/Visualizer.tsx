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

const MONOCHROME_COLORS = [
  '#09090b', '#27272a', '#52525b', '#71717a', '#a1a1aa',
  '#d4d4d8', '#18181b', '#3f3f46', '#e4e4e7'
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
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #e4e4e7',
        color: '#71717a'
      }}>
        <BarChart3 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#09090b' }}>
          No Numeric Chartable Data
        </p>
        <p style={{ fontSize: '0.78rem', color: '#71717a', marginTop: '4px' }}>
          Query must return at least one text category column and one numeric metric column
        </p>
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <p style={{ fontSize: '0.72rem', color: '#71717a', marginBottom: '4px' }}>
            {labelKey}: <strong style={{ color: '#09090b' }}>{label}</strong>
          </p>
          <p style={{ fontSize: '0.84rem', color: '#09090b', fontWeight: 700 }}>
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
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Sample Records
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090b', marginTop: '4px' }}>
              {stats.count}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Total Sum ({valueKey})
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090b', marginTop: '4px' }}>
              {stats.sum}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Average Value
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090b', marginTop: '4px' }}>
              {stats.avg}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e4e4e7',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Peak Value
            </span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#09090b', marginTop: '4px' }}>
              {stats.max}
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px 22px',
        boxShadow: 'var(--shadow-sm)'
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
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#09090b' }}>
              Visualizing <span style={{ color: '#09090b', textDecoration: 'underline' }}>{valueKey}</span> by <span style={{ color: '#52525b' }}>{labelKey}</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey={labelKey}
                  stroke="#71717a"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Bar dataKey={valueKey} fill="#09090b" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chart === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey={labelKey} stroke="#71717a" fontSize={11} angle={-25} textAnchor="end" interval={0} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Line
                  type="monotone"
                  dataKey={valueKey}
                  stroke="#09090b"
                  strokeWidth={2.5}
                  dot={{ fill: '#09090b', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#09090b' }}
                />
              </LineChart>
            ) : chart === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <defs>
                  <linearGradient id="areaMono" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#09090b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#09090b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey={labelKey} stroke="#71717a" fontSize={11} angle={-25} textAnchor="end" interval={0} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Area
                  type="monotone"
                  dataKey={valueKey}
                  stroke="#09090b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaMono)"
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
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={MONOCHROME_COLORS[i % MONOCHROME_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: '0.74rem', color: '#52525b' }}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
