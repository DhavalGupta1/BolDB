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
          padding: '2px',
          background: activeError
            ? 'linear-gradient(135deg, rgba(248, 113, 113, 0.8) 0%, rgba(239, 68, 68, 0.4) 100%)'
            : isFocused
            ? 'linear-gradient(135deg, var(--accent) 0%, #06b6d4 50%, #ec4899 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: activeError
            ? '0 0 20px rgba(248, 113, 113, 0.25)'
            : isFocused
            ? '0 0 25px rgba(139, 92, 246, 0.25)'
            : 'var(--shadow-sm)',
          transition: 'all 0.25s var(--ease)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-surface)',
            borderRadius: 'calc(var(--radius-lg) - 2px)',
            padding: '8px 12px 8px 18px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: activeError ? 'var(--red-bg)' : 'var(--accent-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" color="var(--accent-light)" />
            ) : activeError ? (
              <AlertCircle size={16} color="var(--red)" />
            ) : (
              <Sparkles size={16} color="var(--accent-light)" />
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
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              padding: '6px 0',
            }}
          />

          {prompt && (
            <button
              onClick={handleClear}
              className="btn btn-ghost btn-xs"
              style={{ padding: '4px' }}
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
              background: activeError ? 'var(--red)' : undefined,
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

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color: 'var(--text-dim)',
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
              fontSize: '0.72rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'var(--accent-bg)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'none';
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
