import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Users,
  Zap,
  EyeOff,
  BarChart3,
  FileCheck,
  Bot,
  Layers,
  Timer,
  Download,
  MessageSquare,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-ink text-paper overflow-hidden">

      {/* ━━ Navigation ━━ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ink/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-display text-2xl italic tracking-tight">
            Nu<span className="text-accent">clave</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-paper/40 hover:text-paper transition-colors hidden sm:block">
              Dashboard
            </Link>
            <a
              href="https://github.com/RoboIOTers/nuclave"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-paper/40 hover:text-paper transition-colors hidden sm:block"
            >
              GitHub
            </a>
            <Link
              href="/arena/create"
              className="bg-accent hover:bg-accent/90 text-paper px-4 py-2 text-sm font-medium transition-colors"
            >
              Start Brainstorming
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━ Hero ━━ */}
      <header className="relative pt-32 pb-24 md:pt-44 md:pb-36 px-6">
        {/* Radial glow behind hero text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-accent-2/3 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="animate-reveal">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase text-accent mb-8">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Open Source &middot; Self-Hostable &middot; AI-Powered
            </span>
          </div>

          <h1 className="animate-reveal delay-1 font-display text-[clamp(3rem,10vw,8rem)] italic leading-[0.9] tracking-tight mb-8">
            Where teams<br />
            <span className="text-accent glow-text">think together.</span>
          </h1>

          <p className="animate-reveal delay-2 text-lg md:text-xl text-paper/50 max-w-xl leading-relaxed mb-12">
            Type a thought. AI structures it. Your team signals what matters.
            End every session with a decision document, not a messy whiteboard.
          </p>

          <div className="animate-reveal delay-3 flex flex-wrap gap-4">
            <Link
              href="/arena/create"
              className="group inline-flex items-center gap-3 bg-accent text-paper px-7 py-4 font-medium text-sm tracking-wide hover:bg-accent/90 transition-all hover:gap-4"
            >
              Create an Arena
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/RoboIOTers/nuclave"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-paper/10 text-paper/60 px-7 py-4 text-sm tracking-wide hover:border-paper/30 hover:text-paper transition-all"
            >
              <Code2 className="w-4 h-4" />
              View Source
            </a>
          </div>

          {/* Stats */}
          <div className="animate-reveal delay-4 flex gap-12 mt-16 pt-8 border-t border-white/5">
            {[
              { value: '30+', label: 'API Routes' },
              { value: '8', label: 'Idea Types' },
              { value: '< 1s', label: 'AI Classify' },
              { value: '0', label: 'Accounts Needed' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl italic text-accent">{stat.value}</div>
                <div className="text-xs text-paper/30 font-mono tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ━━ The Problem ━━ */}
      <section className="relative px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent/60">The Problem</span>
            <h2 className="font-display text-4xl md:text-5xl italic leading-[1.1] mt-4 mb-6">
              Half of what<br />people think<br />
              <span className="text-paper/30">never gets said.</span>
            </h2>
          </div>
          <div className="space-y-6">
            <div className="border border-white/5 bg-surface p-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-display text-5xl italic text-accent">50-90</span>
                <span className="text-paper/40 text-sm">opinions in traditional sessions</span>
              </div>
            </div>
            <div className="border border-white/5 bg-surface p-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-display text-5xl italic text-accent-3">130-190</span>
                <span className="text-paper/40 text-sm">with anonymous digital dialogue</span>
              </div>
            </div>
            <p className="text-sm text-paper/30 leading-relaxed">
              The tools your team uses were built to capture ideas, not to structure, filter, and surface them. Nuclave fixes this.
            </p>
          </div>
        </div>
      </section>

      {/* ━━ How It Works ━━ */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent/60">How It Works</span>
          <h2 className="font-display text-4xl md:text-5xl italic leading-[1.1] mt-4 mb-16">
            Three steps to<br /><span className="text-accent">collective clarity.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-px bg-white/5">
            {[
              {
                step: '01',
                title: 'Type & Enter',
                desc: 'Just type your thought and press Enter. No forms, no categories to pick. AI auto-classifies it into one of 8 types instantly.',
                icon: MessageSquare,
              },
              {
                step: '02',
                title: 'Signal & Debate',
                desc: 'The group reacts: Agree, Important, or Disagree. The Skeptic AI challenges popular ideas to prevent groupthink.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Decide & Export',
                desc: 'A live summary builds itself. End the session with a PDF decision document. Every decision is permanently logged.',
                icon: FileCheck,
              },
            ].map((item) => (
              <div key={item.step} className="bg-ink p-8 md:p-10 group hover:bg-surface transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[11px] text-accent">{item.step}</span>
                  <div className="h-px flex-1 bg-white/5" />
                  <item.icon className="w-5 h-5 text-paper/20 group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-display text-2xl italic mb-3">{item.title}</h3>
                <p className="text-sm text-paper/40 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ Features Grid ━━ */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent/60">Capabilities</span>
          <h2 className="font-display text-4xl md:text-5xl italic leading-[1.1] mt-4 mb-16">
            What no other<br />tool does.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: 'Skeptic AI', desc: 'Automatically challenges high-consensus ideas with constructive counter-points. Prevents groupthink in real-time.', color: 'text-accent' },
              { icon: EyeOff, title: 'Anonymous Default', desc: 'No names shown. The HiPPO effect vanishes. Ideas win on merit, not authority.', color: 'text-accent-4' },
              { icon: BarChart3, title: 'Phase Stepper', desc: 'Ideation, Debate, Prioritize, Decision. Click to jump between phases. Timer per phase.', color: 'text-accent-2' },
              { icon: Layers, title: 'Smart Dedup', desc: 'Semantic similarity detects "12 people said the same thing" and clusters them automatically.', color: 'text-accent-3' },
              { icon: Timer, title: 'Live Summary', desc: 'Consensus, contested items, blockers, open questions. Updates continuously. Readable in 30 seconds.', color: 'text-accent' },
              { icon: Download, title: 'PDF + MD + JSON', desc: 'One-click export as a branded decision document, markdown file, or structured JSON.', color: 'text-accent-4' },
              { icon: Users, title: 'Weighted Voting', desc: 'Expert signals count 2x. Facilitator 1.5x. Observer 0x. Transparent. Role-aware intelligence.', color: 'text-accent-2' },
              { icon: Zap, title: 'Real-Time', desc: 'Socket.io powered. Every contribution, signal, and phase change broadcasts instantly.', color: 'text-accent-3' },
              { icon: Code2, title: 'Open Source', desc: 'AGPL-3.0. Self-host with Docker Compose. Bring your own AI keys. Full API access.', color: 'text-paper/60' },
            ].map((f) => (
              <div key={f.title} className="group border border-white/5 bg-surface/50 p-6 hover:bg-surface hover:border-white/10 transition-all">
                <f.icon className={`w-5 h-5 ${f.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-paper/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ Templates ━━ */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent/60">Ready-Made</span>
          <h2 className="font-display text-4xl md:text-5xl italic leading-[1.1] mt-4 mb-16">
            Start in seconds<br />with <span className="text-accent">templates.</span>
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Sprint Retro', time: '40 min', phases: '10 / 15 / 10 / 5' },
              { name: 'Product Critique', time: '55 min', phases: '15 / 20 / 10 / 10' },
              { name: 'Architecture Decision', time: '65 min', phases: '15 / 25 / 15 / 10' },
              { name: 'Post-Mortem', time: '55 min', phases: '15 / 20 / 10 / 10' },
              { name: 'Feature Prioritization', time: '55 min', phases: '10 / 15 / 20 / 10' },
              { name: 'Open Brainstorm', time: '50 min', phases: '15 / 15 / 10 / 10' },
            ].map((t) => (
              <Link
                key={t.name}
                href="/arena/create"
                className="group flex items-center justify-between border border-white/5 bg-surface/30 px-5 py-4 hover:border-accent/30 hover:bg-surface transition-all"
              >
                <div>
                  <div className="text-sm font-medium group-hover:text-accent transition-colors">{t.name}</div>
                  <div className="text-[10px] text-paper/25 font-mono mt-0.5">{t.phases} min</div>
                </div>
                <div className="text-xs text-paper/20 font-mono">{t.time}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━ CTA ━━ */}
      <section className="relative px-6 py-32 border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/3 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-7xl italic leading-[0.95] mb-6">
            Your next meeting<br />
            deserves a <span className="text-accent glow-text">decision.</span>
          </h2>
          <p className="text-paper/40 text-lg mb-10 max-w-md mx-auto">
            Free for teams of 10. No account to participate.<br />
            Open source. Self-hostable. Always.
          </p>
          <Link
            href="/arena/create"
            className="group inline-flex items-center gap-3 bg-accent text-paper px-10 py-5 font-medium text-base tracking-wide hover:bg-accent/90 transition-all glow hover:gap-4"
          >
            Create Your First Arena
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ━━ Footer ━━ */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display text-xl italic text-paper/40">
            Nu<span className="text-accent/60">clave</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-paper/25 font-mono">
            <a href="https://github.com/RoboIOTers/nuclave" target="_blank" rel="noopener noreferrer" className="hover:text-paper/60 transition-colors">GitHub</a>
            <Link href="/dashboard" className="hover:text-paper/60 transition-colors">Dashboard</Link>
            <Link href="/decisions" className="hover:text-paper/60 transition-colors">Decisions</Link>
            <span>AGPL-3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
