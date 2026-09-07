import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface MutationModalProps {
  isOpen: boolean;
  sql: string;
  explanation: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MutationModal: React.FC<MutationModalProps> = ({
  isOpen,
  sql,
  explanation,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="var(--rose-400)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Confirm Database Mutation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                This action modifies rows or structure in your database
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Safety Note */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} color="var(--emerald-400)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--emerald-400)' }}>
            Snapshot auto-saved! You can revert this change anytime with the <strong>Undo Mutation</strong> button in the top bar.
          </span>
        </div>

        {/* SQL Preview */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Statement to be executed:
          </label>
          <pre
            className="font-mono"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '0.82rem',
              color: 'var(--rose-400)',
              whiteSpace: 'pre-wrap',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            {sql}
          </pre>
        </div>

        {explanation && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-main)' }}>Impact: </strong> {explanation}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger btn-sm"
            style={{ gap: '6px' }}
          >
            <AlertTriangle size={13} />
            <span>Apply Mutation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
