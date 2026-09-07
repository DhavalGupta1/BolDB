import React, { useState, useEffect, useCallback } from 'react';
import { sqliteService } from './services/sqliteService';
import { geminiService } from './services/geminiService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PromptBar } from './components/PromptBar';
import { QueryInspector } from './components/QueryInspector';
import { DataGrid } from './components/DataGrid';
import { Visualizer } from './components/Visualizer';
import { FileUploadModal } from './components/FileUploadModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MutationModal } from './components/MutationModal';
import type { TableSchema, QueryResult, DatabaseMetadata } from './types/database';
import { Table, BarChart2, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Database state
  const [metadata, setMetadata] = useState<DatabaseMetadata>(sqliteService.getMetadata());
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [canRollback, setCanRollback] = useState(false);

  // Active View Tab: 'table' vs 'chart'
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');

  // Query & AI State
  const [currentSql, setCurrentSql] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isMutation, setIsMutation] = useState(false);
  const [suggestedChartType, setSuggestedChartType] = useState<'bar' | 'line' | 'pie' | 'none'>('none');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  // Loading States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(geminiService.hasApiKey());
  const [pendingMutation, setPendingMutation] = useState<{ sql: string; explanation: string } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Refresh database schema & metadata
  const refreshDatabaseState = useCallback(async () => {
    try {
      const schemas = await sqliteService.getSchema();
      setTables(schemas);
      setMetadata(sqliteService.getMetadata());
      setCanRollback(sqliteService.canRollback());

      if (schemas.length > 0 && !selectedTable) {
        setSelectedTable(schemas[0].name);
      }
    } catch (err) {
      console.error('Failed to refresh database state:', err);
    }
  }, [selectedTable]);

  // Initialize with sample database on load
  useEffect(() => {
    const initApp = async () => {
      try {
        await sqliteService.loadSample('ecommerce');
        const schemas = await sqliteService.getSchema();
        setTables(schemas);
        setMetadata(sqliteService.getMetadata());
        setCanRollback(sqliteService.canRollback());

        if (schemas.length > 0) {
          setSelectedTable('products');
          // Run initial preview
          const initialSql = `SELECT id, title, category, price, stock_qty, rating FROM products ORDER BY id ASC LIMIT 15;`;
          setCurrentSql(initialSql);
          setExplanation('Loaded sample products catalog to get started.');
          const res = await sqliteService.executeQuery(initialSql);
          setQueryResult(res);
        }
      } catch (err: any) {
        showToast('Error initializing database engine: ' + err.message, 'error');
      }
    };

    initApp();
  }, []);

  // Execute an arbitrary SQL query
  const handleExecuteSql = async (sql: string, queryExplanation?: string) => {
    if (!sql.trim()) return;
    setIsExecuting(true);

    try {
      const res = await sqliteService.executeQuery(sql);
      setQueryResult(res);
      setCurrentSql(sql);
      if (queryExplanation) setExplanation(queryExplanation);

      // If mutation, refresh tables and counts
      if (res.isMutation) {
        await refreshDatabaseState();
        showToast(`Statement applied: ${res.affectedRows ?? 1} row(s) affected`, 'success');
      }

      // Check if chart is recommended
      if (res.suggestedChartType && res.suggestedChartType !== 'none') {
        setActiveTab('chart');
      }
    } catch (err: any) {
      showToast(err?.message || 'SQL execution failed', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle Natural Language Prompt submission
  const handleGenerateFromPrompt = async (prompt: string) => {
    setIsAiLoading(true);

    try {
      const schemaContext = await sqliteService.getSchemaPromptContext();
      const aiResponse = await geminiService.generateSql(prompt, schemaContext);

      setCurrentSql(aiResponse.sql);
      setExplanation(aiResponse.explanation);
      setIsMutation(aiResponse.isMutation);
      setSuggestedChartType(aiResponse.suggestedChartType || 'none');

      if (aiResponse.isMutation) {
        // Intercept with confirmation modal for safety
        setPendingMutation({
          sql: aiResponse.sql,
          explanation: aiResponse.explanation,
        });
      } else {
        // Execute SELECT query immediately
        await handleExecuteSql(aiResponse.sql, aiResponse.explanation);

        if (aiResponse.suggestedChartType && aiResponse.suggestedChartType !== 'none') {
          setActiveTab('chart');
        } else {
          setActiveTab('table');
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate query with Gemini', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Auto-Fix query with Gemini if it failed
  const handleAutoFix = async (failedSql: string, errorMsg: string) => {
    setIsAiLoading(true);
    try {
      const schemaContext = await sqliteService.getSchemaPromptContext();
      const fixed = await geminiService.fixSqlError(failedSql, errorMsg, schemaContext);

      setCurrentSql(fixed.sql);
      setExplanation(`Auto-fixed by Gemini: ${fixed.explanation}`);
      setIsMutation(fixed.isMutation);
      showToast('Query auto-fixed by Gemini!', 'success');

      await handleExecuteSql(fixed.sql, fixed.explanation);
    } catch (err: any) {
      showToast(err?.message || 'Could not auto-fix query', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Preview table when clicked in sidebar
  const handlePreviewTable = async (tableName: string) => {
    setSelectedTable(tableName);
    const sql = `SELECT * FROM "${tableName}" LIMIT 50;`;
    const exp = `Previewing up to 50 records from "${tableName}".`;
    setCurrentSql(sql);
    setExplanation(exp);
    setIsMutation(false);
    setSuggestedChartType('none');
    setActiveTab('table');
    await handleExecuteSql(sql, exp);
  };

  // Inline cell update in DataGrid
  const handleCellUpdate = async (pkCol: string, pkVal: any, targetCol: string, newVal: any): Promise<boolean> => {
    if (!selectedTable) return false;
    const success = await sqliteService.updateCell(selectedTable, pkCol, pkVal, targetCol, newVal);
    if (success) {
      await refreshDatabaseState();
      showToast(`Updated "${targetCol}" to "${newVal}"`, 'success');
      return true;
    } else {
      showToast('Failed to update cell', 'error');
      return false;
    }
  };

  // Rollback last mutation
  const handleRollback = async () => {
    const success = sqliteService.rollbackSnapshot();
    if (success) {
      await refreshDatabaseState();
      showToast('Reverted database to previous snapshot', 'info');
      if (selectedTable) {
        handlePreviewTable(selectedTable);
      }
    } else {
      showToast('No snapshots available to revert', 'error');
    }
  };

  // Download the modified database binary
  const handleDownloadDatabase = () => {
    try {
      const binary = sqliteService.exportBinary();
      const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = metadata.name.endsWith('.sqlite') || metadata.name.endsWith('.db')
        ? metadata.name
        : `${metadata.name}.sqlite`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${fileName}`, 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err?.message, 'error');
    }
  };

  // Load sample dataset
  const handleLoadSample = async (sampleId: 'ecommerce' | 'saas') => {
    try {
      await sqliteService.loadSample(sampleId);
      await refreshDatabaseState();
      const schemas = await sqliteService.getSchema();
      if (schemas.length > 0) {
        handlePreviewTable(schemas[0].name);
      }
      showToast(`Loaded ${sampleId === 'ecommerce' ? 'E-Commerce Store' : 'SaaS Metrics'} database`, 'success');
    } catch (err: any) {
      showToast('Failed to load sample: ' + err?.message, 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        metadata={metadata}
        hasApiKey={hasApiKey}
        canRollback={canRollback}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onDownloadDb={handleDownloadDatabase}
        onRollback={handleRollback}
        onLoadSample={handleLoadSample}
      />

      {/* Main Workspace Body */}
      <div className="app-body">
        {/* Left Sidebar Schema Browser */}
        <Sidebar
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={(name) => {
            setSelectedTable(name);
            handlePreviewTable(name);
          }}
          onPreviewTable={handlePreviewTable}
          onRefreshSchema={refreshDatabaseState}
          onOpenUpload={() => setIsUploadModalOpen(true)}
        />

        {/* Center Main Workspace */}
        <main className="main-content">
          {/* Top AI Prompt Bar */}
          <PromptBar
            onGenerate={handleGenerateFromPrompt}
            isLoading={isAiLoading}
            activeTableName={selectedTable}
          />

          {/* Generated SQL & Explanation Inspector */}
          {currentSql && (
            <QueryInspector
              currentSql={currentSql}
              explanation={explanation}
              isMutation={isMutation}
              result={queryResult}
              isRunning={isExecuting}
              onExecute={handleExecuteSql}
              onAutoFix={handleAutoFix}
            />
          )}

          {/* Results View Switcher (Table vs Chart) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('table')}
                className={`btn btn-sm ${activeTab === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '6px', fontSize: '0.8rem' }}
              >
                <Table size={13} />
                <span>Data Grid</span>
                {queryResult && (
                  <span className="badge badge-indigo" style={{ padding: '0 5px' }}>
                    {queryResult.rowCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('chart')}
                className={`btn btn-sm ${activeTab === 'chart' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '6px', fontSize: '0.8rem' }}
              >
                <BarChart2 size={13} />
                <span>Visualizer</span>
                {suggestedChartType && suggestedChartType !== 'none' && (
                  <span className="badge badge-cyan" style={{ padding: '0 5px', fontSize: '0.65rem' }}>
                    <Sparkles size={9} /> Auto-detected
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          {activeTab === 'table' ? (
            <DataGrid
              result={queryResult}
              activeTable={selectedTable}
              onCellUpdate={handleCellUpdate}
            />
          ) : (
            <Visualizer
              result={queryResult}
              suggestedType={suggestedChartType}
            />
          )}
        </main>
      </div>

      {/* Upload / Import Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadDatabase={async (buf, name) => {
          await sqliteService.loadFromBuffer(buf, name);
          await refreshDatabaseState();
          const schemas = await sqliteService.getSchema();
          if (schemas.length > 0) handlePreviewTable(schemas[0].name);
          showToast(`Loaded database "${name}"`, 'success');
        }}
        onUploadCsv={async (fileName, csv) => {
          const tableName = await sqliteService.importCsv(fileName, csv);
          await refreshDatabaseState();
          handlePreviewTable(tableName);
          showToast(`Imported CSV into table "${tableName}"`, 'success');
        }}
        onLoadSample={handleLoadSample}
        onCreateEmpty={async () => {
          await sqliteService.createEmpty();
          await refreshDatabaseState();
          showToast('Created empty SQLite database', 'info');
        }}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={() => {
          setHasApiKey(geminiService.hasApiKey());
          showToast('Gemini API settings updated', 'success');
        }}
      />

      {/* Mutation Safety Confirmation Modal */}
      {pendingMutation && (
        <MutationModal
          isOpen={Boolean(pendingMutation)}
          sql={pendingMutation.sql}
          explanation={pendingMutation.explanation}
          onConfirm={async () => {
            const sqlToRun = pendingMutation.sql;
            const exp = pendingMutation.explanation;
            setPendingMutation(null);
            await handleExecuteSql(sqlToRun, exp);
          }}
          onCancel={() => setPendingMutation(null)}
        />
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background:
              toast.type === 'success'
                ? 'rgba(16, 185, 129, 0.95)'
                : toast.type === 'error'
                ? 'rgba(244, 63, 94, 0.95)'
                : 'rgba(99, 102, 241, 0.95)',
            color: '#ffffff',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '0.85rem',
            fontWeight: 500,
            backdropFilter: 'blur(8px)',
            animation: 'slideUp 0.2s ease',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
