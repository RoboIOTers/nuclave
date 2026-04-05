# Contributing to Nuclave

Thanks for your interest in contributing to Nuclave! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/RoboIOTers/nuclave.git
cd nuclave
npm install
npm run dev
```

The dev server runs at http://localhost:3000.

## Making Changes

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/your-feature`
3. **Make your changes** — keep them focused
4. **Build** to check for errors: `npm run build`
5. **Test** across at least 2 browsers (contributions are real-time)
6. **Commit** with a clear message: `feat: add dark mode toggle`
7. **Push** and open a Pull Request

## Commit Convention

```
feat: add new feature
fix: fix a bug
refactor: restructure code without changing behavior
docs: update documentation
chore: tooling, dependencies, config
```

## Project Architecture

- **`src/app/`** — Next.js App Router (pages + API routes)
- **`src/components/arena/`** — Arena UI (input, cards, summary, header)
- **`src/lib/ai/`** — AI providers + classification engine
- **`src/lib/db/`** — Database schema (Drizzle ORM)
- **`src/lib/realtime/`** — Socket.io client hook
- **`src/lib/store.ts`** — In-memory data store (to be replaced with PostgreSQL)
- **`server.ts`** — Custom server with Socket.io

## What to Work On

Check the [Roadmap](README.md#roadmap) for open items. Good first issues:

- Improve the local keyword classifier (`src/lib/ai/classify-local.ts`)
- Add new arena templates
- Mobile responsive improvements
- Accessibility improvements
- Add tests

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Immutable state updates
- No `console.log` in production code
- Tailwind CSS for styling (no CSS modules)

## Questions?

Open an issue or start a discussion. We're friendly.
