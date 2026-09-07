import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface MutationModalProps {
  isOpen: boolean;
  sql: string;
  explanation: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MutationModal: React.FC<MutationModalProps> = ({ isOpen, sql, explanation, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '460px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <AlertTriangle size={15} color="var(--amber)" />
            <h3 style={{ fontSize: '0.95rem' }}>Confirm Change</h3>
          </div>
          <button onClick={onCancel} className="btn btn-ghost btn-xs"><X size={14} /></button>
        </div>

        <pre className="mono" style={{
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '10px 12px',
          fontSize: '0.76rem', color: 'var(--amber)', whiteSpace: 'pre-wrap',
          maxHeight: '120px', overflowY: 'auto', marginBottom: '10px',
        }}>{sql}</pre>

        {explanation && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '16px' }}>{explanation}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm} className="btn btn-primary btn-sm" style={{ background: 'var(--amber)', color: '#000' }}>Apply</button>
        </div>
      </div>
    </div>
  );
};
