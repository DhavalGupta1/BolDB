import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, X, Loader2, Sparkles, RotateCcw, ShieldCheck, Key } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [customKey, setCustomKey] = useState('');
  const [model, setModel] = useState(geminiService.getModel());
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const isDefault = geminiService.isUsingDefaultKey();

  useEffect(() => {
    if (isOpen) {
      const savedCustom = geminiService.getCustomApiKey();
      setCustomKey(savedCustom);
      setIsCustomMode(Boolean(savedCustom));
      setModel(geminiService.getModel());
      setTestOk(null);
      setShowCustomKey(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestOk(null);
    const keyToTest = isCustomMode ? customKey.trim() : undefined;
    const ok = await geminiService.validateApiKey(keyToTest);
    setTesting(false);
    setTestOk(ok);
  };

  const handleSave = () => {
    if (isCustomMode && customKey.trim()) {
      geminiService.setApiKey(customKey.trim());
    } else {
      geminiService.resetToDefaultKey();
    }
    geminiService.setModel(model);
    onKeySaved();
    onClose();
  };

  const handleResetToDefault = () => {
    geminiService.resetToDefaultKey();
    setCustomKey('');
    setIsCustomMode(false);
    setTestOk(null);
    onKeySaved();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '28px',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          boxShadow: 'var(--shadow-lg)',
          color: '#09090b',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: '#09090b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={15} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#09090b', margin: 0 }}>
              Gemini AI Engine
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs" style={{ padding: '4px', color: '#71717a' }}>
            <X size={16} />
          </button>
        </div>

        {/* Security & Connection Status Card */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDefault ? (
              <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
            ) : (
              <Key size={18} color="#09090b" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#09090b' }}>
                {isDefault ? 'Project API Key Secured & Active' : 'Custom User API Key Active'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                {isDefault
                  ? 'Key is encrypted and hidden from public view for security.'
                  : 'Using your privately saved Gemini credentials.'}
              </div>
            </div>
          </div>

          {!isDefault && (
            <button
              onClick={handleResetToDefault}
              className="btn btn-ghost btn-xs"
              style={{ fontSize: '0.7rem', gap: '4px', color: '#09090b', flexShrink: 0 }}
              title="Switch back to built-in key"
            >
              <RotateCcw size={11} /> Reset to Default
            </button>
          )}
        </div>

        {/* Mode Toggle: Built-in vs Custom Key */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Credentials Mode
            </label>

            <button
              type="button"
              onClick={() => {
                const nextMode = !isCustomMode;
                setIsCustomMode(nextMode);
                setTestOk(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#09090b',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {isCustomMode ? 'Use Built-in Secured Key' : '+ Enter Custom API Key'}
            </button>
          </div>

          {/* If Built-in Mode */}
          {!isCustomMode ? (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: '#fafafa',
                border: '1px solid #e4e4e7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '0.85rem', color: '#71717a', letterSpacing: '0.15em' }}>
                  ••••••••••••••••••••••••••••
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontWeight: 600,
                  }}
                >
                  Secured
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>Pre-configured</span>
            </div>
          ) : (
            /* If Custom Key Mode */
            <div className="animate-slide-up">
              <div style={{ position: 'relative' }}>
                <input
                  type={showCustomKey ? 'text' : 'password'}
                  value={customKey}
                  onChange={(e) => {
                    setCustomKey(e.target.value);
                    setTestOk(null);
                  }}
                  placeholder="Paste your Gemini API key (AIzaSy...)..."
                  className="input"
                  style={{ paddingRight: '38px', fontFamily: 'monospace', fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCustomKey(!showCustomKey)}
                  className="btn btn-ghost btn-xs"
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}
                  title={showCustomKey ? 'Hide key' : 'Show key'}
                >
                  {showCustomKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#71717a', marginTop: '5px' }}>
                Your custom key is saved exclusively in your browser's private local storage.
              </span>
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#71717a',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Model Architecture
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="input"
            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast • Recommended)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Lightweight)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
          </select>
        </div>

        {/* Test Result Message */}
        {testOk !== null && (
          <div
            className="animate-slide-up"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              background: testOk ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${testOk ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {testOk ? <CheckCircle2 size={15} color="#16a34a" /> : <XCircle size={15} color="#b91c1c" />}
            <span style={{ fontSize: '0.76rem', fontWeight: 500, color: testOk ? '#166534' : '#b91c1c' }}>
              {testOk
                ? 'Gemini connection verified and active!'
                : 'Connection failed. Please check network or key validity.'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || (isCustomMode && !customKey.trim())}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            {testing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Pinging API...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>
          <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ padding: '7px 18px', fontWeight: 600 }}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
