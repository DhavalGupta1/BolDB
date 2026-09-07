import React, { useState } from 'react';
import { Play, Copy, Check, AlertTriangle, Clock, Terminal, Wrench, Edit2 } from 'lucide-react';
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
  const [editableSql, setEditableSql] = useState(currentSql);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state when new query arrives
  React.useEffect(() => {
    setEditableSql(currentSql);
    setIsEditing(false);
  }, [currentSql]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    onExecute(editableSql);
  };

  if (!currentSql) {
    return null;
  }

  const hasError = Boolean(result?.error);

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top bar with metadata */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={15} color="var(--cyan-400)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Generated SQL Statement
          </span>

          {isMutation && (
            <span className="badge badge-rose" style={{ gap: '4px' }}>
              <AlertTriangle size={11} /> Mutates Data
            </span>
          )}

          {result && !hasError && (
            <span className="badge badge-emerald" style={{ gap: '4px' }}>
              <Clock size={11} /> {result.executionTimeMs} ms
            </span>
          )}

          {hasError && (
            <span className="badge badge-rose">
              Execution Error
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn btn-sm ${isEditing ? 'btn-accent' : 'btn-ghost'}`}
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            title="Toggle direct SQL editing"
          >
            <Edit2 size={12} />
            <span>{isEditing ? 'Done Editing' : 'Edit SQL'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            title="Copy SQL to clipboard"
          >
            {copied ? <Check size={12} color="var(--emerald-400)" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '6px' }}
          >
            <Play size={12} />
            <span>Run SQL</span>
          </button>
        </div>
      </div>

      {/* SQL Code Box */}
      <div style={{ position: 'relative' }}>
        {isEditing ? (
          <textarea
            value={editableSql}
            onChange={(e) => setEditableSql(e.target.value)}
            rows={4}
            className="font-mono"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              color: 'var(--cyan-400)',
              fontSize: '0.85rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        ) : (
          <pre
            className="font-mono"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.875rem',
              color: '#38bdf8',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {editableSql}
          </pre>
        )}
      </div>

      {/* AI Query Explanation */}
      {explanation && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.07)',
            borderLeft: '3px solid var(--indigo-500)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: 'var(--text-main)' }}>Explanation: </strong>
            {explanation}
          </p>
        </div>
      )}

      {/* Error message and Auto-fix option */}
      {hasError && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--rose-400)" />
            <span style={{ fontSize: '0.825rem', color: 'var(--rose-400)', fontFamily: 'JetBrains Mono' }}>
              {result?.error}
            </span>
          </div>

          {onAutoFix && (
            <button
              onClick={() => onAutoFix(editableSql, result?.error || '')}
              className="btn btn-sm btn-danger"
              style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '5px' }}
            >
              <Wrench size={12} />
              <span>Auto-Fix with Gemini</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
