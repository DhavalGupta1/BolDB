import React, { useState, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Search, Check, X, Edit3, Database, Filter } from 'lucide-react';
import type { QueryResult } from '../types/database';

interface DataGridProps {
  result: QueryResult | null;
  activeTable?: string | null;
  onCellUpdate?: (pkCol: string, pkVal: any, col: string, newVal: any) => Promise<boolean>;
}

export const DataGrid: React.FC<DataGridProps> = ({ result, onCellUpdate }) => {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editCell, setEditCell] = useState<{ r: number; c: number; v: any } | null>(null);

  const filtered = useMemo(() => {
    if (!result?.values) return [];
    if (!search.trim()) return result.values;
    const t = search.toLowerCase();
    return result.values.filter((row) =>
      row.some((v) => String(v ?? '').toLowerCase().includes(t))
    );
  }, [result, search]);

  const sorted = useMemo(() => {
    if (!result?.columns || !sortCol) return filtered;
    const idx = result.columns.indexOf(sortCol);
    if (idx === -1) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[idx], vb = b[idx];
      if (va === vb) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [result, filtered, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const rows = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  if (!result || result.columns.length === 0) {
    return (
      <div style={{
        padding: '70px 20px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #e4e4e7',
        color: '#71717a'
      }}>
        <Database size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#09090b' }}>No Records to Display</p>
        <p style={{ fontSize: '0.78rem', color: '#71717a', marginTop: '4px' }}>
          Select a table from the sidebar or enter a prompt above to view data
        </p>
      </div>
    );
  }

  const pkIdx = result.columns.findIndex(
    (c) => c.toLowerCase() === 'id' || c.toLowerCase().endsWith('_id')
  );

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const exportCsv = () => {
    const h = result.columns.map((c) => `"${c}"`).join(',');
    const r = result.values.map((row) =>
      row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[h, ...r].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boldb_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const saveCell = async () => {
    if (!editCell || !onCellUpdate || pkIdx === -1) {
      setEditCell(null);
      return;
    }
    const row = rows[editCell.r];
    const ok = await onCellUpdate(
      result.columns[pkIdx],
      row[pkIdx],
      result.columns[editCell.c],
      editCell.v
    );
    if (ok) row[editCell.c] = editCell.v;
    setEditCell(null);
  };

  return (
    <div className="data-table-container animate-slide-up">
      {/* Table Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#fafafa',
        borderBottom: '1px solid #e4e4e7',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Search & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#a1a1aa" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="input"
              placeholder="Search in records..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '30px', fontSize: '0.78rem', width: '210px', padding: '5px 10px 5px 30px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-purple mono" style={{ fontSize: '0.68rem' }}>
              {filtered.length} row{filtered.length === 1 ? '' : 's'}
            </span>
            {search && (
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                (filtered from {result.values.length})
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onCellUpdate && pkIdx !== -1 && (
            <span style={{ fontSize: '0.7rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Edit3 size={11} /> Double-click cell to edit
            </span>
          )}

          <button onClick={exportCsv} className="btn btn-secondary btn-xs" style={{ gap: '4px' }}>
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Grid Scrollable Area */}
      <div style={{ overflowX: 'auto', maxHeight: '560px', background: '#ffffff' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>#</th>
              {result.columns.map((col) => {
                const isSorted = sortCol === col;
                return (
                  <th key={col} onClick={() => toggleSort(col)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ color: isSorted ? '#000000' : 'inherit', fontWeight: isSorted ? 700 : 600 }}>
                        {col}
                      </span>
                      <ArrowUpDown
                        size={10}
                        color={isSorted ? '#000000' : '#a1a1aa'}
                        style={{ transform: isSorted && !sortAsc ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={result.columns.length + 1} style={{ textAlign: 'center', padding: '36px', color: '#71717a' }}>
                  <Filter size={20} style={{ margin: '0 auto 6px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.8rem' }}>No rows matched your search filter</p>
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => {
                const globalRowIndex = (page - 1) * pageSize + ri + 1;
                return (
                  <tr key={ri}>
                    <td style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '0.72rem', userSelect: 'none' }}>
                      {globalRowIndex}
                    </td>
                    {row.map((val, ci) => {
                      const isEditing = editCell?.r === ri && editCell?.c === ci;
                      const isPk = ci === pkIdx;

                      return (
                        <td
                          key={ci}
                          onDoubleClick={() => {
                            if (onCellUpdate && pkIdx !== -1 && !isPk) {
                              setEditCell({ r: ri, c: ci, v: val });
                            }
                          }}
                          style={{
                            cursor: onCellUpdate && pkIdx !== -1 && !isPk ? 'cell' : 'default',
                            background: isEditing ? '#f4f4f5' : 'transparent',
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                autoFocus
                                value={editCell.v ?? ''}
                                onChange={(e) => setEditCell({ ...editCell, v: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveCell();
                                  if (e.key === 'Escape') setEditCell(null);
                                }}
                                className="input"
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '0.78rem',
                                  height: '26px',
                                  minWidth: '120px',
                                  borderColor: '#09090b',
                                }}
                              />
                              <button onClick={saveCell} className="btn btn-ghost btn-xs" style={{ padding: '2px' }} title="Save">
                                <Check size={12} color="#16a34a" />
                              </button>
                              <button onClick={() => setEditCell(null)} className="btn btn-ghost btn-xs" style={{ padding: '2px' }} title="Cancel">
                                <X size={12} color="#b91c1c" />
                              </button>
                            </div>
                          ) : (
                            <span style={{
                              color: val === null ? '#a1a1aa' : '#09090b',
                              fontStyle: val === null ? 'italic' : 'normal',
                              fontWeight: isPk ? 600 : 400,
                              fontSize: '0.82rem',
                            }}>
                              {val === null ? 'NULL' : String(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#fafafa',
        borderTop: '1px solid #e4e4e7',
        fontSize: '0.75rem',
        color: '#71717a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>
            Page <strong style={{ color: '#09090b' }}>{page}</strong> of <strong style={{ color: '#09090b' }}>{totalPages}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#a1a1aa', fontSize: '0.7rem' }}>Show:</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => { setPageSize(size); setPage(1); }}
                className="btn btn-ghost btn-xs"
                style={{
                  padding: '2px 7px',
                  fontSize: '0.7rem',
                  background: pageSize === size ? '#09090b' : 'transparent',
                  color: pageSize === size ? '#ffffff' : '#71717a',
                  borderRadius: 'var(--radius-xs)',
                  fontWeight: pageSize === size ? 600 : 500,
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-xs"
            style={{ padding: '4px 10px' }}
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-xs"
            style={{ padding: '4px 10px' }}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
