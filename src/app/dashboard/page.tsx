'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Zap,
  Clock,
  Users,
  MessageSquare,
  ArrowRight,
  Loader2,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { getUserToken } from '@/lib/utils/user-token';

interface ArenaItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  mode: string;
  phase: string;
  status: string;
  isAnonymous: boolean;
  joinCode: string;
  contributionCount: number;
  createdAt: string;
}

interface AuthUser {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

const PHASE_COLORS: Record<string, string> = {
  ideation: 'bg-accent-2',
  debate: 'bg-accent-4',
  prioritization: 'bg-accent-3',
  decision: 'bg-accent',
  closed: 'bg-dim',
};

const STATUS_FILTERS = ['all', 'active', 'closed'] as const;

export default function DashboardPage() {
  const [arenas, setArenas] = useState<ArenaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setUser(payload?.data ?? null))
      .catch(() => {
        // Not signed in — guest user, no logout control shown
      });
  }, []);

  useEffect(() => {
    async function load() {
      const token = getUserToken();
      try {
        const res = await fetch(`/api/dashboard?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          setArenas(data.data ?? []);
        }
      } catch {
        // Silent
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    filter === 'all'
      ? arenas
      : arenas.filter((a) => a.status === filter);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore — the reload below reflects the cleared session
    }
    window.location.reload();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-paper">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display font-bold text-lg">
              NU<span className="text-accent">CLAVE</span>
            </Link>
            <span className="text-paper/20">|</span>
            <div className="flex items-center gap-1.5 text-paper/60 text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="hidden sm:inline text-paper/60 text-xs">
                  {user.name ?? user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-paper/50 hover:text-paper text-xs font-mono transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </>
            )}
            <Link
              href="/arena/create"
              className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-paper px-4 py-2 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Arena
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6">
          <h1 className="font-display text-xl font-bold">Your Arenas</h1>
          <div className="flex gap-1 ml-auto">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 text-xs font-mono capitalize transition-colors ${
                  filter === s
                    ? 'bg-ink text-paper'
                    : 'text-dim hover:text-ink'
                }`}
              >
                {s}
                {s !== 'all' && (
                  <span className="ml-1 opacity-60">
                    ({arenas.filter((a) => a.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-dim animate-spin" />
          </div>
        )}

        {!isLoading && arenas.length === 0 && (
          <div className="text-center py-20">
            <p className="text-dim text-sm mb-4">
              No arenas yet. Create your first brainstorming session.
            </p>
            <Link
              href="/arena/create"
              className="inline-flex items-center gap-2 bg-ink text-paper px-6 py-3 font-display font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Create an Arena
            </Link>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((arena) => (
              <Link
                key={arena.id}
                href={`/arena/${arena.id}`}
                className="flex items-center gap-4 border border-border bg-card p-4 hover:border-dim transition-colors group"
              >
                {/* Phase indicator */}
                <div
                  className={`w-2 h-10 shrink-0 ${PHASE_COLORS[arena.phase] ?? 'bg-dim'}`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm truncate group-hover:text-accent transition-colors">
                    {arena.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-[10px] uppercase text-dim">
                      {arena.phase}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-dim">
                      {arena.mode === 'live' ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {arena.mode}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-dim">
                      <MessageSquare className="w-3 h-3" />
                      {arena.contributionCount}
                    </span>
                  </div>
                </div>

                {/* Time + arrow */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-dim font-mono">
                    {timeAgo(arena.createdAt)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-dim group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
