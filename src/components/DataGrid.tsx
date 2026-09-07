import React, { useState, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Search, Edit3, Check, X, FileSpreadsheet } from 'lucide-react';
import type { QueryResult } from '../types/database';

interface DataGridProps {
  result: QueryResult | null;
  activeTable?: string | null;
  onCellUpdate?: (pkCol: string, pkVal: any, col: string, newVal: any) => Promise<boolean>;
}

export const DataGrid: React.FC<DataGridProps> = ({
  result,
  onCellUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Cell editing state
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number; val: any } | null>(null);

  if (!result || result.columns.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
        <FileSpreadsheet size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <h4 style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          No query results to display yet
        </h4>
        <p style={{ fontSize: '0.85rem' }}>
          Type a request in natural language above or select a table from the sidebar to inspect data.
        </p>
      </div>
    );
  }

  // Detect Primary Key column if activeTable is set (usually 'id')
  const pkColIndex = result.columns.findIndex((c) => c.toLowerCase() === 'id' || c.toLowerCase().endsWith('_id'));

  // Filter rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return result.values;
    const term = searchTerm.toLowerCase();
    return result.values.filter((row) =>
      row.some((val) => String(val ?? '').toLowerCase().includes(term))
    );
  }, [result.values, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    const colIdx = result.columns.indexOf(sortCol);
    if (colIdx === -1) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const valA = a[colIdx];
      const valB = b[colIdx];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRows, sortCol, sortAsc, result.columns]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const displayedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    const headers = result.columns.map((c) => `"${c}"`).join(',');
    const rows = result.values.map((r) =>
      r.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `boldb_query_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveCellEdit = async () => {
    if (!editingCell || !onCellUpdate || pkColIndex === -1) {
      setEditingCell(null);
      return;
    }

    const row = displayedRows[editingCell.rowIdx];
    const pkVal = row[pkColIndex];
    const pkCol = result.columns[pkColIndex];
    const targetCol = result.columns[editingCell.colIdx];

    const success = await onCellUpdate(pkCol, pkVal, targetCol, editingCell.val);
    if (success) {
      row[editingCell.colIdx] = editingCell.val;
    }
    setEditingCell(null);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Grid Toolbar */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-text"
              style={{ paddingLeft: '30px', padding: '6px 12px 6px 30px', fontSize: '0.8rem', width: '200px' }}
            />
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Showing {filteredRows.length} of {result.rowCount} rows
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', fontSize: '0.75rem' }}
            title="Export query results to CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto', maxHeight: '520px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>#</th>
              {result.columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{col}</span>
                    <ArrowUpDown size={11} color={sortCol === col ? 'var(--cyan-400)' : 'var(--text-dim)'} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={result.columns.length + 1} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              displayedRows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    {(currentPage - 1) * pageSize + rowIdx + 1}
                  </td>
                  {row.map((val, colIdx) => {
                    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx;

                    return (
                      <td
                        key={colIdx}
                        onDoubleClick={() => {
                          if (onCellUpdate && pkColIndex !== -1) {
                            setEditingCell({ rowIdx, colIdx, val });
                          }
                        }}
                        style={{ position: 'relative' }}
                      >
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              autoFocus
                              value={editingCell.val ?? ''}
                              onChange={(e) => setEditingCell({ ...editingCell, val: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveCellEdit();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="input-text"
                              style={{ padding: '2px 6px', fontSize: '0.8rem', height: '26px' }}
                            />
                            <button onClick={saveCellEdit} className="btn btn-ghost btn-sm" style={{ padding: '2px' }}>
                              <Check size={12} color="var(--emerald-400)" />
                            </button>
                            <button onClick={() => setEditingCell(null)} className="btn btn-ghost btn-sm" style={{ padding: '2px' }}>
                              <X size={12} color="var(--rose-400)" />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span
                              style={{
                                color: val === null ? 'var(--text-dim)' : 'var(--text-main)',
                                fontStyle: val === null ? 'italic' : 'normal',
                              }}
                            >
                              {val === null ? 'NULL' : String(val)}
                            </span>
                            {onCellUpdate && pkColIndex !== -1 && (
                              <button
                                onClick={() => setEditingCell({ rowIdx, colIdx, val })}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '1px 3px', opacity: 0.3, transition: 'opacity 0.15s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.3')}
                                title="Edit cell directly"
                              >
                                <Edit3 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              padding: '2px 6px',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--text-dim)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px', opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px', opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
