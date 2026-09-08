import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, X } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
  externalPrompt?: string;
  errorMessage?: string | null;
  onClearError?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  { icon: '🔥', text: 'Top 5 customers by spend' },
  { icon: '📈', text: 'Revenue by product category' },
  { icon: '⚠️', text: 'Low stock items (< 25)' },
  { icon: '👑', text: 'Orders with highest value' },
];

export const PromptBar: React.FC<PromptBarProps> = ({
  onGenerate,
  isLoading,
  externalPrompt,
  errorMessage,
  onClearError,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = errorMessage || localError;

  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (localError) setLocalError(null);
    if (errorMessage && onClearError) onClearError();
  };

  const handleClear = () => {
    setPrompt('');
    if (localError) setLocalError(null);
    if (errorMessage && onClearError) onClearError();
  };

  const submit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;

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

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
    setLocalError(null);
    if (onClearError) onClearError();
    onGenerate(text);
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search HUD Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          border: activeError ? '1px solid #ef4444' : isFocused ? '1px solid #09090b' : '1px solid #e4e4e7',
          boxShadow: isFocused ? '0 0 0 1px #09090b, var(--shadow-sm)' : 'var(--shadow-sm)',
          background: '#ffffff',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#ffffff',
            padding: '8px 12px 8px 16px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: activeError ? '#fef2f2' : '#f4f4f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" color="#09090b" />
            ) : activeError ? (
              <AlertCircle size={16} color="#b91c1c" />
            ) : (
              <Sparkles size={16} color="#09090b" />
            )}
          </div>

          <input
            type="text"
            value={prompt}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything in natural language... e.g. 'Show total revenue grouped by category' or 'Find top spenders'"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#09090b',
              fontSize: '0.9rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              padding: '6px 0',
            }}
          />

          {prompt && (
            <button
              onClick={handleClear}
              className="btn btn-ghost btn-xs"
              style={{ padding: '4px', color: '#71717a' }}
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}

          <button
            onClick={submit}
            disabled={!prompt.trim() || isLoading}
            className="btn btn-primary btn-sm"
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              fontWeight: 600,
              gap: '6px',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Generate SQL</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(255,255,255,0.2)',
                    lineHeight: '1.2',
                  }}
                >
                  ⏎
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error / Invalid Text Alert Banner */}
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
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
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
            style={{ color: '#b91c1c', padding: '2px' }}
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Suggestions:
        </span>
        {DEFAULT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestionClick(s.text)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              background: '#ffffff',
              color: '#52525b',
              border: '1px solid #e4e4e7',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#09090b';
              e.currentTarget.style.color = '#09090b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e4e7';
              e.currentTarget.style.color = '#52525b';
            }}
          >
            <span>{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
