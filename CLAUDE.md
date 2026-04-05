@AGENTS.md

# Nuclave — Collective Intelligence Platform

## Project Overview
Nuclave is an open-source, real-time collaborative structured brainstorming platform.
Contributors submit ideas tagged by type, and AI continuously deduplicates, clusters,
and summarizes contributions into actionable intelligence.

## Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 with custom theme (ink/paper/accent palette)
- **Database**: PostgreSQL + Drizzle ORM + pgvector (for embeddings)
- **Real-time**: Socket.io + Redis Pub/Sub (planned)
- **AI**: Pluggable providers — Anthropic Claude, OpenAI, Ollama (local)
- **Self-hosting**: Docker Compose (PostgreSQL + Redis + App)

## Key Directories
- `src/app/` — Next.js App Router pages and API routes
- `src/components/arena/` — Arena UI components (contribution input, cards, summary)
- `src/lib/ai/` — AI provider abstraction (classification, dedup, summary, skeptic)
- `src/lib/db/` — Drizzle ORM schema and database client
- `src/types/` — Shared TypeScript types (arena, contribution, signal types)

## Architecture Decisions
- **Monorepo, single deployable** — no separate Python microservice for AI
- **In-memory store for MVP** — API routes use in-memory Maps; migrate to Drizzle+PG
- **Structured tagging at input** — all contributions must have a type (8 types)
- **AGPL-3.0 license** — open-source core, cloud premium (PostHog model)

## Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npx drizzle-kit generate` — Generate DB migrations
- `npx drizzle-kit push` — Push schema to database
- `docker compose up` — Start full stack (PG + Redis + App)
