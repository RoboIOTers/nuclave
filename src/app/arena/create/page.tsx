'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Zap,
  Clock,
  EyeOff,
  Eye,
  Users,
} from 'lucide-react';
import type { ArenaType, ArenaMode } from '@/types/arena';

export default function CreateArenaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'brainstorm' as ArenaType,
    mode: 'live' as ArenaMode,
    isAnonymous: true,
    maxContributors: 10,
    contextDocument: '',
  });

  const updateField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/arenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create arena');

      const data = await response.json();
      router.push(`/arena/${data.data.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-paper/40 hover:text-paper transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-display font-bold text-lg">
            NU<span className="text-accent">CLAVE</span>
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          Start a brainstorm
        </h1>
        <p className="text-dim text-sm mb-8">
          Share the link — no account required to join.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title — the only required field */}
          <div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="What are we brainstorming about?"
              className="w-full bg-card border border-border px-4 py-3.5 text-base focus:outline-none focus:border-accent transition-colors placeholder:text-dim/50"
              autoFocus
            />
          </div>

          {/* Description — optional but visible */}
          <div>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Add context for participants (optional)"
              rows={2}
              className="w-full bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-dim/50"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
            className="w-full flex items-center justify-center gap-2 bg-ink text-paper py-3.5 font-display font-semibold text-sm tracking-wide hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              'Creating...'
            ) : (
              <>
                Launch Arena
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Advanced options — collapsed */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-dim hover:text-ink transition-colors mx-auto"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {showAdvanced && (
            <div className="border border-border bg-card p-5 space-y-5">
              {/* Mode + Anonymous */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">
                    Mode
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateField('mode', 'live')}
                      className={`flex-1 flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
                        formData.mode === 'live'
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-border text-dim hover:border-dim'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Live
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('mode', 'async')}
                      className={`flex-1 flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
                        formData.mode === 'async'
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-border text-dim hover:border-dim'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Async
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">
                    Identity
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField('isAnonymous', !formData.isAnonymous)}
                    className={`w-full flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
                      formData.isAnonymous
                        ? 'border-accent-3 bg-accent-3/5 text-accent-3'
                        : 'border-border text-dim'
                    }`}
                  >
                    {formData.isAnonymous ? (
                      <><EyeOff className="w-3.5 h-3.5" /> Anonymous</>
                    ) : (
                      <><Eye className="w-3.5 h-3.5" /> Named</>
                    )}
                  </button>
                </div>
              </div>

              {/* Max contributors */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">
                  Max contributors
                </label>
                <div className="flex items-center gap-2 border border-border px-3 py-2">
                  <Users className="w-3.5 h-3.5 text-dim" />
                  <input
                    type="number"
                    min={2}
                    max={500}
                    value={formData.maxContributors}
                    onChange={(e) => updateField('maxContributors', parseInt(e.target.value) || 10)}
                    className="w-full bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Context */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">
                  Background document
                </label>
                <textarea
                  value={formData.contextDocument}
                  onChange={(e) => updateField('contextDocument', e.target.value)}
                  placeholder="Paste a brief, spec, or link..."
                  rows={3}
                  className="w-full bg-paper border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-dim/50"
                />
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
