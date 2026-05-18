'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContributionInput } from '@/components/arena/contribution-input';
import { ContributionCard } from '@/components/arena/contribution-card';
import { SummaryPanel } from '@/components/arena/summary-panel';
import { ArenaHeader } from '@/components/arena/arena-header';
import { PhaseStepper } from '@/components/arena/phase-stepper';
import { MobileSummaryToggle } from '@/components/arena/mobile-summary-toggle';
import { ClusterView } from '@/components/arena/cluster-view';
import { IdeasMap } from '@/components/arena/ideas-map';
import { RelatedKnowledge } from '@/components/arena/related-knowledge';
import { Filter, Loader2, RefreshCw, LayoutList, LayoutGrid, Waypoints, AlertTriangle, X } from 'lucide-react';
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
  phaseDurations?: Record<string, number> | null;
  phaseStartedAt?: string | null;
  phaseDurationMinutes?: number | null;
  aiEnabled?: boolean;
  isFacilitator?: boolean;
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
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'clusters'>('list');
  const [participantCount, setParticipantCount] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);
  const userToken = typeof window !== 'undefined' ? getUserToken() : 'server';

  // Transient error toast for actions that would otherwise fail silently.
  const [actionError, setActionError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showError = useCallback((message: string) => {
    setActionError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setActionError(null), 5000);
  }, []);

  // ── Fetch arena data from API ──
  const fetchArena = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/arenas/${arenaId}?token=${encodeURIComponent(userToken)}`
      );
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
  }, [arenaId, userToken]);

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
    onPhaseChanged: useCallback((data: {
      phase: string;
      phaseStartedAt?: string | null;
      phaseDurationMinutes?: number | null;
    }) => {
      setArena((prev) =>
        prev
          ? {
              ...prev,
              phase: data.phase as ArenaPhase,
              // Keep the existing timer if a legacy string-only event arrives.
              phaseStartedAt:
                data.phaseStartedAt !== undefined ? data.phaseStartedAt : prev.phaseStartedAt,
              phaseDurationMinutes:
                data.phaseDurationMinutes !== undefined
                  ? data.phaseDurationMinutes
                  : prev.phaseDurationMinutes,
            }
          : prev
      );
    }, []),
    onParticipantCount: useCallback((count: number) => {
      setParticipantCount(count);
    }, []),
    onSummaryUpdated: useCallback((summaryData: Record<string, unknown>) => {
      setSummary(summaryData as unknown as Summary);
    }, []),
    onContributionEdited: useCallback((data: { contributionId: string; content: string }) => {
      setContributions((prev) =>
        prev.map((c) => (c.id === data.contributionId ? { ...c, content: data.content } : c))
      );
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
          const newContribution = data.data as Contribution;
          // Surface near-duplicates the server detected: badge the new card
          // and each matched card with how many similar points now exist.
          const dups = (data.data.duplicates ?? []) as Array<{ id: string }>;
          const dupIds = new Set(dups.map((d) => d.id));
          setContributions((prev) => {
            const updated =
              dups.length > 0
                ? prev.map((c) =>
                    dupIds.has(c.id) ? { ...c, clusterCount: (c.clusterCount ?? 1) + 1 } : c
                  )
                : prev;
            return [
              dups.length > 0
                ? { ...newContribution, clusterCount: dups.length + 1 }
                : newContribution,
              ...updated,
            ];
          });
          emitContribution(newContribution);
          feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          setRateLimitError(null);
        } else if (response.status === 403) {
          const err = await response.json();
          setRateLimitError(err.error || 'Contributor limit reached.');
        } else if (response.status === 429) {
          const err = await response.json();
          setRateLimitError(err.error || 'Too many contributions. Please wait.');
          setTimeout(() => setRateLimitError(null), 5000);
        }
      } catch {
        showError('Could not submit your contribution — check your connection.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [arenaId, userToken, showError]
  );

  // ── Submit a starter prompt — classify it first instead of forcing 'feature' ──
  const handleStarterPrompt = useCallback(
    async (prompt: string) => {
      let type: ContributionType = 'feature';
      try {
        const res = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: prompt, aiEnabled: arena?.aiEnabled !== false }),
        });
        if (res.ok) {
          const data = await res.json();
          type = (data.data?.type as ContributionType) ?? 'feature';
        }
      } catch {
        // Fall back to 'feature' if classification is unavailable
      }
      handleContribution(type, prompt);
    },
    [arena?.aiEnabled, handleContribution]
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
        showError('Could not register your signal. Please try again.');
      }
    },
    [arenaId, userToken, showError]
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
        showError('Could not change the type. Reverting.');
      }
    },
    [arenaId, fetchArena, showError]
  );

  // ── Change contribution content via API ──
  const handleContentChange = useCallback(
    async (contributionId: string, newContent: string) => {
      setContributions((prev) =>
        prev.map((c) => (c.id === contributionId ? { ...c, content: newContent } : c))
      );

      try {
        await fetch(`/api/arenas/${arenaId}/contributions/${contributionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent }),
        });
      } catch {
        fetchArena();
        showError('Could not save your edit. Reverting.');
      }
    },
    [arenaId, fetchArena, showError]
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

  // Auto-summary when first contribution arrives
  useEffect(() => {
    if (contributions.length >= 1 && !summary && !isSummaryLoading) {
      requestSummary();
    }
  }, [contributions.length, summary, isSummaryLoading, requestSummary]);

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
        onClose={async () => {
          try {
            const res = await fetch(`/api/arenas/${arenaId}/close`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creatorToken: userToken }),
            });
            if (res.ok) {
              setArena((prev) => prev ? { ...prev, phase: 'decision' as ArenaPhase, status: 'closed' } : prev);
              // Redirect to decision document
              window.open(`/api/arenas/${arenaId}/export/pdf`, '_blank');
            } else {
              const err = await res.json().catch(() => null);
              showError(err?.error ?? 'Could not close the arena.');
            }
          } catch {
            showError('Could not close the arena — check your connection.');
          }
        }}
      />

      {/* Phase stepper */}
      {arena?.phase && (
        <PhaseStepper
          currentPhase={arena.phase}
          phaseStartedAt={arena.phaseStartedAt ?? null}
          phaseDurationMinutes={arena.phaseDurationMinutes ?? null}
          isFacilitator={arena?.isFacilitator ?? false}
          onPhaseSelect={async (phase) => {
            try {
              const res = await fetch(`/api/arenas/${arenaId}/phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phase, creatorToken: userToken }),
              });
              if (res.ok) {
                const data = await res.json();
                setArena((prev) => prev ? {
                  ...prev,
                  phase,
                  phaseStartedAt: data.data?.phaseStartedAt ?? new Date().toISOString(),
                  phaseDurationMinutes: data.data?.phaseDurationMinutes ?? null,
                } : prev);
              } else {
                const err = await res.json().catch(() => null);
                showError(err?.error ?? 'Could not change the phase.');
              }
            } catch {
              showError('Could not change the phase — check your connection.');
            }
          }}
        />
      )}

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Main feed */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Institutional Memory — related past decisions */}
          {arena?.title && (
            <RelatedKnowledge arenaTitle={arena.title} arenaDescription={arena.description ?? null} />
          )}

          {/* Rate limit / tier limit warning */}
          {rateLimitError && (
            <div className="px-4 py-2 bg-accent/10 text-accent text-xs font-mono text-center">
              {rateLimitError}
            </div>
          )}

          {/* Contribution input */}
          <div className="p-4 border-b border-border">
            <ContributionInput
              onSubmit={handleContribution}
              disabled={isSubmitting}
              arenaDescription={arena?.description ?? null}
              aiEnabled={arena?.aiEnabled !== false}
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
            {/* View toggle + refresh */}
            <div className="flex items-center gap-0 ml-auto border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono transition-colors ${
                  viewMode === 'list' ? 'bg-ink text-paper' : 'text-dim hover:text-ink'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono border-l border-border transition-colors ${
                  viewMode === 'map' ? 'bg-ink text-paper' : 'text-dim hover:text-ink'
                }`}
              >
                <Waypoints className="w-3.5 h-3.5" />
                Map
              </button>
              <button
                onClick={() => setViewMode('clusters')}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono border-l border-border transition-colors ${
                  viewMode === 'clusters' ? 'bg-ink text-paper' : 'text-dim hover:text-ink'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Clusters
              </button>
            </div>
            <button
              onClick={fetchArena}
              title="Refresh"
              className="p-1 text-dim hover:text-ink transition-colors ml-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ideas Map — force-directed bubble visualization */}
          {viewMode === 'map' && (
            <div className="flex-1 overflow-hidden bg-ink/95">
              <IdeasMap contributions={contributions} arenaId={arenaId} />
            </div>
          )}

          {/* Cluster view — grouped cards */}
          {viewMode === 'clusters' && (
            <div className="flex-1 overflow-y-auto">
              <ClusterView contributions={contributions} arenaId={arenaId} />
            </div>
          )}

          {/* List feed */}
          <div ref={feedRef} className={`flex-1 overflow-y-auto p-4 space-y-3 ${viewMode !== 'list' ? 'hidden' : ''}`}>
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
                      onClick={() => handleStarterPrompt(prompt)}
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
                arenaId={arenaId}
                type={contribution.type}
                content={contribution.content}
                isSkepticAi={contribution.isSkepticAi}
                isPinned={contribution.isPinned}
                clusterCount={contribution.clusterCount}
                signals={contribution.signals}
                userSignal={userSignals[contribution.id] ?? null}
                onSignal={handleSignal}
                onTypeChange={handleTypeChange}
                onContentChange={handleContentChange}
                showSignals={showSignals}
                aiEnabled={arena?.aiEnabled !== false}
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
              onRefresh={requestSummary}
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
        onRefresh={requestSummary}
      />

      {/* Transient action-error toast — surfaces failures that were silent before */}
      {actionError && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-risk text-paper px-4 py-2.5 text-xs font-mono shadow-lg max-w-[90vw]"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
            className="text-paper/60 hover:text-paper shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
