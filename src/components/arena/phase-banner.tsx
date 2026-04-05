'use client';

import { EyeOff, MessageSquare, BarChart3, FileCheck } from 'lucide-react';
import type { ArenaPhase } from '@/types/arena';

const PHASE_INFO: Record<ArenaPhase, { icon: typeof EyeOff; title: string; description: string; color: string }> = {
  ideation: {
    icon: EyeOff,
    title: 'Ideation Phase',
    description: "Share freely — reactions are hidden so ideas aren't influenced by early votes.",
    color: 'bg-accent-2/10 text-accent-2 border-accent-2/20',
  },
  debate: {
    icon: MessageSquare,
    title: 'Debate Phase',
    description: 'All ideas are visible. React with agree, critical, or challenge to shape consensus.',
    color: 'bg-accent-4/10 text-accent-4 border-accent-4/20',
  },
  prioritization: {
    icon: BarChart3,
    title: 'Prioritization Phase',
    description: 'Signal what matters most. The highest-signaled ideas rise to the top.',
    color: 'bg-accent-3/10 text-accent-3 border-accent-3/20',
  },
  decision: {
    icon: FileCheck,
    title: 'Decision Phase',
    description: 'Review the summary. The facilitator will finalize decisions and next steps.',
    color: 'bg-accent/10 text-accent border-accent/20',
  },
};

interface PhaseBannerProps {
  phase: ArenaPhase;
}

export function PhaseBanner({ phase }: PhaseBannerProps) {
  const info = PHASE_INFO[phase];
  const Icon = info.icon;

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${info.color}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div>
        <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
          {info.title}
        </span>
        <span className="text-[11px] ml-2 opacity-80">{info.description}</span>
      </div>
    </div>
  );
}
