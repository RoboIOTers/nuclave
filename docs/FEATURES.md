# Nuclave — Feature Guide

## What You Can Do Right Now

### 1. Create an Arena
**URL:** https://nuclave.com/arena/create

- Type a title (e.g. "Q3 Feature Prioritization")
- Optionally add a description for context
- Pick a template (Sprint Retro, Product Critique, ADR, Post-Mortem, Feature Prioritization, or Open Brainstorm) — or skip for a blank arena
- Hit **Launch Arena** — you're in

### 2. Share the Link
- In the arena header, click **Share** — copies the join link
- Anyone with the link joins instantly, no account needed
- They land directly in the arena (no intermediate sign-up page)

### 3. Contribute
- Type anything in the text box at the top, press **Enter**
- AI auto-classifies it (benefit, risk, idea, blocker, checklist, question, decision, or wild card)
- If the AI gets the type wrong, **click the colored tag** on the contribution to change it
- All contributions appear in real-time across all browsers via Socket.io

### 4. Signal (React)
- In **Debate phase and beyond**, three buttons appear on each contribution:
  - **Agree** (thumbs up) — "This matters"
  - **Important** (lightning) — "Don't ignore this"
  - **Disagree** (question mark) — "I question this"
- In **Ideation phase**, signals are hidden to prevent anchoring bias

### 5. Navigate Phases
- The **phase stepper bar** below the header shows: `Ideation › Debate › Prioritize › Decision`
- Click any phase to jump to it (forward or backward)
- A **timer** shows elapsed time, or countdown if using a template with durations
- Phase changes broadcast to all participants

### 6. View Summary
- **Desktop**: right-side panel shows consensus items, contested items, blockers, open questions
- **Mobile**: tap the floating **Summary** button (bottom-right)
- Click the **refresh icon** or **Generate Summary** button to update it
- Auto-refreshes every 30 seconds

### 7. Skeptic AI
- When a contribution gets **2+ agrees during debate phase**, the Skeptic AI auto-generates a counter-point
- Shows as a card tagged "Skeptic AI" with a constructive challenge
- Works without API keys (template-based), richer with Claude/OpenAI configured

### 8. Export
- Header buttons: **MD** (Markdown), **JSON** (data dump), **PDF** (branded decision document)
- PDF opens in a new tab with a "Print / Save PDF" button

### 9. Close Arena
- Click **End** in the header bar
- Confirms, then generates a **permanent decision record** (agreed items, contested, blockers, questions, next actions)
- Opens the PDF decision document

### 10. Dashboard
**URL:** https://nuclave.com/dashboard
- Lists all arenas you created or participated in
- Shows phase, mode, contribution count, time ago
- Filter by active/closed

### 11. Decision Log
**URL:** https://nuclave.com/decisions
- All closed arenas generate a permanent record
- Expandable cards with full detail
- Links back to original arena

---

## What's Working But Needs API Keys (Optional)

| Feature | Without keys | With keys (Claude/OpenAI) |
|---------|-------------|--------------------------|
| Auto-classification | Keyword scoring (works well) | AI-powered (richer) |
| Skeptic AI | Template responses | Context-aware LLM responses |
| Summary | Simple aggregation | Natural language AI summary |
| Deduplication | Jaccard text similarity | Cosine similarity via embeddings |
| OAuth login | Guest tokens only | GitHub + Google login |

To enable, add keys to `.env.local`:
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## What's NOT Built Yet

| Feature | Description | Priority |
|---------|-------------|----------|
| Stripe billing | Pro tier at $12/mo, gate premium features | High |
| Institutional Memory | New arenas surface past decisions | High |
| Jira/Linear/Notion export | Turn decisions into tickets | Medium |
| Embed mode | iframe to embed arenas in wikis | Medium |
| Public arena directory | Browse open brainstorms | Medium |
| Slack bot | Create arenas from Slack commands | Medium |
| Contribution threading | Reply to specific contributions | Medium |
| Heatmap visualization | Visual consensus/tension grid | Low |
| Dark mode | Toggle for arena UI | Low |
| Broadcast mode | For 200+ contributors | Low |
| Notification system | Email/push on phase changes | Low |

---

## Typical Session Flow

```
1. Create arena (pick template or blank)          → /arena/create
2. Share link with team                            → click Share button
3. Everyone types thoughts, presses Enter          → Ideation phase
4. Facilitator clicks "Debate" in stepper          → signals become visible
5. Team reacts: agree / important / disagree       → Skeptic AI auto-triggers
6. Facilitator clicks "Prioritize"                 → highest-signal ideas rise
7. Facilitator clicks "Decision"                   → review summary panel
8. Click "End" → decision record generated         → PDF opens
9. View at /decisions anytime                      → permanent record
```
