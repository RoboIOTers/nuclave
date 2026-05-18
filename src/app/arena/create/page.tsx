'use client';

import { useState, useEffect } from 'react';
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
  RotateCcw,
  Search,
  GitBranch,
  ShieldAlert,
  ListOrdered,
  Lightbulb,
} from 'lucide-react';
import type { ArenaMode } from '@/types/arena';
import { ARENA_TEMPLATES, type ArenaTemplate } from '@/lib/templates';
import { getUserToken } from '@/lib/utils/user-token';

const TEMPLATE_ICONS: Record<string, typeof Lightbulb> = {
  'rotate-ccw': RotateCcw,
  'search': Search,
  'git-branch': GitBranch,
  'shield-alert': ShieldAlert,
  'list-ordered': ListOrdered,
  'lightbulb': Lightbulb,
};

export default function CreateArenaPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ArenaTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'live' as ArenaMode,
    isAnonymous: true,
    aiEnabled: true,
    maxContributors: 10,
    contextDocument: '',
  });

  // The configured AI provider, fetched from the server so the privacy
  // choice can name it accurately (it could be Claude, OpenAI, or Ollama).
  const [aiProviderLabel, setAiProviderLabel] = useState('your AI provider');

  useEffect(() => {
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.data?.aiProviderLabel) {
          setAiProviderLabel(payload.data.aiProviderLabel);
        }
      })
      .catch(() => {
        // Non-critical — keep the generic label
      });
  }, []);

  const updateField = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const selectTemplate = (template: ArenaTemplate) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      title: template.defaultTitle || prev.title,
      description: template.contextPrompt || prev.description,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/arenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: selectedTemplate?.type ?? 'brainstorm',
          creatorToken: getUserToken(),
          template: selectedTemplate?.id ?? null,
          phaseDurations: selectedTemplate?.phaseDurations ?? null,
          aiEnabled: formData.aiEnabled,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success || !payload?.data?.id) {
        const message =
          payload?.error ||
          `Failed to create arena (HTTP ${response.status}). Please try again.`;
        throw new Error(message);
      }

      router.push(`/arena/${payload.data.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not reach server. Check your connection and try again.';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-ink text-paper">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-paper/40 hover:text-paper transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-display font-bold text-lg">
            NU<span className="text-accent">CLAVE</span>
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Template picker */}
        <h1 className="font-display text-xl font-bold tracking-tight mb-1">
          Start a brainstorm
        </h1>
        <p className="text-dim text-sm mb-6">
          Pick a template or start from scratch.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
          {ARENA_TEMPLATES.map((t) => {
            const Icon = TEMPLATE_ICONS[t.icon] ?? Lightbulb;
            const isSelected = selectedTemplate?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTemplate(t)}
                className={`border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-dim'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-accent' : 'text-dim'}`} />
                <span className="block font-display text-xs font-semibold">{t.name}</span>
                <span className="block text-[10px] text-dim mt-0.5 leading-tight">{t.description}</span>
              </button>
            );
          })}
        </div>

        {/* Phase durations preview */}
        {selectedTemplate && (
          <div className="flex items-center gap-1 mb-6 text-[10px] font-mono text-dim">
            <Clock className="w-3 h-3" />
            <span>Suggested timing:</span>
            {Object.entries(selectedTemplate.phaseDurations).map(([phase, mins]) => (
              <span key={phase} className="px-1.5 py-0.5 bg-card border border-border">
                {phase} {mins}m
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Add context for participants (optional)"
              rows={2}
              className="w-full bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-dim/50"
            />
          </div>

          {/* Data privacy — first-class choice, not buried in advanced options */}
          <div>
            <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">
              Data privacy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField('aiEnabled', true)}
                aria-pressed={formData.aiEnabled}
                className={`border p-3 text-left transition-colors ${
                  formData.aiEnabled
                    ? 'border-accent-2 bg-accent-2/5'
                    : 'border-border bg-card hover:border-dim'
                }`}
              >
                <span className="flex items-center gap-1.5 mb-1">
                  <Zap className={`w-3.5 h-3.5 ${formData.aiEnabled ? 'text-accent-2' : 'text-dim'}`} />
                  <span className="font-display text-xs font-semibold">AI assist</span>
                </span>
                <span className="block text-[10px] text-dim leading-tight">
                  Contributions are sent to {aiProviderLabel} for classification,
                  summaries, and the Skeptic AI.
                </span>
              </button>
              <button
                type="button"
                onClick={() => updateField('aiEnabled', false)}
                aria-pressed={!formData.aiEnabled}
                className={`border p-3 text-left transition-colors ${
                  !formData.aiEnabled
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-dim'
                }`}
              >
                <span className="flex items-center gap-1.5 mb-1">
                  <EyeOff className={`w-3.5 h-3.5 ${!formData.aiEnabled ? 'text-accent' : 'text-dim'}`} />
                  <span className="font-display text-xs font-semibold">Fully private</span>
                </span>
                <span className="block text-[10px] text-dim leading-tight">
                  Local keyword classifier only. No data leaves this server —
                  zero external API calls.
                </span>
              </button>
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="border border-accent bg-accent/5 text-accent px-4 py-3 text-xs"
            >
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
            className="w-full flex items-center justify-center gap-2 bg-ink text-paper py-3.5 font-display font-semibold text-sm tracking-wide hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : <><ArrowRight className="w-4 h-4" /> Launch Arena</>}
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-dim hover:text-ink transition-colors mx-auto"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {showAdvanced && (
            <div className="border border-border bg-card p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">Mode</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateField('mode', 'live')}
                      className={`flex-1 flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
                        formData.mode === 'live' ? 'border-accent bg-accent/5 text-accent' : 'border-border text-dim hover:border-dim'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" /> Live
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('mode', 'async')}
                      className={`flex-1 flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
                        formData.mode === 'async' ? 'border-accent bg-accent/5 text-accent' : 'border-border text-dim hover:border-dim'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Async
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">Identity</label>
                  <button
                    type="button"
                    onClick={() => updateField('isAnonymous', !formData.isAnonymous)}
                    className={`w-full flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
                      formData.isAnonymous ? 'border-accent-3 bg-accent-3/5 text-accent-3' : 'border-border text-dim'
                    }`}
                  >
                    {formData.isAnonymous ? <><EyeOff className="w-3.5 h-3.5" /> Anonymous</> : <><Eye className="w-3.5 h-3.5" /> Named</>}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-dim mb-1.5">Max contributors</label>
                <div className="flex items-center gap-2 border border-border px-3 py-2">
                  <Users className="w-3.5 h-3.5 text-dim" />
                  <input type="number" min={2} max={500} value={formData.maxContributors}
                    onChange={(e) => updateField('maxContributors', parseInt(e.target.value) || 10)}
                    className="w-full bg-transparent text-xs focus:outline-none" />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
