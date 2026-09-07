import React, { useState, useEffect, useCallback } from 'react';
import { sqliteService } from './services/sqliteService';
import { geminiService } from './services/geminiService';
import { SchemaDrawer } from './components/SchemaDrawer';
import { PromptBar } from './components/PromptBar';
import { QueryInspector } from './components/QueryInspector';
import { DataGrid } from './components/DataGrid';
import { Visualizer } from './components/Visualizer';
import { FileUploadModal } from './components/FileUploadModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MutationModal } from './components/MutationModal';
import type { TableSchema, QueryResult, DatabaseMetadata } from './types/database';
import {
  Database, Download, Key, RotateCcw, Upload, Layers,
  Table as TableIcon, BarChart2,
} from 'lucide-react';

export const App: React.FC = () => {
  const [metadata, setMetadata] = useState<DatabaseMetadata>(sqliteService.getMetadata());
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [canRollback, setCanRollback] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [currentSql, setCurrentSql] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isMutation, setIsMutation] = useState(false);
  const [suggestedChartType, setSuggestedChartType] = useState<'bar' | 'line' | 'pie' | 'none'>('none');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(geminiService.hasApiKey());
  const [pendingMutation, setPendingMutation] = useState<{ sql: string; explanation: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const refreshDb = useCallback(async () => {
    const schemas = await sqliteService.getSchema();
    setTables(schemas);
    setMetadata(sqliteService.getMetadata());
    setCanRollback(sqliteService.canRollback());
    if (schemas.length > 0 && !selectedTable) setSelectedTable(schemas[0].name);
  }, [selectedTable]);

  useEffect(() => {
    (async () => {
      await sqliteService.loadSample('ecommerce');
      await refreshDb();
      const schemas = await sqliteService.getSchema();
      if (schemas.length > 0) {
        setSelectedTable('products');
        const sql = 'SELECT * FROM products LIMIT 20;';
        setCurrentSql(sql);
        setExplanation('All products');
        setQueryResult(await sqliteService.executeQuery(sql));
      }
    })();
  }, []);

  const executeSql = async (sql: string, expl?: string) => {
    if (!sql.trim()) return;
    setIsExecuting(true);
    try {
      const res = await sqliteService.executeQuery(sql);
      setQueryResult(res);
      setCurrentSql(sql);
      if (expl) setExplanation(expl);
      if (res.isMutation) { await refreshDb(); showToast(`${res.affectedRows ?? 1} row(s) affected`, 'success'); }
    } catch (err: any) { showToast(err?.message, 'error'); }
    finally { setIsExecuting(false); }
  };

  const handlePrompt = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      const ctx = await sqliteService.getSchemaPromptContext();
      const ai = await geminiService.generateSql(prompt, ctx);
      setCurrentSql(ai.sql); setExplanation(ai.explanation);
      setIsMutation(ai.isMutation); setSuggestedChartType(ai.suggestedChartType || 'none');
      if (ai.isMutation) { setPendingMutation({ sql: ai.sql, explanation: ai.explanation }); }
      else {
        await executeSql(ai.sql, ai.explanation);
        setActiveTab(ai.suggestedChartType && ai.suggestedChartType !== 'none' ? 'chart' : 'table');
      }
    } catch (err: any) { showToast(err?.message, 'error'); }
    finally { setIsAiLoading(false); }
  };

  const handleAutoFix = async (failedSql: string, errorMsg: string) => {
    setIsAiLoading(true);
    try {
      const ctx = await sqliteService.getSchemaPromptContext();
      const fixed = await geminiService.fixSqlError(failedSql, errorMsg, ctx);
      setCurrentSql(fixed.sql); setExplanation(fixed.explanation); setIsMutation(fixed.isMutation);
      await executeSql(fixed.sql, fixed.explanation);
    } catch (err: any) { showToast(err?.message, 'error'); }
    finally { setIsAiLoading(false); }
  };

  const previewTable = async (name: string) => {
    setSelectedTable(name);
    setShowDrawer(false);
    const sql = `SELECT * FROM "${name}" LIMIT 50;`;
    setCurrentSql(sql); setExplanation(name); setIsMutation(false);
    setSuggestedChartType('none'); setActiveTab('table');
    await executeSql(sql, name);
  };

  const handleCellUpdate = async (pkCol: string, pkVal: any, col: string, val: any): Promise<boolean> => {
    if (!selectedTable) return false;
    const ok = await sqliteService.updateCell(selectedTable, pkCol, pkVal, col, val);
    if (ok) { await refreshDb(); showToast('Updated', 'success'); }
    return ok;
  };

  const handleDownload = () => {
    const binary = sqliteService.exportBinary();
    const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = metadata.name.endsWith('.sqlite') || metadata.name.endsWith('.db') ? metadata.name : `${metadata.name}.sqlite`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Downloaded', 'success');
  };

  const handleLoadSample = async (id: 'ecommerce' | 'saas') => {
    await sqliteService.loadSample(id); await refreshDb();
    const s = await sqliteService.getSchema();
    if (s.length > 0) previewTable(s[0].name);
  };

  return (
    <div className="app-shell">
      {/* ─── TOP BAR ─── */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Schema toggle */}
          <button onClick={() => setShowDrawer(!showDrawer)} className="btn btn-ghost btn-sm" title="Tables">
            <Layers size={15} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} color="var(--accent)" />
            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem' }}>BolDB</span>
          </div>

          <div style={{ height: '16px', width: '1px', background: 'var(--border)' }} />

          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{metadata.name}</span>
          {metadata.isDirty && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)' }} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => handleLoadSample('ecommerce')} className="btn btn-ghost btn-xs">E-Commerce</button>
          <button onClick={() => handleLoadSample('saas')} className="btn btn-ghost btn-xs">SaaS</button>

          <div style={{ height: '16px', width: '1px', background: 'var(--border)', margin: '0 4px' }} />

          {canRollback && (
            <button onClick={async () => { sqliteService.rollbackSnapshot(); await refreshDb(); if (selectedTable) previewTable(selectedTable); showToast('Reverted'); }} className="btn btn-ghost btn-sm" title="Undo">
              <RotateCcw size={13} />
            </button>
          )}
          <button onClick={() => setIsUploadOpen(true)} className="btn btn-ghost btn-sm" title="Upload">
            <Upload size={13} />
          </button>
          <button onClick={() => setIsApiKeyOpen(true)} className="btn btn-ghost btn-sm" style={{ gap: '4px' }} title="API Key">
            <Key size={13} />
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: hasApiKey ? 'var(--green)' : 'var(--amber)' }} />
          </button>
          <button onClick={handleDownload} className="btn btn-primary btn-sm" style={{ gap: '4px' }}>
            <Download size={13} /> Export
          </button>
        </div>
      </header>

      {/* ─── SCHEMA DRAWER ─── */}
      {showDrawer && (
        <SchemaDrawer
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={previewTable}
          onClose={() => setShowDrawer(false)}
          onRefresh={refreshDb}
        />
      )}

      {/* ─── MAIN WORKSPACE ─── */}
      <div className="workspace">
        <div className="workspace-inner">
          {/* Prompt */}
          <PromptBar onGenerate={handlePrompt} isLoading={isAiLoading} />

          {/* SQL Inspector */}
          {currentSql && (
            <QueryInspector
              currentSql={currentSql} explanation={explanation} isMutation={isMutation}
              result={queryResult} isRunning={isExecuting}
              onExecute={executeSql} onAutoFix={handleAutoFix}
            />
          )}

          {/* Tab bar */}
          {queryResult && queryResult.columns.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="pill-tabs">
                <button className={`pill-tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
                  <TableIcon size={12} /> Table
                  <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{queryResult.rowCount}</span>
                </button>
                <button className={`pill-tab ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>
                  <BarChart2 size={12} /> Chart
                </button>
              </div>
              {selectedTable && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedTable}</span>}
            </div>
          )}

          {/* Results */}
          {activeTab === 'table' ? (
            <DataGrid result={queryResult} activeTable={selectedTable} onCellUpdate={handleCellUpdate} />
          ) : (
            <Visualizer result={queryResult} suggestedType={suggestedChartType} />
          )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)}
        onUploadDatabase={async (buf, name) => { await sqliteService.loadFromBuffer(buf, name); await refreshDb(); const s = await sqliteService.getSchema(); if (s.length > 0) previewTable(s[0].name); }}
        onUploadCsv={async (name, csv) => { const t = await sqliteService.importCsv(name, csv); await refreshDb(); previewTable(t); }}
        onLoadSample={handleLoadSample}
        onCreateEmpty={async () => { await sqliteService.createEmpty(); await refreshDb(); }}
      />
      <ApiKeyModal isOpen={isApiKeyOpen} onClose={() => setIsApiKeyOpen(false)} onKeySaved={() => setHasApiKey(geminiService.hasApiKey())} />
      {pendingMutation && (
        <MutationModal isOpen sql={pendingMutation.sql} explanation={pendingMutation.explanation}
          onConfirm={async () => { const s = pendingMutation.sql; const e = pendingMutation.explanation; setPendingMutation(null); await executeSql(s, e); }}
          onCancel={() => setPendingMutation(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-slide-up" style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          padding: '8px 18px', borderRadius: 'var(--radius-full)',
          background: toast.type === 'error' ? 'var(--red-bg)' : toast.type === 'success' ? 'var(--green-bg)' : 'var(--bg-elevated)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.2)' : toast.type === 'success' ? 'rgba(52,211,153,0.2)' : 'var(--border)'}`,
          color: toast.type === 'error' ? 'var(--red)' : toast.type === 'success' ? 'var(--green)' : 'var(--text-secondary)',
          fontSize: '0.78rem', zIndex: 999,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;
