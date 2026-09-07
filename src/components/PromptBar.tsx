import React, { useState } from 'react';
import { Sparkles, CornerDownLeft, Loader2, Lightbulb } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
  activeTableName?: string | null;
}

export const PromptBar: React.FC<PromptBarProps> = ({
  onGenerate,
  isLoading,
  activeTableName,
}) => {
  const [prompt, setPrompt] = useState('');

  const suggestions = [
    'Show top 5 customers with highest total spend',
    'Count products by category and average price',
    'Show all orders grouped by status',
    'Find items with low stock (under 30 units)',
    'Increase prices by 10% for Electronics category',
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onGenerate(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (suggestion: string) => {
    setPrompt(suggestion);
    onGenerate(suggestion);
  };

  return (
    <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header and Voice Prompt Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{ 
              width: '26px', 
              height: '26px', 
              borderRadius: '7px', 
              background: 'rgba(99, 102, 241, 0.2)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Sparkles size={14} color="var(--indigo-500)" />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            Bol AI Studio <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: '0.8rem' }}>(Natural Language to SQL)</span>
          </span>
        </div>

        {activeTableName && (
          <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
            Focused on: {activeTableName}
          </span>
        )}
      </div>

      {/* Input Box Form */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything in plain English... e.g. 'Show top 5 customers with orders over $100' or 'Update status to Delivered for order #104'"
          style={{
            width: '100%',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 100px 14px 16px',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            resize: 'none',
            outline: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--indigo-500)';
            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.3)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-medium)';
            e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
          }}
        />

        {/* Action Button inside textarea */}
        <div style={{ position: 'absolute', right: '12px', bottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="btn btn-primary btn-sm"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              opacity: !prompt.trim() || isLoading ? 0.6 : 1,
              cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Generate</span>
                <CornerDownLeft size={13} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.75rem', marginRight: '4px' }}>
          <Lightbulb size={13} color="var(--amber-400)" />
          <span>Suggestions:</span>
        </div>
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(item)}
            className="badge badge-indigo"
            style={{
              cursor: 'pointer',
              fontSize: '0.72rem',
              padding: '3px 9px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              background: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.borderColor = 'var(--indigo-500)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
