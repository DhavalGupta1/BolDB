import React, { useState, useRef } from 'react';
import { UploadCloud, Database, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadDatabase: (buffer: ArrayBuffer, fileName: string) => Promise<void>;
  onUploadCsv: (fileName: string, content: string) => Promise<void>;
  onLoadSample: (sampleId: 'ecommerce' | 'saas') => Promise<void>;
  onCreateEmpty: () => Promise<void>;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadDatabase,
  onUploadCsv,
  onLoadSample,
  onCreateEmpty,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      const fileName = file.name;
      const lower = fileName.toLowerCase();

      if (lower.endsWith('.csv')) {
        const text = await file.text();
        await onUploadCsv(fileName, text);
      } else if (lower.endsWith('.db') || lower.endsWith('.sqlite') || lower.endsWith('.sqlite3') || lower.endsWith('.bin')) {
        const buffer = await file.arrayBuffer();
        await onUploadDatabase(buffer, fileName);
      } else {
        throw new Error('Unsupported file format. Please upload a .sqlite, .db, or .csv file.');
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = async (id: 'ecommerce' | 'saas') => {
    setIsLoading(true);
    setError(null);
    try {
      await onLoadSample(id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to load sample');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadCloud size={18} color="var(--cyan-400)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Upload or Connect Database</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Runs 100% locally in your browser with WebAssembly SQLite
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--rose-500)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} color="var(--rose-400)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--rose-400)' }}>{error}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed var(--indigo-500)' : '2px dashed var(--border-medium)',
            background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '22px',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            accept=".db,.sqlite,.sqlite3,.csv"
            style={{ display: 'none' }}
          />

          <UploadCloud
            size={40}
            color={isDragging ? 'var(--cyan-400)' : 'var(--indigo-500)'}
            style={{ margin: '0 auto 12px', transition: 'transform 0.2s', transform: isDragging ? 'scale(1.1)' : 'none' }}
          />

          <h4 style={{ fontSize: '0.95rem', marginBottom: '6px' }}>
            {isLoading ? 'Processing file...' : 'Drop your database file or click to browse'}
          </h4>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Supports SQLite (<strong>.sqlite</strong>, <strong>.db</strong>, <strong>.sqlite3</strong>) &amp; CSV spreadsheets (<strong>.csv</strong>)
          </p>

          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
            <CheckCircle2 size={11} /> 100% Client-Side Privacy — Data Never Leaves Your Device
          </span>
        </div>

        {/* Or pick a sample database */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={14} color="var(--amber-400)" />
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Or Try A Built-in Sample Database
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {/* E-Commerce Sample */}
            <div
              onClick={() => handleSampleClick('ecommerce')}
              className="glass-panel"
              style={{
                padding: '14px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s',
                border: '1px solid var(--border-medium)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--indigo-500)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>🛒</span>
                <strong style={{ fontSize: '0.88rem' }}>E-Commerce Store</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Customers, products, orders, order items, and revenue data.
              </p>
            </div>

            {/* SaaS Analytics Sample */}
            <div
              onClick={() => handleSampleClick('saas')}
              className="glass-panel"
              style={{
                padding: '14px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s',
                border: '1px solid var(--border-medium)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cyan-400)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <strong style={{ fontSize: '0.88rem' }}>SaaS Metrics</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Accounts, subscriptions, recurring revenue (MRR), and invoices.
              </p>
            </div>
          </div>

          {/* Create Empty DB */}
          <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={async () => {
                await onCreateEmpty();
                onClose();
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}
            >
              <Database size={12} />
              <span>Or start with a blank database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
