import React from 'react';
import { Database, Download, Key, RotateCcw, Sparkles, FileSpreadsheet, HardDrive } from 'lucide-react';
import type { DatabaseMetadata } from '../types/database';

interface NavbarProps {
  metadata: DatabaseMetadata;
  hasApiKey: boolean;
  canRollback: boolean;
  onOpenApiKeyModal: () => void;
  onOpenUploadModal: () => void;
  onDownloadDb: () => void;
  onRollback: () => void;
  onLoadSample: (sampleId: 'ecommerce' | 'saas') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metadata,
  hasApiKey,
  canRollback,
  onOpenApiKeyModal,
  onOpenUploadModal,
  onDownloadDb,
  onRollback,
  onLoadSample,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <header className="glass-nav" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div 
          style={{ 
            width: '38px', 
            height: '38px', 
            borderRadius: '10px', 
            background: 'var(--grad-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Database size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-font" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Bol<span className="text-gradient">DB</span>
            </span>
            <span className="badge badge-indigo">
              <Sparkles size={11} /> AI Engine
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '-2px' }}>
            Speak to your Database
          </p>
        </div>
      </div>

      {/* Active Database Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onOpenUploadModal}
          className="btn btn-secondary btn-sm"
          title="Open Database or Import CSV"
          style={{ gap: '6px' }}
        >
          <HardDrive size={14} color="var(--cyan-400)" />
          <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
            {metadata.name}
          </span>
          {metadata.isDirty && (
            <span 
              style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--amber-400)',
                boxShadow: '0 0 8px var(--amber-400)' 
              }} 
              title="Unsaved changes in active session"
            />
          )}
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {metadata.tableCount} {metadata.tableCount === 1 ? 'table' : 'tables'} • {formatBytes(metadata.sizeBytes)}
        </span>

        {/* Quick Sample Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
          <button 
            onClick={() => onLoadSample('ecommerce')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            🛒 E-Commerce
          </button>
          <button 
            onClick={() => onLoadSample('saas')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            ⚡ SaaS
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Rollback button if mutation history exists */}
        {canRollback && (
          <button 
            onClick={onRollback}
            className="btn btn-secondary btn-sm"
            title="Rollback last mutation"
            style={{ gap: '5px', borderColor: 'var(--amber-400)', color: 'var(--amber-400)' }}
          >
            <RotateCcw size={13} />
            <span>Undo Mutation</span>
          </button>
        )}

        {/* Upload / Import */}
        <button 
          onClick={onOpenUploadModal}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <FileSpreadsheet size={14} />
          <span>Upload / CSV</span>
        </button>

        {/* Gemini API Key */}
        <button 
          onClick={onOpenApiKeyModal}
          className={`btn btn-sm ${hasApiKey ? 'btn-secondary' : 'btn-accent'}`}
          style={{ gap: '6px' }}
        >
          <Key size={13} />
          <span>{hasApiKey ? 'Gemini Key' : 'Connect Key'}</span>
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: hasApiKey ? 'var(--emerald-400)' : 'var(--amber-400)' 
            }} 
          />
        </button>

        {/* Download DB */}
        <button 
          onClick={onDownloadDb}
          className="btn btn-primary btn-sm"
          style={{ gap: '6px', fontWeight: 600 }}
          title="Download the updated SQLite database"
        >
          <Download size={14} />
          <span>Download DB</span>
        </button>
      </div>
    </header>
  );
};
