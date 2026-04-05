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
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License" />
  <img src="https://img.shields.io/badge/next.js-16-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/typescript-5-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/socket.io-realtime-green" alt="Socket.io" />
</p>

---

## What is Nuclave?

Nuclave is an open-source, real-time collaborative brainstorming platform. Instead of free-form sticky notes that end in chaos, Nuclave **automatically structures** every contribution using AI, so your team ends with actionable decisions — not a messy whiteboard.

**The problem:** Research shows 50-90 unique opinions surface in traditional group sessions. Switch to anonymous digital dialogue? That number doubles to 130-190. Half of what your team thinks never gets said.

**The fix:** Nuclave gives everyone a voice. Type your thought, hit Enter. AI categorizes it. The group signals what matters. A live summary builds itself.

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

Tap the tag to change it if the AI got it wrong.

### Real-Time Collaboration
- **Socket.io** powered — contributions appear instantly across all browsers
- **No account required** — share a link, your team joins immediately
- **Anonymous by default** — eliminates the HiPPO effect (Highest Paid Person's Opinion)

### Phase-Based Sessions
Science-backed facilitation structure built into every session:

1. **Ideation** — Signals hidden. Ideas flow without influence.
2. **Debate** — Reactions revealed. Agree, challenge, or flag as critical.
3. **Prioritization** — The most-signaled ideas rise to the top.
4. **Decision** — Facilitator finalizes. Session ends with a document.

### Live Summary Panel
A continuously updating brief showing:
- Consensus zone (what the group agrees on)
- Contested items (where opinions split)
- Critical blockers
- Open questions
- Plain-language narrative summary

### AI-Powered Intelligence
- **Auto-classification** — Keyword scoring with AI provider fallback (Claude, OpenAI, or Ollama)
- **Pluggable providers** — Bring your own API keys, or run fully offline with Ollama
- **Skeptic AI** (coming soon) — An AI participant that challenges groupthink

### Export
One-click export as **Markdown** or **JSON**, structured by contribution type with signal counts.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/RoboIOTers/nuclave.git
cd nuclave

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an arena, share the link.

### With AI Classification (Optional)

Copy the environment file and add your API keys:

```bash
cp .env.example .env.local
```

```env
# Pick one AI provider for summaries
AI_PROVIDER=anthropic          # or "openai" or "ollama"
ANTHROPIC_API_KEY=sk-ant-xxx   # if using Anthropic
OPENAI_API_KEY=sk-xxx          # if using OpenAI
OLLAMA_BASE_URL=http://localhost:11434  # if using Ollama

# Embeddings (for deduplication)
EMBEDDING_PROVIDER=openai      # or "ollama"
```

> **Without API keys, Nuclave still works.** The local keyword classifier handles auto-categorization at zero cost. AI keys unlock richer summaries and the Skeptic AI.

## Self-Hosting

### Docker Compose (Recommended)

```bash
# Clone and configure
git clone https://github.com/RoboIOTers/nuclave.git
cd nuclave
cp .env.example .env

# Edit .env with your AI keys (optional)

# Launch everything
docker compose up -d
```

This starts:
- **Nuclave app** on port 3000
- **PostgreSQL 16** with pgvector extension
- **Redis 7** for real-time pub/sub

### Manual Deployment

```bash
npm install
npm run build
npm run start:realtime  # Starts with Socket.io support
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | SSR + client interactivity |
| Language | TypeScript | Type safety across the stack |
| Styling | Tailwind CSS v4 | Fast iteration, custom design tokens |
| Real-time | Socket.io | WebSocket with automatic fallback |
| Database | PostgreSQL + Drizzle ORM | Relational integrity + type-safe queries |
| Vectors | pgvector | Embedding storage for deduplication |
| Cache | Redis | Pub/sub backplane for horizontal scaling |
| AI | Anthropic / OpenAI / Ollama | Pluggable — choose your provider |

## Project Structure

```
nuclave/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── arena/
│   │   │   ├── create/         # Arena creation
│   │   │   └── [id]/           # Arena view (main session UI)
│   │   ├── join/[code]/        # Join via shareable link
│   │   └── api/                # REST API routes
│   │       ├── arenas/         # CRUD + phase + export
│   │       └── ai/classify/    # Auto-classification endpoint
│   ├── components/arena/       # Arena UI components
│   ├── lib/
│   │   ├── ai/                 # AI provider abstraction
│   │   │   ├── providers/      # Anthropic, OpenAI, Ollama
│   │   │   ├── engine.ts       # Summary, Skeptic, classification
│   │   │   └── classify-local.ts  # Zero-cost keyword classifier
│   │   ├── db/                 # Drizzle schema + client
│   │   ├── realtime/           # Socket.io client hook
│   │   └── store.ts            # In-memory store (MVP)
│   └── types/arena.ts          # Core type definitions
├── server.ts                   # Custom server (Socket.io)
├── docker-compose.yml          # Full stack self-hosting
├── Dockerfile                  # Production container
└── drizzle.config.ts           # Database migrations
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/arenas` | Create a new arena |
| `GET` | `/api/arenas/:id` | Get arena with contributions |
| `POST` | `/api/arenas/:id/contributions` | Submit a contribution |
| `POST` | `/api/arenas/:id/signals` | Toggle a signal (agree/critical/challenge) |
| `POST` | `/api/arenas/:id/phase` | Advance session phase |
| `POST` | `/api/arenas/:id/summary` | Generate AI summary |
| `GET` | `/api/arenas/:id/export?format=markdown` | Export session |
| `POST` | `/api/ai/classify` | Auto-classify text |
| `GET` | `/api/arenas/join/:code` | Look up arena by join code |

## Roadmap

- [x] Arena creation + structured contribution types
- [x] Real-time via Socket.io
- [x] AI auto-classification (local + API)
- [x] Phase-based sessions (Ideation / Debate / Prioritization / Decision)
- [x] Signal system (Agree / Critical / Challenge)
- [x] Live Summary Panel
- [x] Export (Markdown / JSON)
- [x] No-account guest participation
- [x] Docker Compose self-hosting
- [ ] PostgreSQL persistence (currently in-memory)
- [ ] Skeptic AI (Devil's Advocate)
- [ ] Semantic deduplication + clustering
- [ ] OAuth authentication (GitHub, Google)
- [ ] Weighted voting by role
- [ ] Integrations (Slack, Jira, Linear, Notion)
- [ ] Institutional Memory / Knowledge Graph
- [ ] Mobile-optimized UI

## Contributing

Nuclave is open source under the AGPL-3.0 license. Contributions are welcome.

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/nuclave.git
cd nuclave
npm install
npm run dev
```

Before submitting a PR:
1. Run `npm run build` to verify no TypeScript errors
2. Test your changes across at least 2 browsers
3. Keep PRs focused — one feature or fix per PR

## License

[AGPL-3.0](LICENSE) — Free to use, modify, and self-host. Derivative works must remain open source.

---

<p align="center">
  <strong>NUCLAVE</strong> — Collective Intelligence Infrastructure<br />
  <a href="https://nuclave.com">nuclave.com</a>
</p>
