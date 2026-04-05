'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface PhaseTimerProps {
  phaseStartedAt: string | null;
  phaseDurationMinutes: number | null;
  onTimerExpired?: () => void;
}

export function PhaseTimer({ phaseStartedAt, phaseDurationMinutes, onTimerExpired }: PhaseTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!phaseStartedAt || !phaseDurationMinutes) {
      setRemaining(null);
      return;
    }

    const endTime = new Date(phaseStartedAt).getTime() + phaseDurationMinutes * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setRemaining(0);
        onTimerExpired?.();
        return;
      }
      setRemaining(Math.ceil(diff / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phaseStartedAt, phaseDurationMinutes, onTimerExpired]);

  if (remaining === null) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 60;
  const isExpired = remaining === 0;

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-xs tabular-nums ${
        isExpired
          ? 'text-risk animate-pulse'
          : isUrgent
            ? 'text-accent'
            : 'text-ink'
      }`}
    >
      <Timer className="w-3.5 h-3.5" />
      {isExpired ? (
        <span>Time&apos;s up</span>
      ) : (
        <span>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      )}
    </div>
  );
}
