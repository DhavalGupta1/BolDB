import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, ExternalLink, X, ShieldCheck, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState(geminiService.getApiKey());
  const [selectedModel, setSelectedModel] = useState(geminiService.getModel());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const valid = await geminiService.validateApiKey(apiKey.trim());
    setIsTesting(false);

    if (valid) {
      setTestResult({ success: true, message: 'Connection successful! Gemini API is active.' });
    } else {
      setTestResult({ success: false, message: 'Invalid API key or network error. Please verify key from Google AI Studio.' });
    }
  };

  const handleSave = () => {
    geminiService.setApiKey(apiKey.trim());
    geminiService.setModel(selectedModel);
    onKeySaved();
    onClose();
  };

  const handleClear = () => {
    geminiService.setApiKey('');
    setApiKey('');
    setTestResult(null);
    onKeySaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={18} color="var(--indigo-500)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Google Gemini AI Settings</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Powers natural language to SQL translation &amp; auto-fixing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Info card */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <ShieldCheck size={18} color="var(--cyan-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-main)' }}>Privacy Guaranteed: </strong>
            Your API key and database records remain strictly on your machine. The key is saved only in your browser's local storage and sent directly to Google's API over encrypted TLS.
          </div>
        </div>

        {/* Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
            Gemini API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="AIzaSy..."
              className="input-text"
              style={{ paddingRight: '80px', fontFamily: showKey ? 'JetBrains Mono' : 'inherit', fontSize: '0.85rem' }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '4px 8px' }}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
            Gemini Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="input-text"
            style={{ fontSize: '0.85rem' }}
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fastest &amp; Free Tier Eligible)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deepest Reasoning for Complex Schemas)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          </select>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${testResult.success ? 'var(--emerald-500)' : 'var(--rose-500)'}`,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} color="var(--emerald-400)" />
            ) : (
              <XCircle size={16} color="var(--rose-400)" />
            )}
            <span style={{ fontSize: '0.8rem', color: testResult.success ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
              {testResult.message}
            </span>
          </div>
        )}

        {/* Helper Link */}
        <div style={{ marginBottom: '20px' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              color: 'var(--cyan-400)',
              textDecoration: 'none',
            }}
          >
            <span>Don't have an API key? Get one free from Google AI Studio</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          {apiKey ? (
            <button
              onClick={handleClear}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--rose-400)', fontSize: '0.78rem' }}
            >
              Remove Key
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleTestKey}
              disabled={isTesting || !apiKey.trim()}
              className="btn btn-secondary btn-sm"
            >
              {isTesting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Test Key</span>
              )}
            </button>

            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
