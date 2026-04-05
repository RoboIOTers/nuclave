'use client';

import { CheckCircle, AlertTriangle, HelpCircle, Shield, Loader2, RefreshCw } from 'lucide-react';

interface SummaryPanelProps {
  summary: {
    consensusItems: string[];
    contestedItems: string[];
    unresolvedQuestions: string[];
    criticalBlockers: string[];
    narrativeSummary: string;
  } | null;
  contributionCount: number;
  participantCount: number;
  isLoading: boolean;
  onRefresh?: () => void;
}

export function SummaryPanel({
  summary,
  contributionCount,
  participantCount,
  isLoading,
  onRefresh,
}: SummaryPanelProps) {
  return (
    <div className="border border-border bg-card h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-ink text-paper">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm">Live Summary</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-paper/40 hover:text-paper transition-colors disabled:opacity-30"
              title="Refresh summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <div className="flex gap-4 mt-1">
          <span className="font-mono text-[10px] text-paper/50">
            {contributionCount} contributions
          </span>
          <span className="font-mono text-[10px] text-paper/50">
            {participantCount} participants
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isLoading && !summary && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-dim animate-spin" />
            <span className="ml-2 text-xs text-dim">Generating summary...</span>
          </div>
        )}

        {!summary && !isLoading && contributionCount === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-dim">
              Summary will appear once contributions start.
            </p>
          </div>
        )}

        {!summary && !isLoading && contributionCount > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-dim mb-3">
              {contributionCount} contribution{contributionCount > 1 ? 's' : ''} so far.
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 bg-ink text-paper px-4 py-2 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generate Summary
              </button>
            )}
          </div>
        )}

        {summary && (
          <>
            {/* Narrative */}
            {summary.narrativeSummary && (
              <div className="bg-paper border border-border p-3">
                <p className="text-sm text-ink/80 leading-relaxed italic">
                  {summary.narrativeSummary}
                </p>
              </div>
            )}

            {/* Consensus */}
            {summary.consensusItems.length > 0 && (
              <SummarySection
                icon={CheckCircle}
                iconColor="text-accent-3"
                title="Consensus Zone"
                items={summary.consensusItems}
              />
            )}

            {/* Contested */}
            {summary.contestedItems.length > 0 && (
              <SummarySection
                icon={AlertTriangle}
                iconColor="text-accent-4"
                title="Contested"
                items={summary.contestedItems}
              />
            )}

            {/* Blockers */}
            {summary.criticalBlockers.length > 0 && (
              <SummarySection
                icon={Shield}
                iconColor="text-risk"
                title="Critical Blockers"
                items={summary.criticalBlockers}
              />
            )}

            {/* Questions */}
            {summary.unresolvedQuestions.length > 0 && (
              <SummarySection
                icon={HelpCircle}
                iconColor="text-question"
                title="Open Questions"
                items={summary.unresolvedQuestions}
              />
            )}

            {/* Refresh hint */}
            {isLoading && (
              <div className="flex items-center gap-2 text-[10px] text-dim">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummarySection({
  icon: Icon,
  iconColor,
  title,
  items,
}: {
  icon: typeof CheckCircle;
  iconColor: string;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="font-mono text-[10px] tracking-wider uppercase text-dim">
          {title}
        </h4>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-ink/70 leading-relaxed pl-6">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
