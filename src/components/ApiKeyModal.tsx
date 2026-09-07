import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

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

  if (!isOpen) return null;

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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1rem' }}>Gemini API</h3>
          <button onClick={onClose} className="btn btn-ghost btn-xs"><X size={16} /></button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Key</label>
          <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} value={key}
              onChange={(e) => { setKey(e.target.value); setTestOk(null); }}
              placeholder="AIzaSy..." className="input" style={{ paddingRight: '36px' }} />
            <button onClick={() => setShow(!show)} className="btn btn-ghost btn-xs"
              style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Model</label>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="input" style={{ fontSize: '0.82rem' }}>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          </select>
        </div>

        {testOk !== null && (
          <div style={{
            padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginBottom: '12px',
            background: testOk ? 'var(--green-bg)' : 'var(--red-bg)',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {testOk ? <CheckCircle2 size={12} color="var(--green)" /> : <XCircle size={12} color="var(--red)" />}
            <span style={{ fontSize: '0.72rem', color: testOk ? 'var(--green)' : 'var(--red)' }}>{testOk ? 'Connected' : 'Invalid key'}</span>
          </div>
        )}

        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', fontSize: '0.72rem', color: 'var(--accent-light)', marginBottom: '16px', textDecoration: 'none' }}>
          Get a free key →
        </a>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button onClick={test} disabled={testing || !key.trim()} className="btn btn-secondary btn-sm">
            {testing ? <Loader2 size={12} className="animate-spin" /> : 'Test'}
          </button>
          <button onClick={save} className="btn btn-primary btn-sm">Save</button>
        </div>
      </div>
    </div>
  );
};
