'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SignalType } from '@/types/arena';

interface ArenaSocketCallbacks {
  onContributionAdded: (contribution: Record<string, unknown>) => void;
  onSignalsUpdated: (data: { contributionId: string; signals: Record<SignalType, number> }) => void;
  onPhaseChanged: (data: {
    phase: string;
    phaseStartedAt?: string | null;
    phaseDurationMinutes?: number | null;
  }) => void;
  onParticipantCount: (count: number) => void;
  onSummaryUpdated: (summary: Record<string, unknown>) => void;
  onContributionEdited: (data: { contributionId: string; content: string }) => void;
}

export function useArenaSocket(arenaId: string, callbacks: ArenaSocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      // Keep retrying indefinitely with capped backoff so a phone that wakes
      // from sleep or a flaky network silently rejoins the arena.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // 'connect' fires on the initial connection AND on every reconnect, so
    // re-joining the arena room here keeps a recovered socket in sync.
    socket.on('connect', () => {
      socket.emit('join-arena', arenaId);
    });

    // Mobile Safari freezes background tabs and drops the socket without
    // firing a clean disconnect. Force a reconnect when the tab is shown again.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    socket.on('contribution-added', (contribution) => {
      callbacksRef.current.onContributionAdded(contribution);
    });

    socket.on('signals-updated', (data) => {
      callbacksRef.current.onSignalsUpdated(data);
    });

    socket.on('phase-changed', (data) => {
      // The phase API broadcasts the full object
      // { phase, phaseStartedAt, phaseDurationMinutes } so participants'
      // timers stay in sync. Tolerate a bare string from older clients.
      callbacksRef.current.onPhaseChanged(
        typeof data === 'string' ? { phase: data } : data
      );
    });

    socket.on('participant-count', (count) => {
      callbacksRef.current.onParticipantCount(count);
    });

    socket.on('summary-updated', (summary) => {
      callbacksRef.current.onSummaryUpdated(summary);
    });

    socket.on('contribution-edited', (data) => {
      callbacksRef.current.onContributionEdited(data);
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      socket.emit('leave-arena', arenaId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [arenaId]);

  const emitContribution = useCallback(
    (contribution: unknown) => {
      socketRef.current?.emit('new-contribution', { arenaId, contribution });
    },
    [arenaId]
  );

  const emitSignalUpdate = useCallback(
    (contributionId: string, signals: Record<SignalType, number>) => {
      socketRef.current?.emit('signal-update', { arenaId, contributionId, signals });
    },
    [arenaId]
  );

  const emitPhaseChange = useCallback(
    (phase: string) => {
      socketRef.current?.emit('phase-change', { arenaId, phase });
    },
    [arenaId]
  );

  return { emitContribution, emitSignalUpdate, emitPhaseChange };
}
