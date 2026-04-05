'use client';

import { EyeOff, MessageSquare, BarChart3, FileCheck } from 'lucide-react';
import type { ArenaPhase } from '@/types/arena';
import { ARENA_PHASES } from '@/types/arena';
import { PhaseTimer } from './phase-timer';

const PHASE_META: Record<ArenaPhase, { label: string; icon: typeof EyeOff; color: string; activeColor: string }> = {
  ideation: { label: 'Ideation', icon: EyeOff, color: 'text-accent-2', activeColor: 'bg-accent-2 text-paper' },
  debate: { label: 'Debate', icon: MessageSquare, color: 'text-accent-4', activeColor: 'bg-accent-4 text-paper' },
  prioritization: { label: 'Prioritize', icon: BarChart3, color: 'text-accent-3', activeColor: 'bg-accent-3 text-paper' },
  decision: { label: 'Decision', icon: FileCheck, color: 'text-accent', activeColor: 'bg-accent text-paper' },
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
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-stretch">
          {ARENA_PHASES.map((phase, i) => {
            const meta = PHASE_META[phase];
            const Icon = meta.icon;
            const isCurrent = phase === currentPhase;
            const isPast = i < currentIndex;
            const isFuture = i > currentIndex;

            return (
              <div key={phase} className="flex items-stretch flex-1">
                {/* Step */}
                <button
                  onClick={() => isFacilitator && onPhaseSelect(phase)}
                  disabled={!isFacilitator}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-mono transition-all relative ${
                    isCurrent
                      ? meta.activeColor
                      : isPast
                        ? 'bg-paper/50 text-dim'
                        : 'bg-transparent text-dim/40'
                  } ${isFacilitator && !isCurrent ? 'hover:bg-paper cursor-pointer' : ''} ${
                    !isFacilitator ? 'cursor-default' : ''
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] sm:text-xs">{meta.label}</span>

                  {/* Completed checkmark */}
                  {isPast && (
                    <span className="w-3.5 h-3.5 rounded-full bg-accent-3/20 text-accent-3 flex items-center justify-center text-[8px] font-bold">
                      ✓
                    </span>
                  )}

                  {/* Timer for active phase */}
                  {isCurrent && phaseStartedAt && phaseDurationMinutes && (
                    <PhaseTimer
                      phaseStartedAt={phaseStartedAt}
                      phaseDurationMinutes={phaseDurationMinutes}
                      onTimerExpired={() => {
                        if (isFacilitator && i < ARENA_PHASES.length - 1) {
                          onPhaseSelect(ARENA_PHASES[i + 1]);
                        }
                      }}
                    />
                  )}

                  {/* Active indicator bar */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-paper/50" />
                  )}
                </button>

                {/* Connector arrow */}
                {i < ARENA_PHASES.length - 1 && (
                  <div className={`flex items-center px-0.5 ${isCurrent || isPast ? 'text-dim/30' : 'text-dim/15'}`}>
                    <span className="text-[10px]">›</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
