import React, { useState } from 'react';
import { Play, Copy, Check, AlertTriangle, ChevronDown, ChevronUp, Edit2, Wrench, Clock } from 'lucide-react';
import type { QueryResult } from '../types/database';

interface QueryInspectorProps {
  currentSql: string;
  explanation: string;
  isMutation: boolean;
  result: QueryResult | null;
  isRunning: boolean;
  onExecute: (sql: string) => Promise<void>;
  onAutoFix?: (failedSql: string, errorMsg: string) => Promise<void>;
}

export const QueryInspector: React.FC<QueryInspectorProps> = ({
  currentSql, explanation, isMutation, result, isRunning, onExecute, onAutoFix,
}) => {
  const [editable, setEditable] = useState(currentSql);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => { setEditable(currentSql); setEditing(false); }, [currentSql]);

  const copy = () => { navigator.clipboard.writeText(editable); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const hasError = Boolean(result?.error);

  if (!currentSql) return null;

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', borderBottom: collapsed ? 'none' : '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost btn-xs" style={{ padding: '2px' }}>
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>sql</span>
          {isMutation && <span className="badge" style={{ background: 'var(--amber-bg)', color: 'var(--amber)', fontSize: '0.58rem' }}><AlertTriangle size={8} /> write</span>}
          {result && !hasError && (
            <span className="mono" style={{ fontSize: '0.63rem', color: 'var(--text-dim)' }}>
              <Clock size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />{result.executionTimeMs}ms
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1px' }}>
          <button onClick={() => setEditing(!editing)} className="btn btn-ghost btn-xs"><Edit2 size={11} /></button>
          <button onClick={copy} className="btn btn-ghost btn-xs">{copied ? <Check size={11} color="var(--green)" /> : <Copy size={11} />}</button>
          <button onClick={() => onExecute(editable)} disabled={isRunning} className="btn btn-ghost btn-xs"><Play size={11} /></button>
        </div>
      </div>

      {!collapsed && (
        <>
          {editing ? (
            <textarea value={editable} onChange={(e) => setEditable(e.target.value)} rows={3}
              className="mono" style={{
                width: '100%', background: 'transparent', border: 'none', padding: '10px 12px',
                color: 'var(--text)', fontSize: '0.78rem', outline: 'none', resize: 'vertical',
              }} />
          ) : (
            <pre className="mono" style={{
              padding: '10px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)',
              overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0,
            }}>{editable}</pre>
          )}

          {explanation && (
            <div style={{ padding: '0 12px 8px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{explanation}</span>
            </div>
          )}

          {hasError && (
            <div style={{
              margin: '0 10px 10px', padding: '7px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
            }}>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--red)' }}>{result?.error}</span>
              {onAutoFix && (
                <button onClick={() => onAutoFix(editable, result?.error || '')}
                  className="btn btn-ghost btn-xs" style={{ color: 'var(--red)', gap: '3px', flexShrink: 0 }}>
                  <Wrench size={10} /> Fix
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
