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
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '460px', background: '#ffffff', border: '1px solid #e4e4e7', color: '#09090b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="#b45309" />
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#09090b', margin: 0 }}>Confirm Database Mutation</h3>
          </div>
          <button onClick={onCancel} className="btn btn-ghost btn-xs" style={{ color: '#71717a' }}><X size={14} /></button>
        </div>

        <pre className="mono" style={{
          background: '#f8fafc', border: '1px solid #e4e4e7',
          borderRadius: 'var(--radius-sm)', padding: '12px 14px',
          fontSize: '0.8rem', color: '#09090b', whiteSpace: 'pre-wrap',
          maxHeight: '140px', overflowY: 'auto', marginBottom: '10px',
          lineHeight: 1.5
        }}>{sql}</pre>

        {explanation && <p style={{ fontSize: '0.74rem', color: '#52525b', marginBottom: '16px' }}>{explanation}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm} className="btn btn-primary btn-sm">Apply Mutation</button>
        </div>
      </div>
    </div>
  );
};
