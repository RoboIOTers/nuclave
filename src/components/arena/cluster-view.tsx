'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Shield,
  CheckSquare,
  HelpCircle,
  Flag,
  Sparkles,
  Loader2,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react';
import type { ContributionType, SignalType } from '@/types/arena';

const TYPE_COLORS: Record<ContributionType, { bg: string; border: string; text: string; icon: typeof CheckCircle }> = {
  benefit: { bg: 'bg-benefit/5', border: 'border-benefit/20', text: 'text-benefit', icon: CheckCircle },
  risk: { bg: 'bg-risk/5', border: 'border-risk/20', text: 'text-risk', icon: AlertTriangle },
  feature: { bg: 'bg-feature/5', border: 'border-feature/20', text: 'text-feature', icon: Lightbulb },
  blocker: { bg: 'bg-blocker/5', border: 'border-blocker/20', text: 'text-blocker', icon: Shield },
  checklist: { bg: 'bg-checklist/5', border: 'border-checklist/20', text: 'text-checklist', icon: CheckSquare },
  question: { bg: 'bg-question/5', border: 'border-question/20', text: 'text-question', icon: HelpCircle },
  decision: { bg: 'bg-decision/5', border: 'border-decision/20', text: 'text-decision', icon: Flag },
  wildcard: { bg: 'bg-wildcard/5', border: 'border-wildcard/20', text: 'text-wildcard', icon: Sparkles },
};

interface Contribution {
  id: string;
  type: ContributionType;
  content: string;
  isSkepticAi: boolean;
  signals: Record<SignalType, number>;
}

interface ClusterViewProps {
  contributions: Contribution[];
  arenaId: string;
}

interface Cluster {
  label: string;
  type: ContributionType;
  items: Contribution[];
  totalAgree: number;
}

function buildLocalClusters(contributions: Contribution[]): Cluster[] {
  const byType: Record<string, Contribution[]> = {};
  for (const c of contributions) {
    if (!byType[c.type]) byType[c.type] = [];
    byType[c.type].push(c);
  }

  const typeLabels: Record<string, string> = {
    benefit: 'Benefits & Strengths',
    risk: 'Risks & Concerns',
    feature: 'Ideas & Features',
    blocker: 'Blockers',
    checklist: 'Requirements',
    question: 'Open Questions',
    decision: 'Decisions',
    wildcard: 'Wild Cards',
  };

  return Object.entries(byType)
    .map(([type, items]) => ({
      label: typeLabels[type] ?? type,
      type: type as ContributionType,
      items: items.sort((a, b) => b.signals.agree - a.signals.agree),
      totalAgree: items.reduce((sum, i) => sum + i.signals.agree, 0),
    }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function ClusterView({ contributions, arenaId }: ClusterViewProps) {
  const [clusters, setClusters] = useState<Cluster[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [source, setSource] = useState<'ai' | 'local'>('local');

  // Build clusters on demand, not on every render
  const buildClusters = useCallback(async () => {
    if (contributions.length === 0) {
      setClusters([]);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/arenas/${arenaId}/clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributions: contributions.map((c) => ({
            id: c.id,
            type: c.type,
            content: c.content,
            signals: c.signals,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.clusters?.length > 0) {
          setClusters(data.data.clusters);
          setSource('ai');
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fall through
    }

    // Fallback: group by type
    setClusters(buildLocalClusters(contributions));
    setSource('local');
    setIsLoading(false);
  }, [contributions, arenaId]);

  // Show local clusters immediately, offer AI clustering
  const displayClusters = clusters ?? buildLocalClusters(contributions);

  if (contributions.length === 0) {
    return (
      <div className="text-center py-12 text-dim text-sm">
        No contributions to visualize yet.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-dim uppercase tracking-wider">
          {displayClusters.length} clusters &middot; {contributions.length} contributions &middot; {source}
        </span>
        <button
          onClick={buildClusters}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-[11px] text-accent-2 hover:underline disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {clusters === null ? 'Generate AI Clusters' : 'Refresh'}
        </button>
      </div>

      {/* Proportion bar */}
      <div className="flex gap-0.5 h-2.5 rounded-sm overflow-hidden bg-border">
        {displayClusters.map((cluster) => {
          const pct = (cluster.items.length / contributions.length) * 100;
          const colors = TYPE_COLORS[cluster.type] ?? TYPE_COLORS.feature;
          return (
            <div
              key={cluster.label}
              className={`${colors.bg} border-y ${colors.border} transition-all`}
              style={{ width: `${Math.max(pct, 4)}%` }}
              title={`${cluster.label}: ${cluster.items.length}`}
            />
          );
        })}
      </div>

      {/* Cluster cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {displayClusters.map((cluster) => {
          const colors = TYPE_COLORS[cluster.type] ?? TYPE_COLORS.feature;
          const Icon = colors.icon;

          return (
            <div key={cluster.label} className={`border ${colors.border} ${colors.bg} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                  <h3 className={`font-display font-semibold text-sm ${colors.text}`}>
                    {cluster.label}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-dim">
                  <span>{cluster.items.length}</span>
                  {cluster.totalAgree > 0 && (
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" />{cluster.totalAgree}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                {cluster.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-xs text-ink/70 leading-relaxed">
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.text} bg-current mt-1.5 shrink-0`} />
                    <span className={item.isSkepticAi ? 'italic text-dim' : ''}>
                      {item.content}
                      {item.signals.agree > 0 && (
                        <span className="text-[9px] text-dim ml-1">+{item.signals.agree}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
