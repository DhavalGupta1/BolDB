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
        borderBottom: '1px solid #e4e4e7',
        background: '#ffffff',
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
            borderRadius: '6px',
            background: '#09090b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Database size={16} color="#ffffff" />
        </div>
        <span className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#09090b' }}>
          BolDB
        </span>
      </div>

      {/* Center — Active DB */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenUploadModal}
          className="btn btn-ghost btn-sm"
          style={{ gap: '5px', color: '#52525b' }}
        >
          <HardDrive size={13} />
          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metadata.name}
          </span>
          {metadata.isDirty && (
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#b45309' }} />
          )}
        </button>

        <span style={{ color: '#a1a1aa', fontSize: '0.7rem' }}>•</span>

        <button onClick={() => onLoadSample('ecommerce')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '3px 7px', color: '#52525b' }}>
          E-Commerce
        </button>
        <button onClick={() => onLoadSample('saas')} className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '3px 7px', color: '#52525b' }}>
          SaaS
        </button>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {canRollback && (
          <button onClick={onRollback} className="btn btn-ghost btn-sm" title="Undo last change" style={{ color: '#09090b' }}>
            <RotateCcw size={13} />
          </button>
        )}

        <button onClick={onOpenApiKeyModal} className="btn btn-ghost btn-sm" style={{ gap: '5px', color: '#09090b' }}>
          <Key size={13} />
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: hasApiKey ? '#16a34a' : '#b45309',
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
