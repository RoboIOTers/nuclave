'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Shield,
  CheckSquare,
  HelpCircle,
  Flag,
  Sparkles,
  ThumbsUp,
  Zap,
  MessageCircleQuestion,
  Bot,
  Pin,
  Pencil,
  Wand2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import type { ContributionType, SignalType } from '@/types/arena';
import { CONTRIBUTION_TYPES } from '@/types/arena';

const TYPE_CONFIG: Record<
  ContributionType,
  { icon: typeof CheckCircle; label: string; color: string; bg: string; border: string }
> = {
  benefit: { icon: CheckCircle, label: 'Benefit', color: 'text-benefit', bg: 'bg-benefit/10', border: 'border-l-benefit' },
  risk: { icon: AlertTriangle, label: 'Risk', color: 'text-risk', bg: 'bg-risk/10', border: 'border-l-risk' },
  feature: { icon: Lightbulb, label: 'Idea', color: 'text-feature', bg: 'bg-feature/10', border: 'border-l-feature' },
  blocker: { icon: Shield, label: 'Blocker', color: 'text-blocker', bg: 'bg-blocker/10', border: 'border-l-blocker' },
  checklist: { icon: CheckSquare, label: 'Checklist', color: 'text-checklist', bg: 'bg-checklist/10', border: 'border-l-checklist' },
  question: { icon: HelpCircle, label: 'Question', color: 'text-question', bg: 'bg-question/10', border: 'border-l-question' },
  decision: { icon: Flag, label: 'Decision', color: 'text-decision', bg: 'bg-decision/10', border: 'border-l-decision' },
  wildcard: { icon: Sparkles, label: 'Wild Card', color: 'text-wildcard', bg: 'bg-wildcard/10', border: 'border-l-wildcard' },
};

interface ContributionCardProps {
  id: string;
  arenaId: string;
  type: ContributionType;
  content: string;
  isSkepticAi: boolean;
  isPinned: boolean;
  clusterCount?: number;
  signals: Record<SignalType, number>;
  userSignal?: SignalType | null;
  onSignal: (contributionId: string, type: SignalType) => void;
  onTypeChange?: (contributionId: string, newType: ContributionType) => void;
  onContentChange?: (contributionId: string, newContent: string) => void;
  showSignals: boolean;
  aiEnabled?: boolean;
}

export function ContributionCard({
  id,
  arenaId,
  type,
  content,
  isSkepticAi,
  isPinned,
  clusterCount,
  signals,
  userSignal,
  onSignal,
  onTypeChange,
  onContentChange,
  showSignals,
  aiEnabled = true,
}: ContributionCardProps) {
  const [isEditingType, setIsEditingType] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editText, setEditText] = useState(content);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditingContent && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [isEditingContent]);

  // Sync external content changes
  useEffect(() => {
    if (!isEditingContent) setEditText(content);
  }, [content, isEditingContent]);

  const saveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== content) {
      onContentChange?.(id, trimmed);
    }
    setIsEditingContent(false);
    setAiSuggestion(null);
  };

  const cancelEdit = () => {
    setEditText(content);
    setIsEditingContent(false);
    setAiSuggestion(null);
  };

  const requestAiImprove = async () => {
    setIsLoadingSuggestion(true);
    try {
      const res = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.improved) {
          setAiSuggestion(data.data.improved);
        }
      }
    } catch {
      // Silent
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      setEditText(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  return (
    <div
      className={`border border-border border-l-3 ${config.border} bg-card-light p-4 ${
        isPinned ? 'ring-1 ring-accent/30' : ''
      }`}
    >
      {/* Content — editable on click */}
      {isEditingContent ? (
        <div className="mb-2.5">
          <textarea
            ref={editRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
              if (e.key === 'Escape') cancelEdit();
            }}
            rows={2}
            className="w-full text-sm leading-relaxed bg-paper border border-border px-2 py-1.5 focus:outline-none focus:border-accent resize-none"
          />

          {/* AI suggestion */}
          {aiSuggestion && (
            <div className="mt-2 border border-accent-2/20 bg-accent-2/5 px-3 py-2 text-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-accent-2 mb-1">
                <Wand2 className="w-3 h-3" />
                AI suggestion
              </div>
              <p className="text-ink/80 leading-relaxed">{aiSuggestion}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={acceptSuggestion} className="flex items-center gap-1 text-[11px] text-accent-3 hover:underline">
                  <Check className="w-3 h-3" /> Accept
                </button>
                <button onClick={() => setAiSuggestion(null)} className="flex items-center gap-1 text-[11px] text-dim hover:underline">
                  <X className="w-3 h-3" /> Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Edit actions */}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={saveEdit} className="text-[11px] text-accent-3 font-medium hover:underline">Save</button>
            <button onClick={cancelEdit} className="text-[11px] text-dim hover:underline">Cancel</button>
            <button
              onClick={requestAiImprove}
              disabled={isLoadingSuggestion || !aiEnabled}
              className="flex items-center gap-1 text-[11px] text-accent-2 hover:underline ml-auto disabled:opacity-40"
            >
              {isLoadingSuggestion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              {aiEnabled ? 'Improve with AI' : 'AI disabled'}
            </button>
          </div>
        </div>
      ) : (
        <p
          onClick={() => { if (!isSkepticAi) { setIsEditingContent(true); } }}
          className={`text-sm leading-relaxed text-ink/90 mb-2.5 ${!isSkepticAi ? 'cursor-text hover:bg-paper/50 -mx-1 px-1 py-0.5 rounded-sm transition-colors' : ''}`}
          title={!isSkepticAi ? 'Click to edit' : undefined}
        >
          {content}
        </p>
      )}

      {/* Meta row: type tag + signals */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type tag */}
          {isEditingType ? (
            <div className="flex flex-wrap gap-1">
              {CONTRIBUTION_TYPES.map((t) => {
                const c = TYPE_CONFIG[t];
                const TIcon = c.icon;
                return (
                  <button
                    key={t}
                    onClick={() => { onTypeChange?.(id, t); setIsEditingType(false); }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                      t === type ? `${c.bg} ${c.color}` : 'text-dim hover:text-ink hover:bg-paper'
                    }`}
                  >
                    <TIcon className="w-3 h-3" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => setIsEditingType(true)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${config.bg} ${config.color} text-[10px] font-mono hover:opacity-80 transition-opacity`}
            >
              <Icon className="w-3 h-3" />
              {config.label}
              {onTypeChange && <Pencil className="w-2.5 h-2.5 opacity-40" />}
            </button>
          )}

          {isSkepticAi && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 text-accent text-[10px] font-mono">
              <Bot className="w-3 h-3" />
              Skeptic AI
            </span>
          )}
          {isPinned && <Pin className="w-3 h-3 text-accent" />}
          {clusterCount && clusterCount > 1 && (
            <span className="text-[10px] font-mono text-dim bg-paper px-1.5 py-0.5 border border-border">
              {clusterCount} similar
            </span>
          )}
        </div>

        {/* Signals */}
        {showSignals && (
          <div className="flex items-center gap-1 shrink-0">
            <SignalButton icon={ThumbsUp} label="Agree" count={signals.agree} isActive={userSignal === 'agree'} onClick={() => onSignal(id, 'agree')} activeColor="text-accent-3 bg-accent-3/10" />
            <SignalButton icon={Zap} label="Important" count={signals.critical} isActive={userSignal === 'critical'} onClick={() => onSignal(id, 'critical')} activeColor="text-accent bg-accent/10" />
            <SignalButton icon={MessageCircleQuestion} label="Disagree" count={signals.challenge} isActive={userSignal === 'challenge'} onClick={() => onSignal(id, 'challenge')} activeColor="text-accent-4 bg-accent-4/10" />
          </div>
        )}
      </div>
    </div>
  );
}

function SignalButton({ icon: Icon, label, count, isActive, onClick, activeColor }: {
  icon: typeof ThumbsUp; label: string; count: number; isActive: boolean; onClick: () => void; activeColor: string;
}) {
  return (
    <button type="button" onClick={onClick} title={label}
      className={`flex items-center gap-1 px-2 py-1 text-[11px] transition-colors rounded-sm ${isActive ? activeColor : 'text-dim/50 hover:text-ink hover:bg-paper'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && <span className="font-mono text-[10px]">{count}</span>}
    </button>
  );
}
