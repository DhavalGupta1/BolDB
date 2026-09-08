import React, { useState, useRef } from 'react';
import {
  UploadCloud, Database, X, AlertCircle, FileSpreadsheet,
  FileCode, FileText, Loader2, Sparkles,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => Promise<void>;
  onLoadSample: (sampleId: 'ecommerce' | 'saas') => Promise<void>;
  onCreateEmpty: () => Promise<void>;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen, onClose, onUploadFile, onLoadSample, onCreateEmpty,
}) => {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    setStatusMsg(`Parsing "${file.name}"...`);
    try {
      await onUploadFile(file);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to process file');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  };

  const formats = [
    { label: 'Excel & Sheets', exts: '.xlsx, .xlsm, .xls', icon: <FileSpreadsheet size={13} color="#09090b" /> },
    { label: 'JSON & Lines', exts: '.json, .jsonl', icon: <FileCode size={13} color="#09090b" /> },
    { label: 'CSV / TSV', exts: '.csv, .tsv, .txt', icon: <FileText size={13} color="#09090b" /> },
    { label: 'SQL & SQLite', exts: '.sql, .db, .sqlite', icon: <Database size={13} color="#09090b" /> },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '480px', background: '#ffffff', border: '1px solid #e4e4e7', color: '#09090b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
              background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UploadCloud size={16} color="#09090b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#09090b' }}>Import Dataset</h3>
              <p style={{ fontSize: '0.72rem', color: '#71717a', margin: 0 }}>
                Import spreadsheets, JSON collections, SQL dumps or SQLite databases
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ color: '#71717a' }}><X size={16} /></button>
        </div>

        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: '#fef2f2',
            border: '1px solid #fecaca', marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <AlertCircle size={13} color="#b91c1c" />
            <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>{error}</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => !loading && ref.current?.click()}
          style={{
            border: drag ? '1.5px dashed #09090b' : '1px dashed #a1a1aa',
            borderRadius: 'var(--radius-lg)', padding: '28px 16px', textAlign: 'center',
            cursor: loading ? 'wait' : 'pointer', transition: 'all 0.15s ease', marginBottom: '16px',
            background: drag ? '#f4f4f5' : '#fafafa',
          }}
        >
          <input
            ref={ref}
            type="file"
            accept=".db,.sqlite,.sqlite3,.csv,.tsv,.txt,.xlsx,.xlsm,.xls,.xlsb,.json,.jsonl,.ndjson,.sql"
            hidden
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={26} className="animate-spin" color="#09090b" />
              <span style={{ fontSize: '0.8rem', color: '#52525b' }}>{statusMsg || 'Processing file...'}</span>
            </div>
          ) : (
            <>
              <UploadCloud size={28} color="#09090b" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.84rem', color: '#09090b', fontWeight: 600, margin: '0 0 4px' }}>
                Drop any dataset here or click to browse
              </p>
              <p style={{ fontSize: '0.72rem', color: '#71717a', margin: 0 }}>
                Automatic schema creation & column type inference
              </p>
            </>
          )}
        </div>

        {/* Supported format badges */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px',
          marginBottom: '16px',
        }}>
          {formats.map((fmt, idx) => (
            <div key={idx} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              background: '#ffffff', border: '1px solid #e4e4e7',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              {fmt.icon}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#09090b' }}>{fmt.label}</div>
                <div style={{ fontSize: '0.65rem', color: '#71717a', fontFamily: 'monospace' }}>{fmt.exts}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Preset Sample Databases */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            <Sparkles size={11} color="#71717a" />
            <span style={{ fontSize: '0.68rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Or Load Sample Demo Database
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={async () => { setLoading(true); await onLoadSample('ecommerce'); setLoading(false); onClose(); }}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              E-Commerce Store (4 tables)
            </button>
            <button
              onClick={async () => { setLoading(true); await onLoadSample('saas'); setLoading(false); onClose(); }}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              SaaS Analytics (4 tables)
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <button
            onClick={async () => { await onCreateEmpty(); onClose(); }}
            disabled={loading}
            className="btn btn-ghost btn-xs"
            style={{ color: '#71717a', gap: '4px' }}
          >
            <Database size={11} /> Start with empty SQLite database
          </button>
        </div>
      </div>
    </div>
  );
};
