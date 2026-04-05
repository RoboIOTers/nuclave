'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Shield,
  Loader2,
  ArrowRight,
  Users,
  MessageSquare,
} from 'lucide-react';

interface Decision {
  id: string;
  arenaId: string;
  title: string;
  joinCode: string;
  arenaType: string;
  agreedItems: string[];
  contestedItems: string[];
  unresolvedQuestions: string[];
  blockers: string[];
  nextActions: string[];
  narrative: string;
  contributionCount: number;
  participantCount: number;
  createdAt: string;
}

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/decisions');
        if (res.ok) {
          const data = await res.json();
          setDecisions(data.data ?? []);
        }
      } catch {
        // Silent
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display font-bold text-lg">
              NU<span className="text-accent">CLAVE</span>
            </Link>
            <span className="text-paper/20">|</span>
            <div className="flex items-center gap-1.5 text-paper/60 text-sm">
              <FileCheck className="w-4 h-4" />
              Decision Log
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-paper/50 text-xs hover:text-paper transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display text-xl font-bold mb-1">Decision Log</h1>
        <p className="text-dim text-sm mb-8">
          Permanent record of every closed arena. Searchable, auditable.
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-dim animate-spin" />
          </div>
        )}

        {!isLoading && decisions.length === 0 && (
          <div className="text-center py-20 text-dim text-sm">
            No decisions yet. Close an arena to create a decision record.
          </div>
        )}

        {decisions.map((d) => {
          const isExpanded = expanded === d.id;
          return (
            <div key={d.id} className="border border-border bg-card mb-3">
              {/* Header row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : d.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-paper/50 transition-colors"
              >
                <FileCheck className="w-5 h-5 text-accent-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm truncate">{d.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-dim">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {d.contributionCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {d.participantCount}
                    </span>
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 text-dim transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border">
                  {/* Narrative */}
                  <p className="text-sm text-dim italic pt-3">{d.narrative}</p>

                  {/* Agreed */}
                  {d.agreedItems.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-accent-3 mb-2">
                        <CheckCircle className="w-3.5 h-3.5" /> Agreed ({d.agreedItems.length})
                      </h4>
                      <ul className="space-y-1">
                        {d.agreedItems.map((item, i) => (
                          <li key={i} className="text-sm text-ink/80 pl-5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Contested */}
                  {d.contestedItems.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-accent-4 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> Contested ({d.contestedItems.length})
                      </h4>
                      <ul className="space-y-1">
                        {d.contestedItems.map((item, i) => (
                          <li key={i} className="text-sm text-ink/80 pl-5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Blockers */}
                  {d.blockers.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-risk mb-2">
                        <Shield className="w-3.5 h-3.5" /> Blockers ({d.blockers.length})
                      </h4>
                      <ul className="space-y-1">
                        {d.blockers.map((item, i) => (
                          <li key={i} className="text-sm text-ink/80 pl-5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Questions */}
                  {d.unresolvedQuestions.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-question mb-2">
                        <HelpCircle className="w-3.5 h-3.5" /> Open Questions ({d.unresolvedQuestions.length})
                      </h4>
                      <ul className="space-y-1">
                        {d.unresolvedQuestions.map((item, i) => (
                          <li key={i} className="text-sm text-ink/80 pl-5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next actions */}
                  {d.nextActions.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-mono uppercase text-dim mb-2">
                        Next Actions ({d.nextActions.length})
                      </h4>
                      <ul className="space-y-1">
                        {d.nextActions.map((item, i) => (
                          <li key={i} className="text-sm text-ink/80 pl-5">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Link to original arena */}
                  <Link
                    href={`/arena/${d.arenaId}`}
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-2"
                  >
                    View original arena <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
