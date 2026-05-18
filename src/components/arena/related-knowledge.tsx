'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, ArrowRight, Loader2, X } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  arenaId: string;
  title: string;
  summary: string | null;
  keyDecisions: string[];
  keyBlockers: string[];
  similarity?: number;
  createdAt: string;
}

interface RelatedKnowledgeProps {
  arenaTitle: string;
  arenaDescription: string | null;
}

export function RelatedKnowledge({ arenaTitle, arenaDescription }: RelatedKnowledgeProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function search() {
      try {
        const query = `${arenaTitle} ${arenaDescription ?? ''}`.trim();
        if (!query) return;

        const res = await fetch(`/api/knowledge?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.data ?? []);
        }
      } catch {
        // Silent
      } finally {
        setIsLoading(false);
      }
    }
    search();
  }, [arenaTitle, arenaDescription]);

  if (dismissed || (!isLoading && entries.length === 0)) return null;

  return (
    <div className="border-b border-border bg-accent-2/5 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-accent-2">
          <Brain className="w-4 h-4" />
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
            Institutional Memory
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Hide Institutional Memory"
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-dim hover:text-ink p-1.5 -m-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Hide
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-dim">
          <Loader2 className="w-3 h-3 animate-spin" />
          Searching past decisions...
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-dim">
            Your team has discussed related topics before:
          </p>
          {entries.slice(0, 3).map((entry) => (
            <Link
              key={entry.id}
              href={`/arena/${entry.arenaId}`}
              className="flex items-start gap-2 p-2 bg-card-light border border-border hover:border-accent-2/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate group-hover:text-accent-2 transition-colors">
                  {entry.title}
                </div>
                {entry.keyDecisions.length > 0 && (
                  <p className="text-[10px] text-dim mt-0.5 truncate">
                    Decided: {entry.keyDecisions[0]}
                  </p>
                )}
                {entry.keyBlockers.length > 0 && (
                  <p className="text-[10px] text-risk mt-0.5 truncate">
                    Blocker: {entry.keyBlockers[0]}
                  </p>
                )}
                <span className="text-[9px] text-dim font-mono mt-0.5 block">
                  {new Date(entry.createdAt).toLocaleDateString()}
                  {entry.similarity ? ` · ${Math.round(entry.similarity * 100)}% relevant` : ''}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-dim shrink-0 mt-0.5 group-hover:text-accent-2 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
