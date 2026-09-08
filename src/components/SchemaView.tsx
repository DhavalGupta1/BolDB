import React, { useState } from 'react';
import { Key, Hash, FileText, Copy, Check, Table as TableIcon } from 'lucide-react';
import type { TableSchema } from '../types/database';

interface SchemaViewProps {
  tableSchema: TableSchema | null;
}

export const SchemaView: React.FC<SchemaViewProps> = ({ tableSchema }) => {
  const [copied, setCopied] = useState(false);

  if (!tableSchema) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #e4e4e7',
        color: '#71717a'
      }}>
        <TableIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#09090b' }}>No Table Selected</p>
        <p style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '4px' }}>
          Select a table from the sidebar to inspect its schema and structure
        </p>
      </div>
    );
  }

  const copySql = () => {
    if (tableSchema.sql) {
      navigator.clipboard.writeText(tableSchema.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Table Header Info Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
            background: '#f4f4f5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '1px solid #e4e4e7'
          }}>
            <TableIcon size={20} color="#09090b" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#09090b' }}>
              {tableSchema.name}
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#71717a', margin: 0 }}>
              {tableSchema.columns.length} columns • {tableSchema.rowCount.toLocaleString()} recorded rows
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-purple" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
            SQLite Table
          </span>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="data-table-container">
        <div style={{
          padding: '12px 16px',
          background: '#fafafa',
          borderBottom: '1px solid #e4e4e7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
            Columns & Data Types
          </span>
          <span className="mono" style={{ fontSize: '0.68rem', color: '#71717a' }}>
            {tableSchema.columns.length} fields
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Type</th>
                <th>Primary Key</th>
                <th>Nullable</th>
                <th>Default Value</th>
              </tr>
            </thead>
            <tbody>
              {tableSchema.columns.map((col) => (
                <tr key={col.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {Boolean(col.pk) ? (
                        <span title="Primary Key"><Key size={13} color="#b45309" /></span>
                      ) : (
                        <Hash size={13} color="#a1a1aa" />
                      )}
                      <span style={{ fontWeight: 600, color: '#09090b' }}>{col.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-cyan mono" style={{ fontSize: '0.68rem' }}>
                      {col.type || 'TEXT'}
                    </span>
                  </td>
                  <td>
                    {Boolean(col.pk) ? (
                      <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                        PK (Index {col.pk})
                      </span>
                    ) : (
                      <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {col.notnull ? (
                      <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.65rem' }}>
                        NOT NULL
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 500 }}>NULLABLE</span>
                    )}
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '0.72rem', color: '#71717a' }}>
                      {col.dflt_value !== null && col.dflt_value !== undefined ? String(col.dflt_value) : 'None'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Definition */}
      {tableSchema.sql && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            padding: '10px 16px',
            background: '#fafafa',
            borderBottom: '1px solid #e4e4e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={13} color="#09090b" />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                DDL Statement
              </span>
            </div>
            <button onClick={copySql} className="btn btn-secondary btn-xs" style={{ gap: '4px' }}>
              {copied ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
              <span style={{ fontSize: '0.68rem' }}>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="mono" style={{
            padding: '14px 16px',
            fontSize: '0.82rem',
            color: '#09090b',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            margin: 0,
            background: '#f8fafc',
            lineHeight: 1.5
          }}>
            {tableSchema.sql}
          </pre>
        </div>
      )}
    </div>
  );
};
