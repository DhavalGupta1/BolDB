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
import { MutationModal } from './components/MutationModal';
import { UserAccountMenu } from './components/UserAccountMenu';
import { authService, type UserAccount } from './services/authService';
import type { TableSchema, QueryResult, DatabaseMetadata } from './types/database';
import {
  Database, Download, RotateCcw, Upload, Table as TableIcon,
  BarChart2, ChevronRight, Layers, ArrowLeft
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation View: 'landing' or 'studio'
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');

  // User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return authService.getCurrentUser();
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
  const [hasApiKey] = useState(geminiService.hasApiKey());
  const [pendingMutation, setPendingMutation] = useState<{ sql: string; explanation: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [activePromptText, setActivePromptText] = useState('');

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    authService.setCurrentUser(user);
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleSignOut = () => {
    authService.signOut();
    setCurrentUser(null);
    showToast('Signed out successfully', 'info');
  };

  const handleSwitchAccount = (user: UserAccount) => {
    authService.setCurrentUser(user);
    setCurrentUser(user);
    showToast(`Switched account to ${user.name}`, 'success');
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
    setPromptError(null);
    setIsAiLoading(true);
    try {
      const ctx = await sqliteService.getSchemaPromptContext();
      const ai = await geminiService.generateSql(prompt, ctx);

      if (ai.isValid === false || !ai.sql || !ai.sql.trim()) {
        const errorMsg = ai.explanation || 'Please input valid text or a query related to the database.';
        setPromptError(errorMsg);
        showToast(errorMsg, 'warning');
        return;
      }

      setPromptError(null);
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
      const msg = err?.message || 'Failed to generate query.';
      setPromptError(msg);
      showToast(msg, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAutoFix = async (failedSql: string, errorMsg: string) => {
    setIsAiLoading(true);
    try {
      const ctx = await sqliteService.getSchemaPromptContext();
      const ai = await geminiService.fixSqlError(failedSql, errorMsg, ctx);

      if (ai.isValid === false || !ai.sql || !ai.sql.trim()) {
        showToast(ai.explanation || 'Could not auto-fix query', 'error');
        return;
      }

      setCurrentSql(ai.sql);
      setExplanation(ai.explanation);
      setIsMutation(ai.isMutation);
      setSuggestedChartType(ai.suggestedChartType || 'none');

      if (ai.isMutation) {
        setPendingMutation({ sql: ai.sql, explanation: ai.explanation });
      } else {
        await executeSql(ai.sql, ai.explanation);
        showToast('Query auto-fixed and executed!', 'success');
      }
    } catch (e: any) {
      showToast(e?.message || 'Auto-fix failed', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const previewTable = async (tableName: string) => {
    setSelectedTable(tableName);
    const sql = `SELECT * FROM "${tableName}" LIMIT 50;`;
    setCurrentSql(sql);
    setExplanation(`Previewing rows from table "${tableName}"`);
    setActiveTab('table');
    await executeSql(sql);
  };

  const handleRollback = async () => {
    const ok = sqliteService.rollbackSnapshot();
    if (ok) {
      await refreshDb();
      if (selectedTable) {
        await previewTable(selectedTable);
      }
      showToast('Database rolled back to prior snapshot', 'info');
    } else {
      showToast('No prior snapshot found to rollback', 'warning');
    }
  };

  const handleUploadFile = async (file: File) => {
    const res = await sqliteService.importAnyFile(file);
    await refreshDb();
    if (res.tables.length > 0) {
      const first = res.tables[0];
      await previewTable(first);
      showToast(`Successfully imported: ${res.tables.join(', ')}`, 'success');
    }
  };

  const handleLoadSample = async (sampleId: 'ecommerce' | 'saas') => {
    await sqliteService.loadSample(sampleId);
    await refreshDb();
    const schemas = await sqliteService.getSchema();
    if (schemas.length > 0) {
      const table = sampleId === 'ecommerce' ? 'products' : schemas[0].name;
      await previewTable(table);
      showToast(`Loaded ${sampleId.toUpperCase()} sample dataset`, 'success');
    }
  };

  const handleDownload = () => {
    const data = sqliteService.exportBinary();
    const blob = new Blob([data as unknown as BlobPart], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.name.endsWith('.db') || metadata.name.endsWith('.sqlite') ? metadata.name : `${metadata.name}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Database exported successfully', 'success');
  };

  const handleCellUpdate = async (pkCol: string, pkVal: any, col: string, newVal: any) => {
    if (!selectedTable) return false;
    const formattedVal = typeof newVal === 'number' ? newVal : `'${String(newVal).replace(/'/g, "''")}'`;
    const formattedPk = typeof pkVal === 'number' ? pkVal : `'${String(pkVal).replace(/'/g, "''")}'`;
    const sql = `UPDATE "${selectedTable}" SET "${col}" = ${formattedVal} WHERE "${pkCol}" = ${formattedPk};`;
    try {
      await executeSql(sql, `Updated ${col} in ${selectedTable}`);
      return true;
    } catch {
      return false;
    }
  };

  const selectedTableSchema = tables.find((t) => t.name === selectedTable) || null;

  // Render Landing Page View
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchStudio={() => setCurrentView('studio')}
          onOpenSignIn={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
          onOpenSignUp={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
          user={currentUser}
          onSignOut={handleSignOut}
          onSwitchAccount={handleSwitchAccount}
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
            background: '#09090b', border: '1px solid #27272a',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)', fontSize: '0.82rem', fontWeight: 500, zIndex: 9999,
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
              style={{ gap: '5px', padding: '4px 8px', color: '#52525b' }}
              title="Return to Landing Page"
            >
              <ArrowLeft size={13} />
              <span>Landing</span>
            </button>

            <div style={{ width: '1px', height: '16px', background: '#e4e4e7' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={15} color="#09090b" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#52525b' }}>
                {metadata.name}
              </span>
            </div>

            {selectedTable && (
              <>
                <ChevronRight size={13} color="#a1a1aa" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TableIcon size={14} color="#09090b" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#09090b' }}>
                    {selectedTable}
                  </span>
                  {selectedTableSchema && (
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
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
              <UserAccountMenu
                user={currentUser}
                onSignOut={handleSignOut}
                onSwitchAccount={handleSwitchAccount}
                onAddAccount={() => { setAuthMode('signup'); setIsAuthOpen(true); }}
              />
            ) : (
              <button
                onClick={() => { setAuthMode('signin'); setIsAuthOpen(true); }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.78rem', color: '#52525b' }}
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
                <RotateCcw size={13} color="#09090b" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
              title="Import Excel, CSV, JSON, or SQL"
            >
              <Upload size={13} color="#09090b" />
              <span>Import</span>
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
              errorMessage={promptError}
              onClearError={() => setPromptError(null)}
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
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: activeTab === 'table' ? '#27272a' : '#f4f4f5',
                      color: activeTab === 'table' ? '#ffffff' : '#71717a',
                      fontWeight: 600,
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
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeTab === 'chart' ? '#ffffff' : '#09090b' }} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#71717a' }}>
                  <span>Active Table:</span>
                  <span style={{ color: '#09090b', fontWeight: 700 }}>{selectedTable}</span>
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
          setPromptError(null);
          showToast('Created clean SQLite database', 'info');
        }}
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
          background: '#09090b',
          border: '1px solid #27272a',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.82rem',
          fontWeight: 500,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : toast.type === 'warning' ? '⚠' : 'ℹ'} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;
