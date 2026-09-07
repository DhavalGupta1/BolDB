import React, { useState } from 'react';
import { Table, ChevronRight, ChevronDown, Key, Play, Plus, Search, Layers, RefreshCw } from 'lucide-react';
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

  const toggleExpand = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--cyan-400)" />
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Schema Explorer
            </h3>
          </div>
          <button 
            onClick={onRefreshSchema}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', borderRadius: '4px' }}
            title="Refresh database schema"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Filter Input */}
        <div style={{ position: 'relative' }}>
          <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '30px', fontSize: '0.8rem', padding: '6px 10px 6px 30px' }}
          />
        </div>
      </div>

      {/* Table List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {tables.length === 0 ? (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <p>No tables detected.</p>
            <button 
              onClick={onOpenUpload}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '12px', fontSize: '0.75rem' }}
            >
              <Plus size={12} /> Upload DB / CSV
            </button>
          </div>
        ) : (
          filteredTables.map((table) => {
            const isSelected = selectedTable === table.name;
            const isExpanded = Boolean(expandedTables[table.name]);

            return (
              <div 
                key={table.name}
                style={{
                  marginBottom: '6px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Table Header Row */}
                <div
                  onClick={() => {
                    onSelectTable(table.name);
                    toggleExpand(table.name, { stopPropagation: () => {} } as any);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span 
                      onClick={(e) => toggleExpand(table.name, e)}
                      style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <Table size={14} color={isSelected ? 'var(--cyan-400)' : 'var(--text-muted)'} />
                    <span 
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {table.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      className="badge badge-indigo"
                      style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                      title={`${table.rowCount} total rows`}
                    >
                      {table.rowCount}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewTable(table.name);
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '3px 5px', height: '22px' }}
                      title={`Run SELECT * FROM "${table.name}" LIMIT 50`}
                    >
                      <Play size={11} color="var(--cyan-400)" />
                    </button>
                  </div>
                </div>

                {/* Expanded Columns View */}
                {isExpanded && (
                  <div 
                    style={{ 
                      padding: '4px 10px 8px 30px', 
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {table.columns.map((col) => (
                      <div 
                        key={col.name}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          padding: '2px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {col.pk === 1 && (
                            <span title="Primary Key">
                              <Key size={10} color="var(--amber-400)" />
                            </span>
                          )}
                          <span style={{ fontFamily: 'JetBrains Mono', color: col.pk ? 'var(--amber-400)' : 'var(--text-main)' }}>
                            {col.name}
                          </span>
                        </div>
                        <span 
                          style={{ 
                            fontSize: '0.65rem', 
                            color: 'var(--text-dim)', 
                            textTransform: 'uppercase',
                            fontFamily: 'JetBrains Mono' 
                          }}
                        >
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

      {/* Sidebar Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
        <button 
          onClick={onOpenUpload}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', gap: '6px' }}
        >
          <Plus size={13} />
          <span>Upload File or CSV</span>
        </button>
      </div>
    </aside>
  );
};
