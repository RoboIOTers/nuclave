<p align="center">
  <h1 align="center">NU<span>CLAVE</span></h1>
  <p align="center"><strong>Collective Intelligence Platform</strong></p>
  <p align="center">Where groups think together and AI surfaces what matters.</p>
</p>

<p align="center">
  <a href="https://nuclave.com">Live Demo</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#self-hosting">Self-Host</a> &middot;
  <a href="#api-reference">API</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License" />
  <img src="https://img.shields.io/badge/next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/typescript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/postgresql-17-336791" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/socket.io-realtime-green" alt="Socket.io" />
  <img src="https://img.shields.io/badge/AI-pluggable-orange" alt="AI" />
</p>

---

## What is Nuclave?

Nuclave is an open-source, real-time collaborative brainstorming platform. Instead of free-form sticky notes that end in chaos, Nuclave **automatically structures** every contribution using AI, so your team ends with actionable decisions — not a messy whiteboard.

**The problem:** Research shows 50-90 unique opinions surface in traditional group sessions. Switch to anonymous digital dialogue? That number doubles to 130-190. Half of what your team thinks never gets said.

**The fix:** Nuclave gives everyone a voice. Type your thought, hit Enter. AI categorizes it. The group signals what matters. A live summary builds itself. The session ends with a decision document.

## Features

### Zero-Friction Input
Just type and press Enter. No forms, no dropdowns, no pre-classification. AI auto-categorizes your contribution into one of 8 types:

| Type | What it means |
|------|--------------|
| **Benefit** | A reason to proceed |
| **Risk** | A reason to reconsider |
| **Idea** | A feature or suggestion |
| **Blocker** | Must resolve before proceeding |
| **Checklist** | A required step or criterion |
| **Question** | Needs investigation |
| **Decision** | A choice the group must make |
| **Wild Card** | An off-topic thought worth noting |

Tap the tag to change it if the AI got it wrong. Changes persist server-side.

### Real-Time Collaboration
- **Socket.io** powered — contributions appear instantly across all browsers
- **No account required** — share a link, your team joins immediately
- **Anonymous by default** — eliminates the HiPPO effect (Highest Paid Person's Opinion)
- **Participant roles** — Facilitator, Expert (2x vote weight), Contributor, Observer

### Phase-Based Sessions with Visual Stepper
Science-backed facilitation structure with a clickable phase stepper bar:

1. **Ideation** — Signals hidden. Ideas flow without influence.
2. **Debate** — Reactions revealed. Agree, challenge, or flag as critical.
3. **Prioritization** — The most-signaled ideas rise to the top.
4. **Decision** — Facilitator finalizes. Session ends with a decision document.

Facilitators can jump to any phase (forward or backward). Optional countdown timer per phase with auto-advance.

### Arena Templates
6 pre-built templates with custom prompts, suggested phase durations, and starter questions:
- **Sprint Retrospective** — What worked, what didn't, what to improve
- **Product Critique** — Evaluate a feature or design
- **Architecture Decision Record** — Choose a technical approach
- **Incident Post-Mortem** — Blameless analysis of what went wrong
- **Feature Prioritization** — Decide what to build next
- **Open Brainstorm** — Free-form idea generation

### Skeptic AI (Devil's Advocate)
An AI participant that automatically challenges high-consensus ideas. When a contribution gets 2+ agrees during the debate phase, the Skeptic generates a constructive counter-point. Works without API keys using template-based responses, or uses Claude/OpenAI for richer challenges.

### Live Summary Panel
A continuously updating brief showing:
- Consensus zone (what the group agrees on)
- Contested items (where opinions split)
- Critical blockers
- Open questions
- Plain-language narrative summary

On mobile, accessible via a floating "Summary" button that opens a bottom sheet.

### AI-Powered Intelligence
- **Auto-classification** — Weighted keyword scoring with sentiment analysis. AI provider fallback for richer classification.
- **Semantic deduplication** — pgvector cosine similarity (0.85 threshold) with Jaccard text fallback
- **Pluggable providers** — Anthropic Claude, OpenAI, or Ollama (fully offline)
- **Contribution embeddings** — Stored in PostgreSQL via pgvector for similarity search

### Export
- **Markdown** — Structured by contribution type with signal counts
- **JSON** — Full data dump
- **PDF** — Branded decision document with executive summary, stats, and contribution tables. Opens in browser with a "Print / Save PDF" button.

### Decision Log
When an arena is closed, a permanent decision record is generated:
- Agreed items, contested items, blockers, open questions, next actions
- Narrative summary
- Searchable at `/decisions`
- Links back to original arena

### Dashboard
All your arenas in one place at `/dashboard`:
- Filter by active/closed
- Shows phase, mode, contribution count, last activity
- Quick access to create new arenas

### Authentication
- **Guest access** — Anonymous tokens via localStorage, no signup needed
- **OAuth** — GitHub and Google login (requires client ID/secret in env)
- **Session cookies** — 30-day persistent sessions

### Integrations
- **Slack** — Post formatted arena summaries to any Slack channel via webhook (`POST /api/integrations/slack`)

### Weighted Voting
- Assign participant roles: Facilitator (1.5x), Expert (2x), Contributor (1x), Observer (0x)
- Both raw and weighted signal counts returned in API
- Transparent — unweighted counts always visible alongside weighted

## Quick Start

```bash
# Clone the repo
git clone https://github.com/RoboIOTers/nuclave.git
cd nuclave

# Install dependencies
npm install

# Set up PostgreSQL (required)
cp .env.example .env.local
# Edit DATABASE_URL in .env.local

# Push database schema
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an arena, share the link.

### With AI Features (Optional)

```env
# Pick one AI provider for summaries + Skeptic AI
AI_PROVIDER=anthropic          # or "openai" or "ollama"
ANTHROPIC_API_KEY=sk-ant-xxx   # if using Anthropic
OPENAI_API_KEY=sk-xxx          # if using OpenAI
OLLAMA_BASE_URL=http://localhost:11434  # if using Ollama

# Embeddings (for semantic deduplication)
EMBEDDING_PROVIDER=openai      # or "ollama"
```

> **Without API keys, Nuclave still works.** The local keyword classifier and template-based Skeptic handle everything at zero cost. API keys unlock richer summaries and AI-powered classification.

### With OAuth (Optional)

```env
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

## Self-Hosting

### Docker Compose (Recommended)

```bash
git clone https://github.com/RoboIOTers/nuclave.git
cd nuclave
cp .env.example .env
# Edit .env with your config

docker compose up -d
```

This starts:
- **Nuclave app** on port 3000 (with Socket.io)
- **PostgreSQL 16** with pgvector extension
- **Redis 7** for real-time pub/sub

### Manual Deployment

```bash
npm install
npm run build
DATABASE_URL="postgres://..." npm run start:realtime
```

The `start:realtime` script runs the custom server with Socket.io support.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | SSR + client interactivity |
| Language | TypeScript | Type safety across the stack |
| Styling | Tailwind CSS v4 | Custom design tokens (ink/paper/accent) |
| Real-time | Socket.io | WebSocket with polling fallback |
| Database | PostgreSQL 17 | Relational integrity, JSONB, enums |
| ORM | Drizzle (schema) + raw SQL (queries) | Type-safe schema, performant queries |
| Vectors | pgvector | Cosine similarity for deduplication |
| Cache | Redis | Pub/sub backplane for scaling |
| AI | Anthropic / OpenAI / Ollama | Pluggable — bring your own keys |
| Auth | Custom OAuth + session cookies | GitHub, Google, anonymous guests |

## Project Structure

```
nuclave/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/                # User's arena dashboard
│   │   ├── decisions/                # Decision log browser
│   │   ├── arena/
│   │   │   ├── create/               # Arena creation + template picker
│   │   │   └── [id]/                 # Arena view (main session UI)
│   │   ├── join/[code]/              # Join via shareable link
│   │   └── api/
│   │       ├── arenas/               # CRUD, phase, export, close, signals, contributions, participants, skeptic
│   │       ├── ai/classify/          # Auto-classification endpoint
│   │       ├── auth/                 # GitHub + Google OAuth, sessions
│   │       ├── dashboard/            # User's arenas
│   │       ├── decisions/            # Decision log
│   │       └── integrations/slack/   # Slack webhook
│   ├── components/arena/
│   │   ├── contribution-input.tsx    # Zero-friction text input
│   │   ├── contribution-card.tsx     # Card with editable type tag + signals
│   │   ├── phase-stepper.tsx         # Visual 4-phase navigation bar
│   │   ├── phase-timer.tsx           # Countdown timer per phase
│   │   ├── summary-panel.tsx         # Live AI summary
│   │   ├── mobile-summary-toggle.tsx # Bottom sheet for mobile
│   │   ├── arena-header.tsx          # Header with export, share, participants
│   │   └── phase-banner.tsx          # Phase explanation banner
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── providers/            # Anthropic, OpenAI, Ollama
│   │   │   ├── engine.ts             # Summary + Skeptic generation
│   │   │   ├── classify-local.ts     # Weighted keyword classifier
│   │   │   ├── skeptic.ts            # Devil's advocate (template + AI)
│   │   │   └── dedup.ts              # Semantic deduplication (pgvector + Jaccard)
│   │   ├── db/                       # Drizzle schema + client
│   │   ├── realtime/                 # Socket.io client hook
│   │   ├── store.ts                  # PostgreSQL-backed data store
│   │   ├── auth.ts                   # OAuth + session management
│   │   └── templates.ts              # 6 arena templates
│   └── types/arena.ts                # Core type definitions
├── server.ts                         # Custom server with Socket.io
├── docker-compose.yml                # Full stack self-hosting
├── Dockerfile                        # Production container
├── drizzle.config.ts                 # Database config
└── drizzle/                          # Generated migrations
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/arenas` | Create a new arena |
| `GET` | `/api/arenas` | List arenas (optional `?creator=token`) |
| `GET` | `/api/arenas/:id` | Get arena with contributions + weighted signals |
| `POST` | `/api/arenas/:id/contributions` | Submit a contribution (auto-dedup check) |
| `PATCH` | `/api/arenas/:id/contributions/:cid` | Change contribution type |
| `POST` | `/api/arenas/:id/signals` | Toggle signal (auto-triggers Skeptic AI) |
| `POST` | `/api/arenas/:id/phase` | Set phase + optional timer duration |
| `POST` | `/api/arenas/:id/close` | Close arena + generate decision record |
| `POST` | `/api/arenas/:id/summary` | Generate AI summary |
| `POST` | `/api/arenas/:id/skeptic` | Manually trigger Skeptic AI |
| `GET` | `/api/arenas/:id/export?format=md\|json` | Export as Markdown or JSON |
| `GET` | `/api/arenas/:id/export/pdf` | Export as branded PDF document |
| `GET/POST` | `/api/arenas/:id/participants` | List/join participants with roles |
| `POST` | `/api/ai/classify` | Auto-classify text content |
| `GET` | `/api/arenas/join/:code` | Look up arena by join code |
| `GET` | `/api/dashboard?token=xxx` | User's arenas |
| `GET` | `/api/decisions` | List all decision records |
| `GET` | `/api/auth/github` | Start GitHub OAuth |
| `GET` | `/api/auth/google` | Start Google OAuth |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | End session |
| `POST` | `/api/integrations/slack` | Post summary to Slack webhook |

## Roadmap

### Done
- [x] Arena creation with structured contribution types
- [x] Zero-friction input with AI auto-classification
- [x] Manual type override (click tag to reclassify)
- [x] Real-time collaboration via Socket.io
- [x] Phase-based sessions with visual stepper (bi-directional)
- [x] Phase timer with countdown and auto-advance
- [x] Signal system (Agree / Critical / Challenge)
- [x] Weighted voting by participant role
- [x] Live Summary Panel (desktop sidebar + mobile bottom sheet)
- [x] Skeptic AI — auto-triggers during debate phase
- [x] Semantic deduplication (pgvector + Jaccard fallback)
- [x] Export: Markdown, JSON, branded PDF
- [x] Decision log — permanent records from closed arenas
- [x] Arena templates (6 pre-built)
- [x] Dashboard — browse all your arenas
- [x] No-account guest participation via shareable links
- [x] OAuth authentication (GitHub + Google)
- [x] Slack webhook integration
- [x] PostgreSQL persistence with pgvector
- [x] Docker Compose self-hosting

### Planned
- [ ] Stripe billing (Pro tier)
- [ ] Institutional Memory / Knowledge Graph
- [ ] Jira, Linear, Notion export integrations
- [ ] Embed mode (iframe for wikis)
- [ ] Public arena directory
- [ ] Slack bot (create arenas from Slack)
- [ ] Contribution threading
- [ ] Heatmap visualization
- [ ] Dark mode
- [ ] Broadcast mode (200+ participants)

## Contributing

Nuclave is open source under the AGPL-3.0 license. Contributions are welcome.

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/nuclave.git
cd nuclave
npm install
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[AGPL-3.0](LICENSE) — Free to use, modify, and self-host. Derivative works must remain open source.

---

<p align="center">
  <strong>NUCLAVE</strong> — Collective Intelligence Infrastructure<br />
  <a href="https://nuclave.com">nuclave.com</a>
</p>
