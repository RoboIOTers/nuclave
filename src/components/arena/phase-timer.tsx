'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface PhaseTimerProps {
  phaseStartedAt: string | null;
  phaseDurationMinutes: number | null;
  onTimerExpired?: () => void;
}

export function PhaseTimer({ phaseStartedAt, phaseDurationMinutes, onTimerExpired }: PhaseTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!phaseStartedAt) return;

    const startTime = new Date(phaseStartedAt).getTime();
    const hasCountdown = phaseDurationMinutes && phaseDurationMinutes > 0;
    const endTime = hasCountdown ? startTime + phaseDurationMinutes * 60 * 1000 : null;
    let expired = false;

    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));

      if (endTime) {
        const diff = endTime - now;
        if (diff <= 0 && !expired) {
          expired = true;
          setRemaining(0);
          onTimerExpired?.();
        } else if (diff > 0) {
          setRemaining(Math.ceil(diff / 1000));
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phaseStartedAt, phaseDurationMinutes, onTimerExpired]);

  if (!phaseStartedAt) return null;

  const hasCountdown = remaining !== null;
  const isUrgent = hasCountdown && remaining !== null && remaining < 60;
  const isExpired = hasCountdown && remaining === 0;

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      {hasCountdown ? (
        isExpired ? (
          <span>Time&apos;s up</span>
        ) : (
          <span>{formatTime(remaining!)} left</span>
        )
      ) : (
        <span>{formatTime(elapsed)}</span>
      )}
    </div>
  );
}
