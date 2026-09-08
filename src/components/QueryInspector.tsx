import React, { useState } from 'react';
import { Play, Copy, Check, AlertTriangle, ChevronDown, ChevronUp, Edit2, Wrench, Clock, Terminal, Sparkles } from 'lucide-react';
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
  currentSql,
  explanation,
  isMutation,
  result,
  isRunning,
  onExecute,
  onAutoFix,
}) => {
  const [editable, setEditable] = useState(currentSql);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => {
    setEditable(currentSql);
    setEditing(false);
  }, [currentSql]);

  const copy = () => {
    navigator.clipboard.writeText(editable);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasError = Boolean(result?.error);

  if (!currentSql) return null;

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* HUD Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'var(--bg-elevated)',
        borderBottom: collapsed ? 'none' : '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-ghost btn-xs"
            style={{ padding: '3px' }}
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Terminal size={13} color="var(--cyan-light)" />
            <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text)' }}>
              SQL STUDIO
            </span>
          </div>

          {isMutation ? (
            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
              <AlertTriangle size={9} /> Mutation / Write
            </span>
          ) : (
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              Query / Read
            </span>
          )}

          {result && !hasError && (
            <span className="badge badge-green mono" style={{ fontSize: '0.65rem' }}>
              <Clock size={9} /> {result.executionTimeMs}ms
            </span>
          )}

          {result?.rowCount !== undefined && (
            <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              ({result.rowCount} rows returned)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setEditing(!editing)}
            className="btn btn-secondary btn-xs"
            title={editing ? 'Exit Edit' : 'Edit SQL Query'}
          >
            <Edit2 size={11} /> {editing ? 'Cancel' : 'Edit'}
          </button>

          <button
            onClick={copy}
            className="btn btn-secondary btn-xs"
            title="Copy SQL Query"
          >
            {copied ? <Check size={11} color="var(--green)" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => onExecute(editable)}
            disabled={isRunning}
            className="btn btn-primary btn-xs"
            style={{ gap: '4px' }}
          >
            <Play size={11} /> Run
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Explanation Callout */}
          {explanation && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}>
              <Sparkles size={13} color="var(--accent-light)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 500 }}>
                {explanation}
              </span>
            </div>
          )}

          {/* SQL Editor / Viewer */}
          {editing ? (
            <textarea
              value={editable}
              onChange={(e) => setEditable(e.target.value)}
              rows={4}
              className="mono"
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          ) : (
            <pre className="mono" style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: '#38bdf8',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {editable}
            </pre>
          )}

          {/* Error & Auto-Fix Banner */}
          {hasError && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--red-bg)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} color="var(--red)" />
                <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--red)' }}>
                  {result?.error}
                </span>
              </div>
              {onAutoFix && (
                <button
                  onClick={() => onAutoFix(editable, result?.error || '')}
                  className="btn btn-xs"
                  style={{ background: 'var(--red)', color: '#fff', gap: '4px' }}
                >
                  <Wrench size={11} /> Auto-Fix with AI
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
