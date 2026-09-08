import React, { useState } from 'react';
import { Sparkles, CornerDownLeft, Loader2, AlertCircle, X } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

const suggestions = [
  'Top 5 customers by spend',
  'Revenue by category',
  'Orders this month',
  'Low stock items',
];

export const PromptBar: React.FC<PromptBarProps> = ({
  onGenerate,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const [prompt, setPrompt] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = errorMessage || localError;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (localError) setLocalError(null);
    if (errorMessage && onClearError) onClearError();
  };

  const submit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

    // Quick check for meaningless repetition or pure punctuation
    if (!/[a-zA-Z0-9]/.test(trimmed)) {
      setLocalError('Please input valid text or a query related to the database.');
      return;
    }
    if (/^(.)\1{4,}$/.test(trimmed)) {
      setLocalError('Please input valid text or a query related to the database.');
      return;
    }

    setLocalError(null);
    if (onClearError) onClearError();
    onGenerate(trimmed);
  };

  const handleSuggestionClick = (s: string) => {
    setPrompt(s);
    setLocalError(null);
    if (onClearError) onClearError();
    onGenerate(s);
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-surface)',
          border: activeError ? '1px solid rgba(248, 113, 113, 0.5)' : '1px solid var(--border)',
          boxShadow: activeError ? '0 0 0 3px rgba(248, 113, 113, 0.08)' : 'none',
          borderRadius: 'var(--radius-lg)',
          padding: '5px 5px 5px 16px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => {
          if (!activeError) {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.06)';
          }
        }}
        onBlur={(e) => {
          if (!activeError) {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <Sparkles size={15} color={activeError ? 'var(--red)' : 'var(--accent)'} style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={prompt}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask anything about your data..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: '0.88rem',
            padding: '8px 0',
          }}
        />
        <button
          onClick={submit}
          disabled={!prompt.trim() || isLoading}
          className="btn btn-primary btn-sm"
          style={{
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            background: activeError ? 'var(--red)' : undefined,
          }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
        </button>
      </div>

      {/* Error / Invalid Text Message */}
      {activeError && (
        <div
          className="animate-slide-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{activeError}</span>
          </div>
          <button
            onClick={() => {
              setLocalError(null);
              if (onClearError) onClearError();
            }}
            className="btn btn-ghost btn-xs"
            style={{ color: '#f87171', padding: '2px' }}
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSuggestionClick(s)}
            style={{
              padding: '4px 11px',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
              background: 'var(--accent-bg)',
              color: 'var(--accent-light)',
              border: '1px solid rgba(139,92,246,0.12)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-bg-hover)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-bg)';
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)';
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

