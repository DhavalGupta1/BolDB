import React, { useState } from 'react';
import { Sparkles, CornerDownLeft, Loader2 } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

const suggestions = [
  'Top 5 customers by spend',
  'Revenue by category',
  'Orders this month',
  'Low stock items',
];

export const PromptBar: React.FC<PromptBarProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const submit = () => { if (prompt.trim() && !isLoading) onGenerate(prompt.trim()); };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '5px 5px 5px 16px',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.06)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <Sparkles size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
        <input
          type="text" value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
          placeholder="Ask anything about your data..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: '0.88rem', padding: '8px 0',
          }}
        />
        <button onClick={submit} disabled={!prompt.trim() || isLoading}
          className="btn btn-primary btn-sm"
          style={{ borderRadius: 'var(--radius-md)', padding: '8px 14px' }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
        </button>
      </div>

      {/* Suggestion chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => { setPrompt(s); onGenerate(s); }}
            style={{
              padding: '4px 11px', fontSize: '0.7rem', fontFamily: 'inherit',
              background: 'var(--accent-bg)', color: 'var(--accent-light)',
              border: '1px solid rgba(139,92,246,0.12)', borderRadius: 'var(--radius-full)',
              cursor: 'pointer', outline: 'none',
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-hover)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)'; }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};
