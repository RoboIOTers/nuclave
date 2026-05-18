import Link from 'next/link';
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Code2,
  LayoutDashboard,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-ink text-paper relative overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_40px,rgba(255,255,255,0.015)_40px,rgba(255,255,255,0.015)_80px)]" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="inline-block font-mono text-[11px] tracking-[0.15em] uppercase text-accent border border-accent px-2.5 py-1 mb-6">
            Open Source &middot; Collective Intelligence
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-extrabold tracking-tight leading-[0.95] mb-6">
            NU<span className="text-accent">CLAVE</span>
          </h1>
          <p className="text-xl md:text-2xl text-paper/60 max-w-2xl leading-relaxed italic mb-10">
            Where groups think together and AI surfaces what matters.
            Structured collaborative brainstorming for teams that build things.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/arena/create"
              className="inline-flex items-center gap-2 bg-accent text-paper px-6 py-3 font-display font-semibold text-sm tracking-wide hover:bg-accent/90 transition-colors"
            >
              Create an Arena
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-paper/20 text-paper/80 px-6 py-3 font-display font-semibold text-sm tracking-wide hover:border-paper/40 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              My Arenas
            </Link>
            <a
              href="https://github.com/RoboIOTers/nuclave"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-paper/20 text-paper/80 px-6 py-3 font-display font-semibold text-sm tracking-wide hover:border-paper/40 transition-colors"
            >
              <Code2 className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Problem Statement */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-dim">
            The Problem
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-6">
            Half of what people think never gets said
          </h2>
          <p className="text-lg text-dim leading-relaxed">
            Research shows 50-90 unique opinions surface in traditional group sessions.
            Switch to anonymous digital dialogue? That number doubles to 130-190.
            The tools your team uses to brainstorm were built to capture ideas, not
            to structure, filter, and surface them.
          </p>
        </div>
      </section>

      {/* Contribution Types */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-dim">
            Structured Input
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-10">
            Every idea has a type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: CheckCircle, label: 'Benefit', color: 'text-benefit', desc: 'Reason to proceed' },
              { icon: AlertTriangle, label: 'Risk', color: 'text-risk', desc: 'Reason to reconsider' },
              { icon: Lightbulb, label: 'Feature', color: 'text-feature', desc: 'Suggestion or idea' },
              { icon: Shield, label: 'Blocker', color: 'text-blocker', desc: 'Must resolve first' },
              { icon: CheckCircle, label: 'Checklist', color: 'text-checklist', desc: 'Required step' },
              { icon: HelpCircle, label: 'Question', color: 'text-question', desc: 'Needs investigation' },
              { icon: Zap, label: 'Decision', color: 'text-decision', desc: 'Choice to make' },
              { icon: Zap, label: 'Wild Card', color: 'text-wildcard', desc: 'Out-of-scope thought' },
            ].map((item) => (
              <div key={item.label} className="border border-border bg-paper p-5">
                <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
                <h3 className="font-display font-semibold text-sm mb-1">{item.label}</h3>
                <p className="text-xs text-dim">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-dim">
          Why Nuclave
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-10">
          Features that don&apos;t exist anywhere else
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'AI Devil\'s Advocate',
              desc: 'The Skeptic AI automatically challenges high-consensus ideas, preventing groupthink. No tool has this.',
              accent: 'border-l-accent',
            },
            {
              title: 'Live Summary Panel',
              desc: 'A continuously updating brief: what\'s agreed, what\'s contested, what\'s unanswered. Readable in 30 seconds.',
              accent: 'border-l-accent-2',
            },
            {
              title: 'Smart Deduplication',
              desc: '"12 people raised this point" — semantic clustering turns 50 sticky notes into 8 actionable themes.',
              accent: 'border-l-accent-3',
            },
            {
              title: 'Anonymous by Default',
              desc: 'Eliminate the HiPPO effect. When nobody knows who said what, the best ideas win.',
              accent: 'border-l-accent-4',
            },
            {
              title: 'Phase-Based Sessions',
              desc: 'Ideation, Debate, Prioritization, Decision. Science-backed structure built into every session.',
              accent: 'border-l-accent',
            },
            {
              title: 'No Account Required',
              desc: 'Share a link. Your team contributes instantly. Zero friction, maximum participation.',
              accent: 'border-l-accent-2',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`border border-border bg-card p-6 border-l-3 ${feature.accent}`}
            >
              <h3 className="font-display font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-dim leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Start your first Arena
          </h2>
          <p className="text-paper/60 text-lg mb-8 max-w-xl mx-auto">
            Free forever for teams of 5. No account required to participate.
            Open source. Self-hostable.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/arena/create"
              className="inline-flex items-center gap-2 bg-accent text-paper px-8 py-3.5 font-display font-semibold text-sm tracking-wide hover:bg-accent/90 transition-colors"
            >
              <Users className="w-4 h-4" />
              Create an Arena
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-paper/20 text-paper/80 px-8 py-3.5 font-display font-semibold text-sm tracking-wide hover:border-paper/40 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              My Arenas
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-paper/40 text-center py-10 font-mono text-xs tracking-wider border-t border-white/5">
        <strong className="text-paper">NUCLAVE</strong> &mdash; Collective Intelligence
        Infrastructure &mdash; Open Source
      </footer>
    </div>
  );
}
