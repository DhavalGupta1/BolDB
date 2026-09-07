import React from 'react';
import { Database, Download, Key, RotateCcw, HardDrive } from 'lucide-react';
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
  return (
    <header
      style={{
        height: '52px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Database size={16} color="#000" />
        </div>
        <span className="brand-font" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
          BolDB
        </span>
      </div>

      {/* Center — Active DB */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenUploadModal}
          className="btn btn-ghost btn-sm"
          style={{ gap: '5px', color: 'var(--text-muted)' }}
        >
          <HardDrive size={13} />
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metadata.name}
          </span>
          {metadata.isDirty && (
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)' }} />
          )}
        </button>

        <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>•</span>

        <button onClick={() => onLoadSample('ecommerce')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '3px 7px' }}>
          E-Commerce
        </button>
        <button onClick={() => onLoadSample('saas')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '3px 7px' }}>
          SaaS
        </button>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {canRollback && (
          <button onClick={onRollback} className="btn btn-ghost btn-sm" title="Undo last change">
            <RotateCcw size={13} />
          </button>
        )}

        <button onClick={onOpenApiKeyModal} className="btn btn-ghost btn-sm" style={{ gap: '5px' }}>
          <Key size={13} />
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: hasApiKey ? 'var(--green)' : 'var(--amber)',
            }}
          />
        </button>

        <button onClick={onDownloadDb} className="btn btn-primary btn-sm" style={{ gap: '5px' }}>
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
