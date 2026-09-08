import React, { useState } from 'react';
import {
  Database, Table as TableIcon, ChevronRight, ChevronDown, Key,
  Sparkles, Plus, Search, RefreshCw, Zap, Flame,
  FolderUp, ArrowLeftToLine, ArrowRightToLine
} from 'lucide-react';
import type { TableSchema } from '../types/database';

interface SidebarProps {
  tables: TableSchema[];
  selectedTable: string | null;
  activeDbName: string;
  isDirty: boolean;
  canRollback: boolean;
  hasApiKey: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectTable: (tableName: string) => void;
  onRefreshSchema: () => void;
  onOpenUpload: () => void;
  onOpenApiKey?: () => void;
  onLoadSample: (sampleId: 'ecommerce' | 'saas') => void;
  onQuickPrompt: (prompt: string) => void;
  onRollback: () => void;
}

const TRENDING_PROMPTS = [
  { label: '🔥 Top Spenders', prompt: 'Show top 5 customers by total spending' },
  { label: '📈 Revenue by Category', prompt: 'Calculate total revenue grouped by category' },
  { label: '⚠️ Low Stock (<20)', prompt: 'List all products with stock quantity less than 20' },
  { label: '👑 VIP Customers', prompt: 'Find customers who placed more than 3 orders' },
  { label: '⚡ Highest Rated Items', prompt: 'Show products with rating 4.7 and above' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  activeDbName,
  isDirty,
  canRollback,
  hasApiKey: _hasApiKey,
  isCollapsed,
  onToggleCollapse,
  onSelectTable,
  onRefreshSchema,
  onOpenUpload,
  onOpenApiKey: _onOpenApiKey,
  onLoadSample,
  onQuickPrompt,
  onRollback,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleExpand = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRows = tables.reduce((acc, t) => acc + (t.rowCount || 0), 0);

  if (isCollapsed) {
    return (
      <aside className="studio-sidebar collapsed animate-fade" style={{ alignItems: 'center', padding: '16px 0' }}>
        <button
          onClick={onToggleCollapse}
          className="btn btn-ghost btn-sm"
          title="Expand Sidebar"
          style={{ marginBottom: '20px', padding: '8px' }}
        >
          <ArrowRightToLine size={16} color="var(--accent-light)" />
        </button>

        <div
          title={`Active DB: ${activeDbName}`}
          style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-bg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: '16px', cursor: 'pointer'
          }}
          onClick={onOpenUpload}
        >
          <Database size={16} color="var(--accent)" />
        </div>

        <div style={{ width: '28px', height: '1px', background: 'var(--border)', margin: '8px 0 16px' }} />

        {/* Mini Table Icons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {tables.slice(0, 6).map((t) => (
            <button
              key={t.name}
              onClick={() => onSelectTable(t.name)}
              title={`${t.name} (${t.rowCount} rows)`}
              className="btn btn-ghost btn-sm"
              style={{
                width: '36px', height: '36px', padding: 0,
                background: selectedTable === t.name ? 'var(--accent)' : 'transparent',
                color: selectedTable === t.name ? '#fff' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <TableIcon size={14} />
            </button>
          ))}
        </div>

        <div
          title="Gemini AI & SQLite Active"
          style={{ marginTop: 'auto', padding: '8px', display: 'flex', justifyContent: 'center' }}
        >
          <Sparkles size={16} color="var(--green-light)" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="studio-sidebar animate-fade">
      {/* ─── BRAND HEADER ─── */}
      <div style={{
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent) 0%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px var(--accent-glow)'
          }}>
            <Zap size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="font-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                BolDB
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                v2.0
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px' }}>
              AI Database Copilot
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="btn btn-ghost btn-xs"
          title="Collapse Sidebar"
          style={{ padding: '5px' }}
        >
          <ArrowLeftToLine size={14} />
        </button>
      </div>

      {/* ─── ACTIVE DATABASE CARD ─── */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <Database size={13} color="var(--cyan-light)" />
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '130px'
              }} title={activeDbName}>
                {activeDbName}
              </span>
            </div>
            {isDirty && (
              <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}>
                Modified
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>{tables.length} tables • {totalRows.toLocaleString()} rows</span>
            {canRollback && (
              <button
                onClick={onRollback}
                className="btn btn-xs btn-danger"
                style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                title="Rollback last mutation"
              >
                Undo
              </button>
            )}
          </div>

          {/* Sample DB Quick Switchers */}
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
            <button
              onClick={() => onLoadSample('ecommerce')}
              className="btn btn-xs btn-secondary"
              style={{ flex: 1, fontSize: '0.66rem', padding: '4px 6px' }}
              title="Load E-Commerce demo database"
            >
              🛒 E-Comm
            </button>
            <button
              onClick={() => onLoadSample('saas')}
              className="btn btn-xs btn-secondary"
              style={{ flex: 1, fontSize: '0.66rem', padding: '4px 6px' }}
              title="Load SaaS Metrics demo database"
            >
              🚀 SaaS
            </button>
            <button
              onClick={onOpenUpload}
              className="btn btn-xs btn-cyan"
              style={{ padding: '4px 7px' }}
              title="Import Excel, CSV, JSON, or SQLite"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── TABLES EXPLORER ─── */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)'
          }}>
            Explorer
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
            {tables.length}
          </span>
        </div>
        <button
          onClick={onRefreshSchema}
          className="btn btn-ghost btn-xs"
          title="Refresh Tables"
          style={{ padding: '3px' }}
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Table search */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={12} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Filter tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '28px', fontSize: '0.74rem', padding: '5px 8px 5px 28px' }}
          />
        </div>
      </div>

      {/* Tables list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filteredTables.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.76rem' }}>
            <TableIcon size={20} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p>No tables found</p>
            <button onClick={onOpenUpload} className="btn btn-sm btn-primary" style={{ marginTop: '8px', fontSize: '0.72rem' }}>
              <FolderUp size={12} /> Import Data
            </button>
          </div>
        ) : (
          filteredTables.map((t) => {
            const isSelected = selectedTable === t.name;
            const isExpanded = Boolean(expandedTables[t.name]);

            return (
              <div
                key={t.name}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--accent-bg)' : 'transparent',
                  border: isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => onSelectTable(t.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                    <button
                      onClick={(e) => toggleExpand(t.name, e)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    <TableIcon size={13} color={isSelected ? 'var(--accent-light)' : 'var(--text-muted)'} />
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#ffffff' : 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {t.name}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'var(--bg-elevated)',
                    color: isSelected ? 'var(--accent-light)' : 'var(--text-dim)',
                    fontWeight: 600,
                  }}>
                    {t.rowCount}
                  </span>
                </div>

                {/* Expanded columns preview */}
                {isExpanded && t.columns && (
                  <div style={{
                    padding: '4px 8px 8px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                    background: 'rgba(0, 0, 0, 0.15)'
                  }}>
                    {t.columns.map((c) => (
                      <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {Boolean(c.pk) && <Key size={9} color="var(--amber)" />}
                          <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                        </div>
                        <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                          {c.type}
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

      {/* ─── TRENDING AI PROMPTS ─── */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(14, 16, 23, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
          <Flame size={12} color="var(--pink-light)" />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            Quick Prompts
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {TRENDING_PROMPTS.slice(0, 4).map((p, idx) => (
            <button
              key={idx}
              onClick={() => onQuickPrompt(p.prompt)}
              className="btn btn-ghost btn-xs"
              style={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                padding: '4px 6px',
                borderRadius: 'var(--radius-xs)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(236, 72, 153, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)'
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 8px var(--green-glow)'
          }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Gemini 2.5 Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="mono" style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>
            WASM Live
          </span>
        </div>
      </div>
    </aside>
  );
};
