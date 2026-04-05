'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContributionInput } from '@/components/arena/contribution-input';
import { ContributionCard } from '@/components/arena/contribution-card';
import { SummaryPanel } from '@/components/arena/summary-panel';
import { ArenaHeader } from '@/components/arena/arena-header';
import { PhaseStepper } from '@/components/arena/phase-stepper';
import { MobileSummaryToggle } from '@/components/arena/mobile-summary-toggle';
import { Filter, Loader2, RefreshCw } from 'lucide-react';
import type { ContributionType, SignalType, ArenaPhase, ArenaMode } from '@/types/arena';
import { CONTRIBUTION_TYPES } from '@/types/arena';
import { getUserToken } from '@/lib/utils/user-token';
import { useArenaSocket } from '@/lib/realtime/use-arena-socket';

interface Contribution {
  id: string;
  type: ContributionType;
  content: string;
  isSkepticAi: boolean;
  isPinned: boolean;
  clusterCount?: number;
  signals: Record<SignalType, number>;
  createdAt: string;
}

interface ArenaData {
  id: string;
  title: string;
  description: string | null;
  joinCode: string;
  mode: ArenaMode;
  phase: ArenaPhase;
  isAnonymous: boolean;
  participantCount: number;
  contributions: Contribution[];
  template?: string | null;
  phaseStartedAt?: string | null;
  phaseDurationMinutes?: number | null;
}

interface Summary {
  consensusItems: string[];
  contestedItems: string[];
  unresolvedQuestions: string[];
  criticalBlockers: string[];
  narrativeSummary: string;
}

export default function ArenaPage() {
  const params = useParams();
  const arenaId = params.id as string;

  const [arena, setArena] = useState<ArenaData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [userSignals, setUserSignals] = useState<Record<string, SignalType>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [filterType, setFilterType] = useState<ContributionType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);
  const userToken = typeof window !== 'undefined' ? getUserToken() : 'server';

  // ── Fetch arena data from API ──
  const fetchArena = useCallback(async () => {
    try {
      const response = await fetch(`/api/arenas/${arenaId}`);
      if (response.status === 404) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        setArena(data.data);
        setContributions(data.data.contributions ?? []);
        setParticipantCount(data.data.participantCount ?? 1);
        setNotFound(false);
      }
    } catch {
      // Network error — keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [arenaId]);

  // Initial fetch
  useEffect(() => {
    fetchArena();
  }, [fetchArena]);

  // ── Real-time via Socket.io (with polling fallback) ──
  const { emitContribution, emitSignalUpdate } = useArenaSocket(arenaId, {
    onContributionAdded: useCallback((contribution: Record<string, unknown>) => {
      setContributions((prev) => {
        // Avoid duplicates
        if (prev.some((c) => c.id === contribution.id)) return prev;
        return [contribution as unknown as Contribution, ...prev];
      });
    }, []),
    onSignalsUpdated: useCallback((data: { contributionId: string; signals: Record<SignalType, number> }) => {
      setContributions((prev) =>
        prev.map((c) => (c.id === data.contributionId ? { ...c, signals: data.signals } : c))
      );
    }, []),
    onPhaseChanged: useCallback((phase: string) => {
      setArena((prev) => (prev ? { ...prev, phase: phase as ArenaPhase } : prev));
    }, []),
    onParticipantCount: useCallback((count: number) => {
      setParticipantCount(count);
    }, []),
    onSummaryUpdated: useCallback((summaryData: Record<string, unknown>) => {
      setSummary(summaryData as unknown as Summary);
    }, []),
  });

  // Fallback poll every 10s (in case WebSocket disconnects)
  useEffect(() => {
    const interval = setInterval(fetchArena, 10_000);
    return () => clearInterval(interval);
  }, [fetchArena]);

  // ── Submit contribution to API ──
  const handleContribution = useCallback(
    async (type: ContributionType, content: string) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/arenas/${arenaId}/contributions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, content, authorToken: userToken }),
        });

        if (response.ok) {
          const data = await response.json();
          // Add locally + broadcast to other clients
          setContributions((prev) => [data.data, ...prev]);
          emitContribution(data.data);
          feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {
        // Network error — contribution lost
      } finally {
        setIsSubmitting(false);
      }
    },
    [arenaId, userToken]
  );

  // ── Toggle signal via API ──
  const handleSignal = useCallback(
    async (contributionId: string, signalType: SignalType) => {
      // Optimistic local update
      setUserSignals((prev) => {
        const current = prev[contributionId];
        if (current === signalType) {
          const updated = { ...prev };
          delete updated[contributionId];
          return updated;
        }
        return { ...prev, [contributionId]: signalType };
      });

      try {
        const res = await fetch(`/api/arenas/${arenaId}/signals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contributionId,
            userToken,
            type: signalType,
          }),
        });
        // Re-fetch updated signal counts and broadcast
        if (res.ok) {
          const freshRes = await fetch(`/api/arenas/${arenaId}`);
          if (freshRes.ok) {
            const freshData = await freshRes.json();
            const updatedContrib = freshData.data.contributions?.find(
              (c: { id: string }) => c.id === contributionId
            );
            if (updatedContrib) {
              setContributions((prev) =>
                prev.map((c) => (c.id === contributionId ? { ...c, signals: updatedContrib.signals } : c))
              );
              emitSignalUpdate(contributionId, updatedContrib.signals);
            }
          }
        }
      } catch {
        // Revert on failure
        setUserSignals((prev) => {
          const updated = { ...prev };
          delete updated[contributionId];
          return updated;
        });
      }
    },
    [arenaId, userToken]
  );

  // ── Change contribution type via API ──
  const handleTypeChange = useCallback(
    async (contributionId: string, newType: ContributionType) => {
      // Optimistic update
      setContributions((prev) =>
        prev.map((c) => (c.id === contributionId ? { ...c, type: newType } : c))
      );

      try {
        await fetch(`/api/arenas/${arenaId}/contributions/${contributionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: newType }),
        });
      } catch {
        // Revert on failure — refetch
        fetchArena();
      }
    },
    [arenaId, fetchArena]
  );

  // ── Request summary ──
  const requestSummary = useCallback(async () => {
    if (contributions.length === 0) return;
    setIsSummaryLoading(true);

    try {
      const response = await fetch(`/api/arenas/${arenaId}/summary`, {
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

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch {
      // Non-critical
    } finally {
      setIsSummaryLoading(false);
    }
  }, [arenaId, contributions]);

  // Auto-summary when 3+ contributions
  useEffect(() => {
    if (contributions.length >= 3 && !summary) {
      requestSummary();
    }
  }, [contributions.length, summary, requestSummary]);

  // Auto-refresh summary every 30s
  useEffect(() => {
    if (contributions.length < 3) return;
    const interval = setInterval(requestSummary, 30_000);
    return () => clearInterval(interval);
  }, [contributions.length, requestSummary]);

  // Filter
  const filtered =
    filterType === 'all'
      ? contributions
      : contributions.filter((c) => c.type === filterType);

  const showSignals = arena ? arena.phase !== 'ideation' : true;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-dim animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold mb-2">
            NU<span className="text-accent">CLAVE</span>
          </h1>
          <p className="text-dim mb-4">Arena not found</p>
          <p className="text-sm text-dim">
            This arena may have expired or the link is invalid.
          </p>
          <a
            href="/arena/create"
            className="inline-block mt-6 bg-ink text-paper px-6 py-2.5 font-display font-semibold text-sm"
          >
            Create a New Arena
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <ArenaHeader
        arenaId={arenaId}
        title={arena?.title ?? 'Arena'}
        joinCode={arena?.joinCode ?? ''}
        mode={arena?.mode ?? 'live'}
        phase={arena?.phase ?? 'ideation'}
        isAnonymous={arena?.isAnonymous ?? true}
        participantCount={participantCount}
      />

      {/* Phase stepper */}
      {arena?.phase && (
        <PhaseStepper
          currentPhase={arena.phase}
          phaseStartedAt={arena.phaseStartedAt ?? null}
          phaseDurationMinutes={arena.phaseDurationMinutes ?? null}
          isFacilitator={true}
          onPhaseSelect={async (phase) => {
            try {
              const res = await fetch(`/api/arenas/${arenaId}/phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase, durationMinutes: null }),
              });
              if (res.ok) {
                setArena((prev) => prev ? { ...prev, phase } : prev);
              }
            } catch {
              // Silent
            }
          }}
        />
      )}

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Main feed */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Contribution input */}
          <div className="p-4 border-b border-border">
            <ContributionInput
              onSubmit={handleContribution}
              disabled={isSubmitting}
              arenaDescription={arena?.description ?? null}
            />
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-wrap">
            <Filter className="w-3.5 h-3.5 text-dim" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 text-xs font-mono transition-colors ${
                filterType === 'all'
                  ? 'bg-ink text-paper'
                  : 'text-dim hover:text-ink'
              }`}
            >
              All ({contributions.length})
            </button>
            {CONTRIBUTION_TYPES.map((type) => {
              const count = contributions.filter((c) => c.type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 text-xs font-mono capitalize transition-colors ${
                    filterType === type
                      ? 'bg-ink text-paper'
                      : 'text-dim hover:text-ink'
                  }`}
                >
                  {type} ({count})
                </button>
              );
            })}
            <button
              onClick={fetchArena}
              title="Refresh"
              className="ml-auto text-dim hover:text-ink transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feed */}
          <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 && (
              <div className="py-12 px-4">
                <p className="text-dim text-sm text-center mb-6">
                  No contributions yet. Start the conversation:
                </p>
                <div className="grid gap-2 max-w-md mx-auto">
                  {[
                    'What\'s the biggest risk we\'re not talking about?',
                    'What feature would make this 10x better?',
                    'What should we definitely NOT do?',
                    'What question do we need answered before deciding?',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleContribution('feature', prompt)}
                      className="text-left px-4 py-2.5 text-sm text-dim border border-dashed border-border hover:border-accent hover:text-ink transition-colors"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}
            {filtered.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                id={contribution.id}
                type={contribution.type}
                content={contribution.content}
                isSkepticAi={contribution.isSkepticAi}
                isPinned={contribution.isPinned}
                clusterCount={contribution.clusterCount}
                signals={contribution.signals}
                userSignal={userSignals[contribution.id] ?? null}
                onSignal={handleSignal}
                onTypeChange={handleTypeChange}
                showSignals={showSignals}
              />
            ))}
          </div>
        </div>

        {/* Summary panel — desktop sidebar */}
        <div className="w-80 hidden lg:block shrink-0">
          <div className="sticky top-0 h-screen overflow-hidden">
            <SummaryPanel
              summary={summary}
              contributionCount={contributions.length}
              participantCount={participantCount}
              isLoading={isSummaryLoading}
            />
          </div>
        </div>
      </div>

      {/* Summary panel — mobile bottom sheet toggle */}
      <MobileSummaryToggle
        summary={summary}
        contributionCount={contributions.length}
        participantCount={participantCount}
        isLoading={isSummaryLoading}
      />
    </div>
  );
}
