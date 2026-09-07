import React, { useState } from 'react';
import { Table, ChevronRight, ChevronDown, Key, Play, Plus, Search, RefreshCw } from 'lucide-react';
import type { TableSchema } from '../types/database';

interface SidebarProps {
  tables: TableSchema[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  onPreviewTable: (tableName: string) => void;
  onRefreshSchema: () => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  onPreviewTable,
  onRefreshSchema,
  onOpenUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleExpand = (tableName: string) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="sidebar">
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
          Tables
        </span>
        <button onClick={onRefreshSchema} className="btn btn-ghost btn-sm" style={{ padding: '3px' }}>
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} color="var(--text-dim)" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-text"
            placeholder="Filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '28px', padding: '5px 8px 5px 28px', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* Table List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {tables.length === 0 ? (
          <div style={{ padding: '30px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
            <p style={{ marginBottom: '10px' }}>No tables</p>
            <button onClick={onOpenUpload} className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }}>
              <Plus size={11} /> Upload
            </button>
          </div>
        ) : (
          filteredTables.map((table, idx) => {
            const isSelected = selectedTable === table.name;
            const isExpanded = Boolean(expandedTables[table.name]);

            return (
              <div
                key={table.name}
                className="animate-fade-in"
                style={{
                  animationDelay: `${idx * 0.03}s`,
                  marginBottom: '2px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div
                  onClick={() => {
                    onSelectTable(table.name);
                    toggleExpand(table.name);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ color: 'var(--text-dim)', display: 'flex' }}>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                    <Table size={12} color={isSelected ? 'var(--text-main)' : 'var(--text-dim)'} />
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {table.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
                      {table.rowCount}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPreviewTable(table.name); }}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 4px', opacity: 0.4, transition: 'opacity 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                    >
                      <Play size={10} />
                    </button>
                  </div>
                </div>

                {/* Columns */}
                {isExpanded && (
                  <div style={{
                    padding: '2px 8px 6px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                  }}>
                    {table.columns.map((col) => (
                      <div key={col.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                        padding: '2px 0',
                        color: 'var(--text-dim)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {col.pk === 1 && <Key size={8} color="var(--amber)" />}
                          <span style={{ fontFamily: 'JetBrains Mono', color: col.pk ? 'var(--amber)' : 'var(--text-muted)', fontSize: '0.7rem' }}>
                            {col.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.6rem', fontFamily: 'JetBrains Mono', color: 'var(--text-dim)' }}>
                          {col.type || 'ANY'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={onOpenUpload} className="btn btn-secondary btn-sm" style={{ width: '100%', gap: '5px', fontSize: '0.72rem' }}>
          <Plus size={11} /> Upload
        </button>
      </div>
    </aside>
  );
};
