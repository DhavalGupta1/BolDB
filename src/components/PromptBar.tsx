import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
  externalPrompt?: string;
}

const DEFAULT_SUGGESTIONS = [
  { icon: '🔥', text: 'Top 5 customers by spend' },
  { icon: '📈', text: 'Revenue by product category' },
  { icon: '⚠️', text: 'Low stock items (< 25)' },
  { icon: '👑', text: 'Orders with highest value' },
];

export const PromptBar: React.FC<PromptBarProps> = ({ onGenerate, isLoading, externalPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  const submit = () => {
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim());
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search HUD Container */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          padding: '2px',
          background: isFocused
            ? 'linear-gradient(135deg, var(--accent) 0%, #06b6d4 50%, #ec4899 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: isFocused ? '0 0 25px rgba(139, 92, 246, 0.25)' : 'var(--shadow-sm)',
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
          <div style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-bg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0
          }}>
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" color="var(--accent-light)" />
            ) : (
              <Sparkles size={16} color="var(--accent-light)" />
            )}
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
              onClick={() => setPrompt('')}
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
              gap: '6px'
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
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255,255,255,0.2)',
                  lineHeight: '1.2'
                }}>
                  ⏎
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Suggestions:
        </span>
        {DEFAULT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrompt(s.text);
              onGenerate(s.text);
            }}
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
