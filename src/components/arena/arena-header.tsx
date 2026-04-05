'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Zap,
  Clock,
  EyeOff,
  Eye,
  Users,
  Share2,
  ChevronRight,
  Download,
} from 'lucide-react';
import { PhaseTimer } from './phase-timer';
import { useState } from 'react';
import type { ArenaMode, ArenaPhase } from '@/types/arena';
import { ARENA_PHASES } from '@/types/arena';

const PHASE_LABELS: Record<ArenaPhase | 'closed', { label: string; shortLabel: string; color: string }> = {
  ideation: { label: 'Phase 1: Ideation', shortLabel: 'Ideation', color: 'bg-accent-2' },
  debate: { label: 'Phase 2: Debate', shortLabel: 'Debate', color: 'bg-accent-4' },
  prioritization: { label: 'Phase 3: Prioritization', shortLabel: 'Prioritize', color: 'bg-accent-3' },
  decision: { label: 'Phase 4: Decision', shortLabel: 'Decision', color: 'bg-accent' },
  closed: { label: 'Closed', shortLabel: 'Closed', color: 'bg-dim' },
};

interface ArenaHeaderProps {
  arenaId: string;
  title: string;
  joinCode: string;
  mode: ArenaMode;
  phase: ArenaPhase | 'closed';
  isAnonymous: boolean;
  participantCount: number;
  phaseStartedAt?: string | null;
  phaseDurationMinutes?: number | null;
  templatePhaseDurations?: Record<string, number> | null;
  onPhaseChange?: (phase: ArenaPhase) => void;
}

export function ArenaHeader({
  arenaId,
  title,
  joinCode,
  mode,
  phase,
  isAnonymous,
  participantCount,
  phaseStartedAt,
  phaseDurationMinutes,
  templatePhaseDurations,
  onPhaseChange,
}: ArenaHeaderProps) {
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${joinCode}`
      : `/join/${joinCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const advancePhase = async () => {
    if (phase === 'closed') return;
    const currentIndex = ARENA_PHASES.indexOf(phase as ArenaPhase);
    if (currentIndex < 0 || currentIndex >= ARENA_PHASES.length - 1) return;
    const nextPhase = ARENA_PHASES[currentIndex + 1];
    const duration = templatePhaseDurations?.[nextPhase] ?? null;

    try {
      const res = await fetch(`/api/arenas/${arenaId}/phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: nextPhase, durationMinutes: duration }),
      });
      if (res.ok) {
        onPhaseChange?.(nextPhase);
      }
    } catch {
      // Silent fail
    }
  };

  const handleExport = (format: 'markdown' | 'json') => {
    window.open(`/api/arenas/${arenaId}/export?format=${format}`, '_blank');
  };

  const phaseInfo = PHASE_LABELS[phase];
  const canAdvance = phase !== 'closed' && phase !== 'decision';

  return (
    <div className="bg-ink text-paper">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left side */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-paper/40 hover:text-paper transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-display font-bold text-sm shrink-0">
              NU<span className="text-accent">CLAVE</span>
            </span>
            <span className="text-paper/20 shrink-0">|</span>
            <h1 className="font-display font-semibold text-sm truncate">
              {title}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Phase indicator + advance */}
            <div className="flex items-center gap-0">
              <span
                className={`${phaseInfo.color} text-paper px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase`}
              >
                {phaseInfo.label}
              </span>
              {/* Phase timer */}
              <PhaseTimer
                phaseStartedAt={phaseStartedAt ?? null}
                phaseDurationMinutes={phaseDurationMinutes ?? null}
                onTimerExpired={canAdvance ? advancePhase : undefined}
              />
              {canAdvance && (
                <button
                  onClick={advancePhase}
                  title={`Advance to ${PHASE_LABELS[ARENA_PHASES[ARENA_PHASES.indexOf(phase as ArenaPhase) + 1]]?.shortLabel}`}
                  className="bg-paper/10 hover:bg-paper/20 text-paper px-1.5 py-0.5 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mode */}
            <span className="flex items-center gap-1 text-paper/50 text-xs">
              {mode === 'live' ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {mode}
            </span>

            {/* Anonymous */}
            <span className="flex items-center gap-1 text-paper/50 text-xs">
              {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </span>

            {/* Participants */}
            <span className="flex items-center gap-1 text-paper/50 text-xs">
              <Users className="w-3.5 h-3.5" />
              {participantCount}
            </span>

            {/* Export */}
            <div className="flex items-center gap-0">
              <button
                onClick={() => handleExport('markdown')}
                title="Export as Markdown"
                className="flex items-center gap-1 bg-paper/10 hover:bg-paper/20 text-paper px-2 py-1.5 text-[10px] font-mono transition-colors"
              >
                <Download className="w-3 h-3" />
                MD
              </button>
              <button
                onClick={() => handleExport('json')}
                title="Export as JSON"
                className="flex items-center bg-paper/10 hover:bg-paper/20 text-paper px-2 py-1.5 text-[10px] font-mono transition-colors border-l border-paper/10"
              >
                JSON
              </button>
            </div>

            {/* Share */}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-paper px-3 py-1.5 text-xs font-mono transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
