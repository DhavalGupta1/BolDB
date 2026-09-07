import React, { useState, useRef } from 'react';
import { UploadCloud, Database, X, AlertCircle } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadDatabase: (buffer: ArrayBuffer, fileName: string) => Promise<void>;
  onUploadCsv: (fileName: string, content: string) => Promise<void>;
  onLoadSample: (sampleId: 'ecommerce' | 'saas') => Promise<void>;
  onCreateEmpty: () => Promise<void>;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen, onClose, onUploadDatabase, onUploadCsv, onLoadSample, onCreateEmpty,
}) => {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null); setLoading(true);
    try {
      const n = file.name.toLowerCase();
      if (n.endsWith('.csv')) await onUploadCsv(file.name, await file.text());
      else if (n.endsWith('.db') || n.endsWith('.sqlite') || n.endsWith('.sqlite3')) await onUploadDatabase(await file.arrayBuffer(), file.name);
      else throw new Error('Use .sqlite, .db, or .csv');
      onClose();
    } catch (e: any) { setError(e?.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1rem' }}>Open Database</h3>
          <button onClick={onClose} className="btn btn-ghost btn-xs"><X size={16} /></button>
        </div>

        {error && (
          <div style={{ padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--red-bg)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertCircle size={12} color="var(--red)" />
            <span style={{ fontSize: '0.72rem', color: 'var(--red)' }}>{error}</span>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => ref.current?.click()}
          style={{
            border: drag ? '1px dashed var(--accent)' : '1px dashed var(--border-hover)',
            borderRadius: 'var(--radius-lg)', padding: '30px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.15s', marginBottom: '16px',
            background: drag ? 'var(--accent-bg)' : 'transparent',
          }}
        >
          <input ref={ref} type="file" accept=".db,.sqlite,.sqlite3,.csv" hidden onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          <UploadCloud size={26} color={drag ? 'var(--accent)' : 'var(--text-dim)'} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{loading ? 'Processing...' : 'Drop file or click'}</p>
          <p style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '4px' }}>.sqlite · .db · .csv</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button onClick={async () => { setLoading(true); await onLoadSample('ecommerce'); setLoading(false); onClose(); }} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>E-Commerce</button>
          <button onClick={async () => { setLoading(true); await onLoadSample('saas'); setLoading(false); onClose(); }} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>SaaS</button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={async () => { await onCreateEmpty(); onClose(); }} className="btn btn-ghost btn-xs" style={{ color: 'var(--text-dim)', gap: '4px' }}>
            <Database size={11} /> Empty database
          </button>
        </div>
      </div>
    </div>
  );
};
