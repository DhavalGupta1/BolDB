import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, X, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { geminiService, DEFAULT_GEMINI_API_KEY } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [key, setKey] = useState(geminiService.getApiKey());
  const [model, setModel] = useState(geminiService.getModel());
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setKey(geminiService.getApiKey());
      setModel(geminiService.getModel());
      setTestOk(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDefault = key.trim() === DEFAULT_GEMINI_API_KEY;

  const test = async () => {
    if (!key.trim()) return;
    setTesting(true); setTestOk(null);
    const ok = await geminiService.validateApiKey(key.trim());
    setTesting(false); setTestOk(ok);
  };

  const save = () => {
    geminiService.setApiKey(key.trim());
    geminiService.setModel(model);
    onKeySaved(); onClose();
  };

  const resetToDefault = () => {
    geminiService.resetToDefaultKey();
    setKey(DEFAULT_GEMINI_API_KEY);
    setTestOk(null);
    onKeySaved();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Gemini AI Configuration</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs"><X size={16} /></button>
        </div>

        {/* Status banner */}
        <div style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {isDefault ? 'Connected (Built-in Project Key)' : 'Connected (Custom Key)'}
            </span>
          </div>
          {!isDefault && (
            <button onClick={resetToDefault} className="btn btn-ghost btn-xs" style={{ fontSize: '0.68rem', gap: '4px', color: 'var(--accent-light)' }}>
              <RotateCcw size={11} /> Reset to Default
            </button>
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setTestOk(null); }}
              placeholder="Enter Gemini API key..."
              className="input"
              style={{ paddingRight: '36px', fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="btn btn-ghost btn-xs"
              style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <span style={{ display: 'block', fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Pre-configured with project API key. Users do not need to add one manually.
          </span>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Model
          </label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="input" style={{ fontSize: '0.82rem' }}>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Fast)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </select>
        </div>

        {testOk !== null && (
          <div style={{
            padding: '7px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px',
            background: testOk ? 'var(--green-bg)' : 'var(--red-bg)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {testOk ? <CheckCircle2 size={13} color="var(--green)" /> : <XCircle size={13} color="var(--red)" />}
            <span style={{ fontSize: '0.74rem', color: testOk ? 'var(--green)' : 'var(--red)' }}>
              {testOk ? 'Gemini API connection validated successfully' : 'Connection failed. Please check the key.'}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '16px' }}>
          <button onClick={test} disabled={testing || !key.trim()} className="btn btn-secondary btn-sm">
            {testing ? <Loader2 size={12} className="animate-spin" /> : 'Test Connection'}
          </button>
          <button onClick={save} className="btn btn-primary btn-sm">Save</button>
        </div>
      </div>
    </div>
  );
};
