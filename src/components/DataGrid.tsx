import React, { useState, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Search, Check, X } from 'lucide-react';
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
  const pageSize = 25;
  const [editCell, setEditCell] = useState<{ r: number; c: number; v: any } | null>(null);

  const filtered = useMemo(() => {
    if (!result?.values) return [];
    if (!search.trim()) return result.values;
    const t = search.toLowerCase();
    return result.values.filter((row) => row.some((v) => String(v ?? '').toLowerCase().includes(t)));
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
      if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va;
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }, [result, filtered, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const rows = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page]);

  if (!result || result.columns.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
        Run a query to see results
      </div>
    );
  }

  const pkIdx = result.columns.findIndex((c) => c.toLowerCase() === 'id' || c.toLowerCase().endsWith('_id'));

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const exportCsv = () => {
    const h = result.columns.map((c) => `"${c}"`).join(',');
    const r = result.values.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[h, ...r].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `export_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const saveCell = async () => {
    if (!editCell || !onCellUpdate || pkIdx === -1) { setEditCell(null); return; }
    const row = rows[editCell.r];
    const ok = await onCellUpdate(result.columns[pkIdx], row[pkIdx], result.columns[editCell.c], editCell.v);
    if (ok) row[editCell.c] = editCell.v;
    setEditCell(null);
  };

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} color="var(--text-dim)" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="input" placeholder="Filter..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '26px', fontSize: '0.72rem', width: '160px', padding: '4px 8px 4px 26px' }}
            />
          </div>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{filtered.length} rows</span>
        </div>
        <button onClick={exportCsv} className="btn btn-ghost btn-xs" style={{ gap: '3px' }}>
          <Download size={11} /> CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {result.columns.map((col) => (
                <th key={col} onClick={() => toggleSort(col)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {col}
                    <ArrowUpDown size={9} color={sortCol === col ? 'var(--accent-light)' : 'var(--text-dim)'} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={result.columns.length} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>No rows</td></tr>
            ) : rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((val, ci) => {
                  const isEd = editCell?.r === ri && editCell?.c === ci;
                  return (
                    <td key={ci} onDoubleClick={() => { if (onCellUpdate && pkIdx !== -1) setEditCell({ r: ri, c: ci, v: val }); }}>
                      {isEd ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <input autoFocus value={editCell.v ?? ''} onChange={(e) => setEditCell({ ...editCell, v: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveCell(); if (e.key === 'Escape') setEditCell(null); }}
                            className="input" style={{ padding: '1px 4px', fontSize: '0.78rem', height: '22px', width: '90px' }}
                          />
                          <button onClick={saveCell} className="btn btn-ghost btn-xs" style={{ padding: '1px' }}><Check size={10} color="var(--green)" /></button>
                          <button onClick={() => setEditCell(null)} className="btn btn-ghost btn-xs" style={{ padding: '1px' }}><X size={10} color="var(--red)" /></button>
                        </div>
                      ) : (
                        <span style={{
                          color: val === null ? 'var(--text-dim)' : 'var(--text)',
                          fontStyle: val === null ? 'italic' : 'normal', fontSize: '0.78rem',
                        }}>
                          {val === null ? 'NULL' : String(val)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '6px 12px', borderTop: '1px solid var(--border)',
        gap: '6px',
      }}>
        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{page}/{totalPages}</span>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-xs"><ChevronLeft size={12} /></button>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-xs"><ChevronRight size={12} /></button>
      </div>
    </div>
  );
};
