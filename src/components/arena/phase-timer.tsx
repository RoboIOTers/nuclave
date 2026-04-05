'use client';

import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

interface PhaseTimerProps {
  phaseStartedAt: string | null;
  phaseDurationMinutes: number | null;
  onTimerExpired?: () => void;
}

export function PhaseTimer({ phaseStartedAt, phaseDurationMinutes, onTimerExpired }: PhaseTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!phaseStartedAt) return;

    expiredRef.current = false;
    const startTime = new Date(phaseStartedAt).getTime();
    const hasCountdown = phaseDurationMinutes && phaseDurationMinutes > 0;
    const endTime = hasCountdown ? startTime + phaseDurationMinutes * 60 * 1000 : null;

    const tick = () => {
      const now = Date.now();
      const elapsedSecs = Math.floor((now - startTime) / 1000);
      setElapsed(elapsedSecs);

      if (endTime) {
        const diff = endTime - now;
        if (diff <= 0) {
          // Overtime — count up in red
          setRemaining(0);
          setOvertime(Math.floor((-diff) / 1000));

          if (!expiredRef.current) {
            expiredRef.current = true;
            onTimerExpired?.();
          }
        } else {
          setRemaining(Math.ceil(diff / 1000));
          setOvertime(0);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phaseStartedAt, phaseDurationMinutes, onTimerExpired]);

  if (!phaseStartedAt) return null;

  const hasCountdown = phaseDurationMinutes && phaseDurationMinutes > 0;
  const isOvertime = overtime > 0;
  const isUrgent = remaining !== null && remaining > 0 && remaining < 60;

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-xs tabular-nums ${
        isOvertime
          ? 'text-risk'
          : isUrgent
            ? 'text-accent'
            : 'text-ink'
      }`}
    >
      <Timer className="w-3.5 h-3.5" />
      {hasCountdown ? (
        isOvertime ? (
          <span>+{formatTime(overtime)} over</span>
        ) : (
          <span>{formatTime(remaining!)} left</span>
        )
      ) : (
        <span>{formatTime(elapsed)}</span>
      )}
    </div>
  );
}
