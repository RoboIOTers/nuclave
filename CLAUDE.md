@AGENTS.md

# Nuclave — Collective Intelligence Platform

## Project Overview
Nuclave is an open-source, real-time collaborative structured brainstorming platform.
Contributors type a thought, AI auto-classifies it, the group signals what matters,
and the session ends with a structured decision document.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 with custom theme (ink/paper/accent palette)
- **Database**: PostgreSQL 17 + pgvector (embeddings for deduplication)
- **Queries**: Raw SQL via `postgres` library (not Drizzle queries — schema only)
- **Real-time**: Socket.io via custom server (server.ts)
- **AI**: Pluggable — Anthropic Claude, OpenAI, Ollama. Local keyword classifier as zero-cost default.
- **Auth**: Custom OAuth (GitHub, Google) + anonymous guest tokens
- **Self-hosting**: Docker Compose (PostgreSQL + Redis + App)

## Key Directories
- `src/app/` — Next.js App Router: pages + 30 API routes
- `src/app/api/arenas/` — Arena CRUD, contributions, signals, phase, export, close, skeptic, participants
- `src/app/api/auth/` — GitHub + Google OAuth, sessions
- `src/app/api/integrations/` — Slack webhook
- `src/components/arena/` — Arena UI: input, cards, stepper, timer, summary, header
- `src/lib/ai/` — Providers (anthropic, openai, ollama), classifier, skeptic, dedup engine
- `src/lib/store.ts` — PostgreSQL-backed data store (all DB queries here)
- `src/lib/auth.ts` — OAuth + session management
- `src/lib/templates.ts` — 6 arena templates
- `src/types/arena.ts` — Core TypeScript types

## Architecture Decisions
- **Single deployable** — No separate microservices. AI calls external APIs from TypeScript.
- **PostgreSQL-backed store** — `src/lib/store.ts` wraps raw SQL. Data persists across restarts.
- **Zero-friction input** — User types and presses Enter. AI classifies AFTER submit, not before.
- **Socket.io custom server** — `server.ts` attaches Socket.io to Next.js HTTP server
- **globalThis for singletons** — DB connection and Socket.io instance stored on globalThis
- **AGPL-3.0 license** — open-source core, cloud premium (PostHog model)

## Database
- PostgreSQL 17 on localhost:5432, database `nuclave`, user `nuclave`
- Tables: arenas, contributions, signals, participants, decisions, auth_users, auth_sessions
- pgvector extension installed for embedding similarity search
- Schema managed via Drizzle (generation only), queries via raw SQL in store.ts

## Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start:realtime` — Production with Socket.io (uses server.ts)
- `npx drizzle-kit generate` — Generate migration SQL
- `docker compose up` — Full stack (PG + Redis + App)

## Live Deployment
- Running at https://nuclave.com on port 3002 behind nginx
- Managed by pm2 (app `nuclave`) running `server.ts` with `NODE_ENV=production`
- Secrets (`DATABASE_URL`, API keys) come from `.env.local` (gitignored) — never hardcode them; see `.env.example` for the required variables
- Rebuild + redeploy: `npm run build && pm2 restart nuclave`
- nginx config at /etc/nginx/sites-enabled/nuclave.com
- SSL via Let's Encrypt (auto-renew)
