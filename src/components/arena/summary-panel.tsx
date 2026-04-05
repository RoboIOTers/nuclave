'use client';

import { CheckCircle, AlertTriangle, HelpCircle, Shield, Loader2 } from 'lucide-react';

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
}

export function SummaryPanel({
  summary,
  contributionCount,
  participantCount,
  isLoading,
}: SummaryPanelProps) {
  return (
    <div className="border border-border bg-card h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-ink text-paper">
        <h3 className="font-display font-bold text-sm">Live Summary</h3>
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
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-dim animate-spin" />
            <span className="ml-2 text-xs text-dim">Generating summary...</span>
          </div>
        )}

        {!summary && !isLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-dim">
              Summary will appear once contributions start coming in.
            </p>
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
