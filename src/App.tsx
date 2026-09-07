import React, { useState, useEffect, useCallback } from 'react';
import { sqliteService } from './services/sqliteService';
import { geminiService } from './services/geminiService';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { PromptBar } from './components/PromptBar';
import { QueryInspector } from './components/QueryInspector';
import { DataGrid } from './components/DataGrid';
import { Visualizer } from './components/Visualizer';
import { SchemaView } from './components/SchemaView';
import { FileUploadModal } from './components/FileUploadModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MutationModal } from './components/MutationModal';
import type { TableSchema, QueryResult, DatabaseMetadata } from './types/database';
import {
  Database, Download, Key, RotateCcw, Upload, Table as TableIcon,
  BarChart2, ChevronRight, Layers, ArrowLeft, User
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation View: 'landing' or 'studio'
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');

  // User State (Mock Authentication)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('boldb_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Database & Studio States
  const [metadata, setMetadata] = useState<DatabaseMetadata>(sqliteService.getMetadata());
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [canRollback, setCanRollback] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'schema'>('table');
  const [currentSql, setCurrentSql] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isMutation, setIsMutation] = useState(false);
  const [suggestedChartType, setSuggestedChartType] = useState<'bar' | 'line' | 'pie' | 'none'>('none');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(geminiService.hasApiKey());
  const [pendingMutation, setPendingMutation] = useState<{ sql: string; explanation: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [activePromptText, setActivePromptText] = useState('');

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleLoginSuccess = (user: { name: string; email: string }) => {
    setCurrentUser(user);
    localStorage.setItem('boldb_user', JSON.stringify(user));
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('boldb_user');
    showToast('Signed out successfully', 'info');
  };

  const refreshDb = useCallback(async () => {
    const schemas = await sqliteService.getSchema();
    setTables(schemas);
    setMetadata(sqliteService.getMetadata());
    setCanRollback(sqliteService.canRollback());
    if (schemas.length > 0 && !selectedTable) {
      setSelectedTable(schemas[0].name);
    }
  }, [selectedTable]);

  useEffect(() => {
    (async () => {
      await sqliteService.loadSample('ecommerce');
      await refreshDb();
      const schemas = await sqliteService.getSchema();
      if (schemas.length > 0) {
        setSelectedTable('products');
        const sql = 'SELECT * FROM products LIMIT 25;';
        setCurrentSql(sql);
        setExplanation('Showing products from loaded E-Commerce store');
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
      if (res.isMutation) {
        await refreshDb();
        showToast(`${res.affectedRows ?? 1} row(s) updated successfully`, 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Query execution failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePrompt = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      const ctx = await sqliteService.getSchemaPromptContext();
      const ai = await geminiService.generateSql(prompt, ctx);
      setCurrentSql(ai.sql);
      setExplanation(ai.explanation);
      setIsMutation(ai.isMutation);
      setSuggestedChartType(ai.suggestedChartType || 'none');

      if (ai.isMutation) {
        setPendingMutation({ sql: ai.sql, explanation: ai.explanation });
      } else {
        await executeSql(ai.sql, ai.explanation);
        if (ai.suggestedChartType && ai.suggestedChartType !== 'none') {
          setActiveTab('chart');
        } else {
          setActiveTab('table');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'AI generation failed', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAutoFix = async (failedSql: string, errorMsg: string) => {
    setIsAiLoading(true);
    try {
      const ctx = await sqliteService.getSchemaPromptContext();
      const fixed = await geminiService.fixSqlError(failedSql, errorMsg, ctx);
      setCurrentSql(fixed.sql);
      setExplanation(fixed.explanation);
      setIsMutation(fixed.isMutation);
      await executeSql(fixed.sql, fixed.explanation);
      showToast('Query fixed and executed successfully', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Auto-fix failed', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const previewTable = async (name: string) => {
    setSelectedTable(name);
    const sql = `SELECT * FROM "${name}" LIMIT 50;`;
    setCurrentSql(sql);
    setExplanation(`Browsing table "${name}"`);
    setIsMutation(false);
    setSuggestedChartType('none');
    await executeSql(sql, `Browsing table "${name}"`);
  };

  const handleCellUpdate = async (pkCol: string, pkVal: any, col: string, val: any): Promise<boolean> => {
    if (!selectedTable) return false;
    const ok = await sqliteService.updateCell(selectedTable, pkCol, pkVal, col, val);
    if (ok) {
      await refreshDb();
      showToast('Record updated successfully', 'success');
    }
    return ok;
  };

  const handleDownload = () => {
    const binary = sqliteService.exportBinary();
    const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.name.endsWith('.sqlite') || metadata.name.endsWith('.db') ? metadata.name : `${metadata.name}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database exported', 'success');
  };

  const handleUploadFile = async (file: File) => {
    try {
      const result = await sqliteService.importAnyFile(file);
      await refreshDb();
      if (result.tables && result.tables.length > 0) {
        previewTable(result.tables[0]);
      }
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to import file', 'error');
      throw err;
    }
  };

  const handleLoadSample = async (id: 'ecommerce' | 'saas') => {
    await sqliteService.loadSample(id);
    await refreshDb();
    const s = await sqliteService.getSchema();
    if (s.length > 0) previewTable(s[0].name);
    showToast(`Loaded ${id === 'ecommerce' ? 'E-Commerce' : 'SaaS'} demo database`, 'info');
  };

  const handleRollback = async () => {
    const ok = sqliteService.rollbackSnapshot();
    if (ok) {
      await refreshDb();
      if (selectedTable) previewTable(selectedTable);
      showToast('Changes reverted to previous snapshot', 'info');
    }
  };

  const selectedTableSchema = tables.find((t) => t.name === selectedTable) || null;

  // Render Landing Page if in landing view
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchStudio={() => setCurrentView('studio')}
          onOpenSignIn={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
          onOpenSignUp={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
          user={currentUser}
          onSignOut={handleSignOut}
        />

        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(user) => {
            handleLoginSuccess(user);
            setCurrentView('studio');
          }}
        />

        {toast && (
          <div className="animate-slide-up" style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            padding: '10px 20px', borderRadius: 'var(--radius-full)',
            background: toast.type === 'error' ? 'var(--red-bg)' : toast.type === 'success' ? 'var(--green-bg)' : 'var(--bg-elevated)',
            border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.3)' : toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            color: toast.type === 'error' ? 'var(--red)' : toast.type === 'success' ? 'var(--green-light)' : '#ffffff',
            boxShadow: 'var(--shadow-lg)', fontSize: '0.8rem', fontWeight: 600, zIndex: 9999,
          }}>
            {toast.msg}
          </div>
        )}
      </>
    );
  }

  // Render Studio Workspace View
  return (
    <div className="app-shell">
      {/* ─── STUDIO SIDEBAR ─── */}
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        activeDbName={metadata.name}
        isDirty={metadata.isDirty}
        canRollback={canRollback}
        hasApiKey={hasApiKey}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onSelectTable={previewTable}
        onRefreshSchema={refreshDb}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onLoadSample={handleLoadSample}
        onQuickPrompt={(p) => {
          setActivePromptText(p);
          handlePrompt(p);
        }}
        onRollback={handleRollback}
      />

      {/* ─── MAIN STUDIO WORKSPACE ─── */}
      <div className="studio-main">
        {/* ─── TOPBAR ─── */}
        <header className="studio-topbar">
          {/* Breadcrumb Navigation & Return to Landing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <button
              onClick={() => setCurrentView('landing')}
              className="btn btn-ghost btn-xs"
              style={{ gap: '5px', padding: '4px 8px' }}
              title="Return to Landing Page"
            >
              <ArrowLeft size={13} />
              <span>Landing</span>
            </button>

            <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={15} color="var(--accent-light)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {metadata.name}
              </span>
            </div>

            {selectedTable && (
              <>
                <ChevronRight size={13} color="var(--text-dim)" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TableIcon size={14} color="var(--cyan-light)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    {selectedTable}
                  </span>
                  {selectedTableSchema && (
                    <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                      {selectedTableSchema.rowCount} rows
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)'
                }}>
                  <User size={12} color="var(--accent-light)" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#fff' }}>{currentUser.name}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.76rem' }}
              >
                Sign In
              </button>
            )}

            {canRollback && (
              <button
                onClick={handleRollback}
                className="btn btn-secondary btn-sm"
                title="Undo last change"
                style={{ gap: '5px' }}
              >
                <RotateCcw size={13} color="var(--amber)" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
              title="Import Excel, CSV, JSON, or SQL"
            >
              <Upload size={13} color="var(--cyan-light)" />
              <span>Import</span>
            </button>

            <button
              onClick={() => setIsApiKeyOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
              title={hasApiKey ? 'Gemini AI: Connected' : 'Gemini AI: Needs Key'}
            >
              <Key size={13} color="var(--accent-light)" />
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: hasApiKey ? 'var(--green)' : 'var(--amber)',
                boxShadow: hasApiKey ? '0 0 6px var(--green-glow)' : 'none'
              }} />
              <span>AI Engine</span>
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Download size={13} />
              <span>Export DB</span>
            </button>
          </div>
        </header>

        {/* ─── SCROLLABLE WORKSPACE ─── */}
        <div className="workspace-scroll">
          <div className="workspace-content">
            {/* Natural Language AI Prompt Bar */}
            <PromptBar
              onGenerate={handlePrompt}
              isLoading={isAiLoading}
              externalPrompt={activePromptText}
            />

            {/* SQL Studio HUD */}
            {currentSql && (
              <QueryInspector
                currentSql={currentSql}
                explanation={explanation}
                isMutation={isMutation}
                result={queryResult}
                isRunning={isExecuting}
                onExecute={executeSql}
                onAutoFix={handleAutoFix}
              />
            )}

            {/* View Switcher Dock */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '4px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div className="pill-tabs">
                <button
                  className={`pill-tab ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  <TableIcon size={13} />
                  <span>Data Grid</span>
                  {queryResult && queryResult.columns.length > 0 && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: activeTab === 'table' ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                      color: activeTab === 'table' ? '#ffffff' : 'var(--text-dim)',
                    }}>
                      {queryResult.rowCount}
                    </span>
                  )}
                </button>

                <button
                  className={`pill-tab ${activeTab === 'chart' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chart')}
                >
                  <BarChart2 size={13} />
                  <span>Visualizer</span>
                  {suggestedChartType && suggestedChartType !== 'none' && (
                    <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan-light)' }} />
                  )}
                </button>

                <button
                  className={`pill-tab ${activeTab === 'schema' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schema')}
                >
                  <Layers size={13} />
                  <span>Schema & DDL</span>
                </button>
              </div>

              {selectedTable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  <span>Active Table:</span>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{selectedTable}</span>
                </div>
              )}
            </div>

            {/* Active View Container */}
            {activeTab === 'table' ? (
              <DataGrid
                result={queryResult}
                activeTable={selectedTable}
                onCellUpdate={handleCellUpdate}
              />
            ) : activeTab === 'chart' ? (
              <Visualizer
                result={queryResult}
                suggestedType={suggestedChartType}
              />
            ) : (
              <SchemaView
                tableSchema={selectedTableSchema}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadFile={handleUploadFile}
        onLoadSample={handleLoadSample}
        onCreateEmpty={async () => {
          await sqliteService.createEmpty();
          await refreshDb();
          setQueryResult(null);
          setSelectedTable(null);
          setCurrentSql('');
          showToast('Created clean SQLite database', 'info');
        }}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onKeySaved={() => setHasApiKey(geminiService.hasApiKey())}
      />

      {pendingMutation && (
        <MutationModal
          isOpen
          sql={pendingMutation.sql}
          explanation={pendingMutation.explanation}
          onConfirm={async () => {
            const s = pendingMutation.sql;
            const e = pendingMutation.explanation;
            setPendingMutation(null);
            await executeSql(s, e);
          }}
          onCancel={() => setPendingMutation(null)}
        />
      )}

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="animate-slide-up" style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: 'var(--radius-full)',
          background: toast.type === 'error' ? 'var(--red-bg)' : toast.type === 'success' ? 'var(--green-bg)' : 'var(--bg-elevated)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(244,63,94,0.3)' : toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
          color: toast.type === 'error' ? 'var(--red)' : toast.type === 'success' ? 'var(--green-light)' : '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.8rem',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;
