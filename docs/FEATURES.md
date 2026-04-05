# Nuclave — Feature Guide

## What You Can Do Right Now

### 1. Create an Arena
**URL:** https://nuclave.com/arena/create

- Type a title (e.g. "Q3 Feature Prioritization")
- Optionally add a description for context
- Pick a template (Sprint Retro, Product Critique, ADR, Post-Mortem, Feature Prioritization, or Open Brainstorm) — or skip for a blank arena
- Hit **Launch Arena** — you're in

### 2. AI Privacy Toggle
In advanced options when creating an arena:
- **AI On** (default) — Full OpenAI integration for classification, summaries, Skeptic AI, improve suggestions. Contribution text is sent to OpenAI.
- **AI Off** — Fully private. All processing stays on the server. Local keyword classifier, template-based Skeptic, simple aggregation. Zero data leaves your infrastructure.

### 3. Share the Link
- In the arena header, click **Share** — copies the join link
- Anyone with the link joins instantly, no account needed
- They land directly in the arena (no intermediate sign-up page)

### 4. Contribute
- Type anything in the text box at the top, press **Enter**
- AI auto-classifies it (benefit, risk, idea, blocker, checklist, question, decision, or wild card)
- If the AI gets the type wrong, **click the colored tag** on the contribution to change it
- **Click the contribution text** to edit it inline — edits sync in real-time to all browsers
- While editing, click **"Improve with AI"** for a cleaner rewrite suggestion (AI-enabled arenas only)
- All contributions appear in real-time across all browsers via Socket.io

### 5. Signal (React)
- In **Debate phase and beyond**, three buttons appear on each contribution:
  - **Agree** (thumbs up) — "This matters"
  - **Important** (lightning) — "Don't ignore this"
  - **Disagree** (question mark) — "I question this"
- In **Ideation phase**, signals are hidden to prevent anchoring bias
- Signals have weighted voting: Expert 2x, Facilitator 1.5x, Contributor 1x, Observer 0x

### 6. Navigate Phases
- The **phase stepper bar** below the header shows: `Ideation › Debate › Prioritize › Decision`
- Click any phase to jump to it (forward or backward)
- Timer continues from where you left off when switching back to a previous phase
- After countdown expires, timer shows **overtime in red** (`+1:23 over`)
- Phase changes broadcast to all participants

### 7. Three View Modes
Toggle in the filter bar:
- **List** — Traditional contribution feed (default)
- **Map** — Force-directed bubble visualization
  - Each bubble = one contribution
  - Size: more agrees = bigger, more disagrees = smaller
  - Glow: more "important" signals = brighter glow rings
  - Lines connect similar contributions
  - Hover for full details
- **Clusters** — Contributions grouped by AI-detected themes or by type

### 8. View Summary
- **Desktop**: right-side panel shows consensus items, contested items, blockers, open questions
- **Mobile**: tap the floating **Summary** button (bottom-right)
- Click the **refresh icon** or **Generate Summary** button to update it
- Auto-refreshes every 30 seconds

### 9. Skeptic AI
- When a contribution gets **2+ agrees during debate phase**, the Skeptic AI auto-generates a counter-point
- Shows as a card tagged "Skeptic AI" with a constructive challenge
- Works without API keys (template-based), richer with OpenAI configured
- Only triggers in AI-enabled arenas

### 10. Institutional Memory
- When you open an arena, a blue banner shows **related past decisions** from closed arenas
- "Your team discussed related topics before" — with links to previous arenas
- Uses embedding similarity (OpenAI) or text search fallback
- Dismissable if not relevant
- Builds over time — the more arenas you close, the smarter it gets

### 11. Export
- Header buttons: **MD** (Markdown), **JSON** (data dump), **PDF** (branded decision document)
- PDF includes **phase timing table**: planned vs actual vs overtime per phase
- PDF opens in a new tab with a "Print / Save PDF" button

### 12. Close Arena
- Click **End** in the header bar
- Confirms, then generates a **permanent decision record** (agreed items, contested, blockers, questions, next actions)
- Records time spent in each phase with overtime tracking
- Stores arena knowledge for Institutional Memory
- Opens the PDF decision document

### 13. Dashboard
**URL:** https://nuclave.com/dashboard
- Lists all arenas you created or participated in
- Shows phase, mode, contribution count, time ago
- Filter by active/closed

### 14. Decision Log
**URL:** https://nuclave.com/decisions
- All closed arenas generate a permanent record
- Expandable cards with full detail
- Links back to original arena

---

## Free Tier Limits

| | Free | Pro | Enterprise |
|--|------|-----|-----------|
| Contributors per arena | 5 | 50 | 500 |
| Active arenas | 5 | Unlimited | Unlimited |
| AI features | Yes | Yes | Yes |
| Price | $0 | $12/mo | Custom |

When limits are hit, users see an upgrade prompt.

---

## AI Privacy

| | AI On (default) | AI Off |
|--|----------------|--------|
| Classification | OpenAI GPT-4o-mini | Local keyword scoring |
| Summary | AI narrative | Simple aggregation |
| Skeptic AI | Fires automatically | Does not trigger |
| Improve with AI | Available | Button disabled |
| Embeddings | OpenAI text-embedding-3-small | Jaccard text only |
| Data sent externally | Yes (to OpenAI) | No — fully private |

OpenAI does NOT use API data to train models. Data retained 30 days for abuse monitoring, then deleted.

---

## Typical Session Flow

```
1. Create arena (pick template, choose AI on/off)  → /arena/create
2. Share link with team                             → click Share button
3. Everyone types thoughts, presses Enter           → Ideation phase (signals hidden)
4. Click "Debate" in stepper                        → signals become visible
5. Team reacts: agree / important / disagree        → Skeptic AI auto-triggers
6. Switch to Map view to see bubble visualization   → click Map toggle
7. Click "Prioritize"                               → highest-signal ideas rise
8. Click "Decision"                                 → review summary panel
9. Click "End" → decision record generated          → PDF opens
10. View at /decisions anytime                      → permanent record
11. Next arena surfaces related past decisions      → Institutional Memory
```

---

## What's NOT Built Yet

| Feature | Description | Priority |
|---------|-------------|----------|
| Stripe billing | Pro tier at $12/mo, gate premium features | High |
| Jira/Linear/Notion export | Turn decisions into tickets | Medium |
| Embed mode | iframe to embed arenas in wikis | Medium |
| Public arena directory | Browse open brainstorms | Medium |
| Slack bot | Create arenas from Slack commands | Medium |
| Contribution threading | Reply to specific contributions | Medium |
| Dark mode | Toggle for arena UI | Low |
| Broadcast mode | For 200+ contributors | Low |
| Notification system | Email/push on phase changes | Low |
