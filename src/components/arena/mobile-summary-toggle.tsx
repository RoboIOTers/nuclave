'use client';

import { useState } from 'react';
import { BarChart3, X } from 'lucide-react';
import { SummaryPanel } from './summary-panel';

interface MobileSummaryToggleProps {
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

export function MobileSummaryToggle({
  summary,
  contributionCount,
  participantCount,
  isLoading,
  onRefresh,
}: MobileSummaryToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button — mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-ink text-paper px-4 py-2.5 rounded-full shadow-lg text-xs font-mono"
      >
        <BarChart3 className="w-4 h-4" />
        Summary
        {contributionCount > 0 && (
          <span className="bg-accent text-paper w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
            {contributionCount}
          </span>
        )}
      </button>

      {/* Bottom sheet */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setIsOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-card border-t border-border overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-mono text-xs text-dim">Live Summary</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-dim hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SummaryPanel
                summary={summary}
                contributionCount={contributionCount}
                participantCount={participantCount}
                isLoading={isLoading}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
