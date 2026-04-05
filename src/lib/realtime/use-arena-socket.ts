'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SignalType } from '@/types/arena';

interface ArenaSocketCallbacks {
  onContributionAdded: (contribution: Record<string, unknown>) => void;
  onSignalsUpdated: (data: { contributionId: string; signals: Record<SignalType, number> }) => void;
  onPhaseChanged: (phase: string) => void;
  onParticipantCount: (count: number) => void;
  onSummaryUpdated: (summary: Record<string, unknown>) => void;
}

export function useArenaSocket(arenaId: string, callbacks: ArenaSocketCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-arena', arenaId);
    });

    socket.on('contribution-added', (contribution) => {
      callbacksRef.current.onContributionAdded(contribution);
    });

    socket.on('signals-updated', (data) => {
      callbacksRef.current.onSignalsUpdated(data);
    });

    socket.on('phase-changed', (phase) => {
      callbacksRef.current.onPhaseChanged(phase);
    });

    socket.on('participant-count', (count) => {
      callbacksRef.current.onParticipantCount(count);
    });

    socket.on('summary-updated', (summary) => {
      callbacksRef.current.onSummaryUpdated(summary);
    });

    return () => {
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
