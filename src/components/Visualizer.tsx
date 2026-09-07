import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, AlertCircle } from 'lucide-react';
import type { QueryResult } from '../types/database';

interface VisualizerProps {
  result: QueryResult | null;
  suggestedType?: 'bar' | 'line' | 'pie' | 'none';
}

const COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
];

export const Visualizer: React.FC<VisualizerProps> = ({
  result,
  suggestedType = 'bar',
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>(
    suggestedType === 'pie' ? 'pie' : suggestedType === 'line' ? 'line' : 'bar'
  );

  // Sync suggested type when it changes
  React.useEffect(() => {
    if (suggestedType && suggestedType !== 'none') {
      setChartType(suggestedType);
    }
  }, [suggestedType]);

  // Identify label column (string) and numeric column (number)
  const { chartData, labelKey, valueKey, canVisualize } = useMemo(() => {
    if (!result || result.values.length === 0 || result.columns.length < 2) {
      return { chartData: [], labelKey: '', valueKey: '', canVisualize: false };
    }

    // Find first numeric column
    let numColIdx = -1;
    let textColIdx = -1;

    for (let c = 0; c < result.columns.length; c++) {
      const sampleVal = result.values[0][c];
      if (typeof sampleVal === 'number' && numColIdx === -1) {
        numColIdx = c;
      } else if (typeof sampleVal === 'string' && textColIdx === -1) {
        textColIdx = c;
      }
    }

    // If no string column, use column 0 as label
    if (textColIdx === -1) textColIdx = 0;
    // If no numeric column found, find any column convertible to number
    if (numColIdx === -1) {
      for (let c = 0; c < result.columns.length; c++) {
        if (c !== textColIdx && !isNaN(Number(result.values[0][c]))) {
          numColIdx = c;
          break;
        }
      }
    }

    if (numColIdx === -1) {
      return { chartData: [], labelKey: '', valueKey: '', canVisualize: false };
    }

    const label = result.columns[textColIdx];
    const value = result.columns[numColIdx];

    const data = result.values.slice(0, 30).map((row) => ({
      [label]: String(row[textColIdx] ?? ''),
      [value]: Number(row[numColIdx] ?? 0),
    }));

    return {
      chartData: data,
      labelKey: label,
      valueKey: value,
      canVisualize: true,
    };
  }, [result]);

  if (!canVisualize || chartData.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
        <AlertCircle size={32} color="var(--amber-400)" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Chart Not Available for this Result
        </h4>
        <p style={{ fontSize: '0.8rem', maxWidth: '400px', margin: '0 auto' }}>
          Charts require at least one label column (e.g. category, name, date) and one numeric column (e.g. count, price, total).
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Chart controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Visual Analysis</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Comparing <strong style={{ color: 'var(--cyan-400)' }}>{valueKey}</strong> by <strong style={{ color: 'var(--indigo-500)' }}>{labelKey}</strong>
          </span>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setChartType('bar')}
            className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            <BarChart3 size={12} />
            <span>Bar</span>
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            <LineIcon size={12} />
            <span>Line</span>
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`btn btn-sm ${chartType === 'pie' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            <PieIcon size={12} />
            <span>Pie</span>
          </button>
        </div>
      </div>

      {/* Render Chart */}
      <div style={{ width: '100%', height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey={labelKey}
                stroke="#64748b"
                fontSize={11}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#0e1422',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
              <Bar dataKey={valueKey} fill="url(#barGrad)" radius={[6, 6, 0, 0]}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey={labelKey}
                stroke="#64748b"
                fontSize={11}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#0e1422',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
              <Line
                type="monotone"
                dataKey={valueKey}
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, fill: '#06b6d4' }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: '#0e1422',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                }}
              />
              <Pie
                data={chartData}
                dataKey={valueKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={55}
                paddingAngle={3}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
