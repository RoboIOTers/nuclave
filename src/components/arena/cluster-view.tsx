'use client';

import { useState, useEffect } from 'react';
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

export function ClusterView({ contributions, arenaId }: ClusterViewProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contributions.length === 0) {
      setClusters([]);
      return;
    }

    // Try AI clustering, fall back to type-based grouping
    buildClusters();
  }, [contributions]);

  const buildClusters = async () => {
    setIsLoading(true);

    // Try AI-powered clustering
    try {
      const res = await fetch(`/api/arenas/${arenaId}/clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributions: contributions.map((c) => ({
            id: c.id,
            type: c.type,
            content: c.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.clusters?.length > 0) {
          setClusters(data.data.clusters);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to local grouping
    }

    // Fallback: group by type
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

    const typeClusters: Cluster[] = Object.entries(byType)
      .map(([type, items]) => ({
        label: typeLabels[type] ?? type,
        type: type as ContributionType,
        items: items.sort((a, b) => b.signals.agree - a.signals.agree),
        totalAgree: items.reduce((sum, i) => sum + i.signals.agree, 0),
      }))
      .sort((a, b) => b.items.length - a.items.length);

    setClusters(typeClusters);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-dim animate-spin" />
        <span className="ml-2 text-xs text-dim">Building clusters...</span>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="text-center py-12 text-dim text-sm">
        No contributions to visualize yet.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Overview bar */}
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-border">
        {clusters.map((cluster) => {
          const pct = (cluster.items.length / contributions.length) * 100;
          const colors = TYPE_COLORS[cluster.type];
          return (
            <div
              key={cluster.label}
              className={`${colors.bg} border ${colors.border} transition-all`}
              style={{ width: `${Math.max(pct, 3)}%` }}
              title={`${cluster.label}: ${cluster.items.length} contributions`}
            />
          );
        })}
      </div>

      {/* Cluster cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {clusters.map((cluster) => {
          const colors = TYPE_COLORS[cluster.type];
          const Icon = colors.icon;

          return (
            <div
              key={cluster.label}
              className={`border ${colors.border} ${colors.bg} p-4 rounded-sm`}
            >
              {/* Cluster header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                  <h3 className={`font-display font-semibold text-sm ${colors.text}`}>
                    {cluster.label}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-dim">
                  <span>{cluster.items.length} items</span>
                  {cluster.totalAgree > 0 && (
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" />
                      {cluster.totalAgree}
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {cluster.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 text-xs text-ink/70 leading-relaxed"
                  >
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
