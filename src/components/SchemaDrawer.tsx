import React, { useState } from 'react';
import { X, Table, ChevronRight, ChevronDown, Key, Play, Search, RefreshCw } from 'lucide-react';
import type { TableSchema } from '../types/database';

interface SchemaDrawerProps {
  tables: TableSchema[];
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
  onClose: () => void;
  onRefresh: () => void;
}

export const SchemaDrawer: React.FC<SchemaDrawerProps> = ({
  tables, selectedTable, onSelectTable, onClose, onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel">
        {/* Header */}
        <div style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem' }}>Schema</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={onRefresh} className="btn btn-ghost btn-xs"><RefreshCw size={12} /></button>
            <button onClick={onClose} className="btn btn-ghost btn-xs"><X size={14} /></button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} color="var(--text-dim)" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="input" placeholder="Search tables..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '28px', fontSize: '0.75rem', padding: '6px 8px 6px 28px' }}
            />
          </div>
        </div>

        {/* Table list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              No tables found
            </div>
          ) : (
            filtered.map((table) => {
              const selected = selectedTable === table.name;
              const isOpen = Boolean(expanded[table.name]);

              return (
                <div key={table.name} className="animate-fade" style={{ marginBottom: '1px' }}>
                  <div
                    onClick={() => { setExpanded((p) => ({ ...p, [table.name]: !p[table.name] })); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                      background: selected ? 'var(--accent-bg)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{ color: 'var(--text-dim)', display: 'flex' }}>
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                      <Table size={12} color={selected ? 'var(--accent)' : 'var(--text-dim)'} />
                      <span style={{
                        fontSize: '0.78rem', fontWeight: selected ? 600 : 400,
                        color: selected ? 'var(--accent-light)' : 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {table.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="mono" style={{ fontSize: '0.63rem', color: 'var(--text-dim)' }}>{table.rowCount}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectTable(table.name); }}
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '2px 4px', opacity: 0.3 }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                      >
                        <Play size={10} />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '2px 0 4px 32px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
                      {table.columns.map((col) => (
                        <div key={col.name} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '3px 8px', fontSize: '0.7rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {col.pk === 1 && <Key size={8} color="var(--amber)" />}
                            <span className="mono" style={{ color: col.pk ? 'var(--amber)' : 'var(--text-secondary)', fontSize: '0.7rem' }}>
                              {col.name}
                            </span>
                          </div>
                          <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
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
      </aside>
    </>
  );
};
