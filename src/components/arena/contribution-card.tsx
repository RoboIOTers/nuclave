'use client';

import { useState } from 'react';
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
  type: ContributionType;
  content: string;
  isSkepticAi: boolean;
  isPinned: boolean;
  clusterCount?: number;
  signals: Record<SignalType, number>;
  userSignal?: SignalType | null;
  onSignal: (contributionId: string, type: SignalType) => void;
  onTypeChange?: (contributionId: string, newType: ContributionType) => void;
  showSignals: boolean;
}

export function ContributionCard({
  id,
  type,
  content,
  isSkepticAi,
  isPinned,
  clusterCount,
  signals,
  userSignal,
  onSignal,
  onTypeChange,
  showSignals,
}: ContributionCardProps) {
  const [isEditingType, setIsEditingType] = useState(false);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={`border border-border border-l-3 ${config.border} bg-card p-4 ${
        isPinned ? 'ring-1 ring-accent/30' : ''
      }`}
    >
      {/* Content first — the most important thing */}
      <p className="text-sm leading-relaxed text-ink/90 mb-2.5">{content}</p>

      {/* Meta row: type tag + signals */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Type tag — clickable to edit */}
          {isEditingType ? (
            <div className="flex flex-wrap gap-1">
              {CONTRIBUTION_TYPES.map((t) => {
                const c = TYPE_CONFIG[t];
                const TIcon = c.icon;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      onTypeChange?.(id, t);
                      setIsEditingType(false);
                    }}
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
            <SignalButton
              icon={ThumbsUp}
              label="Agree"
              count={signals.agree}
              isActive={userSignal === 'agree'}
              onClick={() => onSignal(id, 'agree')}
              activeColor="text-accent-3 bg-accent-3/10"
            />
            <SignalButton
              icon={Zap}
              label="Important"
              count={signals.critical}
              isActive={userSignal === 'critical'}
              onClick={() => onSignal(id, 'critical')}
              activeColor="text-accent bg-accent/10"
            />
            <SignalButton
              icon={MessageCircleQuestion}
              label="Disagree"
              count={signals.challenge}
              isActive={userSignal === 'challenge'}
              onClick={() => onSignal(id, 'challenge')}
              activeColor="text-accent-4 bg-accent-4/10"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SignalButton({
  icon: Icon,
  label,
  count,
  isActive,
  onClick,
  activeColor,
}: {
  icon: typeof ThumbsUp;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-2 py-1 text-[11px] transition-colors rounded-sm ${
        isActive ? activeColor : 'text-dim/50 hover:text-ink hover:bg-paper'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {count > 0 && <span className="font-mono text-[10px]">{count}</span>}
    </button>
  );
}
