'use client';

import { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ContributionType } from '@/types/arena';

interface ContributionInputProps {
  onSubmit: (type: ContributionType, content: string) => void;
  disabled?: boolean;
  arenaDescription?: string | null;
  aiEnabled?: boolean;
}

export function ContributionInput({ onSubmit, disabled, arenaDescription, aiEnabled = true }: ContributionInputProps) {
  const [content, setContent] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isClassifying) return;

    setIsClassifying(true);
    setContent('');

    try {
      // Auto-classify via API (falls back to keyword matching)
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, aiEnabled }),
      });

      let type: ContributionType = 'feature';
      if (res.ok) {
        const data = await res.json();
        type = data.data?.type ?? 'feature';
      }

      onSubmit(type, trimmed);
    } catch {
      // If classification fails, submit as feature
      onSubmit('feature', trimmed);
    } finally {
      setIsClassifying(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border border-border bg-card rounded-sm">
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isClassifying}
          placeholder={arenaDescription ? "Share your thoughts..." : "What's on your mind?"}
          rows={1}
          className="flex-1 bg-transparent text-sm leading-relaxed focus:outline-none resize-none placeholder:text-dim/50 min-h-[36px] max-h-[120px] py-1.5"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !content.trim() || isClassifying}
          className="flex items-center justify-center w-8 h-8 bg-ink text-paper rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          {isClassifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="px-3 pb-2">
        <span className="text-[10px] text-dim/50">
          Press Enter to submit &middot; {aiEnabled ? 'AI auto-categorizes your input' : 'Auto-categorized locally (AI off for privacy)'}
        </span>
      </div>
    </div>
  );
}
