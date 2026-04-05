'use client';

import { EyeOff, MessageSquare, BarChart3, FileCheck } from 'lucide-react';
import type { ArenaPhase } from '@/types/arena';
import { ARENA_PHASES } from '@/types/arena';
import { PhaseTimer } from './phase-timer';

const PHASE_META: Record<ArenaPhase, { label: string; icon: typeof EyeOff; activeColor: string }> = {
  ideation: { label: 'Ideation', icon: EyeOff, activeColor: 'bg-accent-2 text-paper' },
  debate: { label: 'Debate', icon: MessageSquare, activeColor: 'bg-accent-4 text-paper' },
  prioritization: { label: 'Prioritize', icon: BarChart3, activeColor: 'bg-accent-3 text-paper' },
  decision: { label: 'Decision', icon: FileCheck, activeColor: 'bg-accent text-paper' },
};

interface PhaseStepperProps {
  currentPhase: ArenaPhase;
  phaseStartedAt: string | null;
  phaseDurationMinutes: number | null;
  onPhaseSelect: (phase: ArenaPhase) => void;
  isFacilitator: boolean;
}

export function PhaseStepper({
  currentPhase,
  phaseStartedAt,
  phaseDurationMinutes,
  onPhaseSelect,
  isFacilitator,
}: PhaseStepperProps) {
  const currentIndex = ARENA_PHASES.indexOf(currentPhase);

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto">
        {/* Phase tabs */}
        <div className="flex items-stretch">
          {ARENA_PHASES.map((phase, i) => {
            const meta = PHASE_META[phase];
            const Icon = meta.icon;
            const isCurrent = phase === currentPhase;
            const isPast = i < currentIndex;

            return (
              <div key={phase} className="flex items-stretch flex-1 min-w-0">
                <button
                  onClick={() => isFacilitator && onPhaseSelect(phase)}
                  disabled={!isFacilitator}
                  className={`flex-1 flex flex-col items-center justify-center py-2 sm:py-2.5 text-xs font-mono transition-all relative min-w-0 ${
                    isCurrent
                      ? meta.activeColor
                      : isPast
                        ? 'bg-paper/50 text-dim'
                        : 'bg-transparent text-dim/40'
                  } ${isFacilitator && !isCurrent ? 'hover:bg-paper cursor-pointer' : ''} ${
                    !isFacilitator ? 'cursor-default' : ''
                  }`}
                >
                  {/* Row 1: icon + label */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="text-[9px] sm:text-xs truncate">{meta.label}</span>
                    {isPast && (
                      <span className="w-3 h-3 rounded-full bg-accent-3/20 text-accent-3 flex items-center justify-center text-[7px] font-bold shrink-0">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Active indicator bar */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-paper/50" />
                  )}
                </button>

                {/* Connector */}
                {i < ARENA_PHASES.length - 1 && (
                  <div className={`flex items-center px-px ${isCurrent || isPast ? 'text-dim/30' : 'text-dim/10'}`}>
                    <span className="text-[8px] sm:text-[10px]">›</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Timer bar — separate row, full width, only when active */}
        {phaseStartedAt && phaseDurationMinutes && (
          <div className="flex items-center justify-center gap-2 py-1.5 border-t border-border bg-ink/5">
            <PhaseTimer
              phaseStartedAt={phaseStartedAt}
              phaseDurationMinutes={phaseDurationMinutes}
              onTimerExpired={() => {
                if (isFacilitator && currentIndex < ARENA_PHASES.length - 1) {
                  onPhaseSelect(ARENA_PHASES[currentIndex + 1]);
                }
              }}
            />
            <span className="text-[10px] text-dim">
              remaining in {PHASE_META[currentPhase]?.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
