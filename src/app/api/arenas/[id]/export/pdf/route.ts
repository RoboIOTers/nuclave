import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts } from '@/lib/store';
import { normalizePhaseHistory } from '@/lib/phase-history';
import postgres from 'postgres';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

function errorPage(message: string, status: number): NextResponse {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Nuclave — Export</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;color:#1a1a1a">
  <h1 style="font-size:20px">Couldn't generate the decision document</h1>
  <p style="color:#555;line-height:1.6">${escapeHtml(message)}</p>
  <p style="color:#888;font-size:13px">Your arena and its data are safe — only this export failed. Try again, or use the Markdown / JSON export instead.</p>
</body></html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Returns a styled HTML page designed for browser Print → PDF.
 * Clean, branded, professional decision document.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const arena = await getArena(id);

    if (!arena) {
      return errorPage('This arena does not exist or the link is invalid.', 404);
    }

    const rawContribs = await getContributions(id);
    const contributions = await Promise.all(
      rawContribs.map(async (c) => ({
        ...c,
        signals: await getSignalCounts(c.id),
      }))
    );

    // Group by type
    const byType: Record<string, typeof contributions> = {};
    for (const c of contributions) {
      if (!byType[c.type]) byType[c.type] = [];
      byType[c.type].push(c);
    }

    const typeLabels: Record<string, { label: string; emoji: string; color: string }> = {
      benefit: { label: 'Benefits', emoji: '✓', color: '#16a34a' },
      risk: { label: 'Risks', emoji: '⚠', color: '#dc2626' },
      feature: { label: 'Ideas & Features', emoji: '💡', color: '#eab308' },
      blocker: { label: 'Blockers', emoji: '🛑', color: '#b91c1c' },
      checklist: { label: 'Checklist', emoji: '☑', color: '#2563eb' },
      question: { label: 'Open Questions', emoji: '?', color: '#7c3aed' },
      decision: { label: 'Decision Points', emoji: '⚑', color: '#0d9488' },
      wildcard: { label: 'Wild Cards', emoji: '✦', color: '#d946ef' },
    };

    // Fetch phase timing (normalized to tolerate legacy double-encoded rows)
    const sql = getSql();
    const arenaRows = await sql`SELECT phase_history FROM arenas WHERE id = ${id}`;
    const phaseHistory = normalizePhaseHistory(arenaRows[0]?.phase_history);

    const formatMins = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}m ${s}s`;
    };

    const totalSessionTime = phaseHistory.reduce((sum, p) => sum + p.timeSpentSeconds, 0);

    // Build summary stats
    const totalAgree = contributions.reduce((sum, c) => sum + c.signals.agree, 0);
    const totalCritical = contributions.reduce((sum, c) => sum + c.signals.critical, 0);
    const topItems = [...contributions].sort((a, b) => b.signals.agree - a.signals.agree).slice(0, 5);
    const blockers = contributions.filter((c) => c.type === 'blocker');
    const questions = contributions.filter((c) => c.type === 'question');

    // Build sections HTML
    let sectionsHtml = '';
    for (const [type, items] of Object.entries(byType)) {
      const meta = typeLabels[type] ?? { label: type, emoji: '•', color: '#666' };
      const sorted = [...items].sort((a, b) => b.signals.agree - a.signals.agree);

      sectionsHtml += `
      <div class="section">
        <h2 style="color: ${meta.color}; border-bottom: 2px solid ${meta.color}; padding-bottom: 6px;">
          ${meta.emoji} ${meta.label} (${items.length})
        </h2>
        <table>
          <tr><th>Contribution</th><th style="width:60px">Agree</th><th style="width:60px">Critical</th><th style="width:60px">Challenge</th></tr>
          ${sorted
            .map(
              (c) => `
            <tr${c.isSkepticAi ? ' class="skeptic"' : ''}>
              <td>${escapeHtml(c.content)}${c.isSkepticAi ? ' <span class="badge-skeptic">Skeptic AI</span>' : ''}</td>
              <td class="num">${c.signals.agree || '-'}</td>
              <td class="num">${c.signals.critical || '-'}</td>
              <td class="num">${c.signals.challenge || '-'}</td>
            </tr>`
            )
            .join('')}
        </table>
      </div>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(arena.title)} — Nuclave Decision Document</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    @media print { body { padding: 20px; } .no-print { display: none; } }

    .header { border-bottom: 3px solid #0d0d0f; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .header h1 span { color: #e84a27; }
    .header .meta { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; }
    .header .title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; margin-top: 16px; }
    .header .desc { color: #555; font-style: italic; margin-top: 4px; }

    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
    .stat { border: 1px solid #ddd; padding: 12px; text-align: center; }
    .stat .num { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
    .stat .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }

    .executive { background: #f6f4ef; padding: 20px; margin-bottom: 30px; border-left: 3px solid #0d0d0f; }
    .executive h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 8px; }
    .executive ul { padding-left: 18px; }
    .executive li { margin-bottom: 4px; }

    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section h2 { font-size: 14px; font-weight: 700; margin-bottom: 10px; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; padding: 6px 8px; border-bottom: 2px solid #1a1a1a; }
    td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    .num { text-align: center; font-family: 'Inter', sans-serif; font-weight: 600; }
    .skeptic td { background: #fff5f5; }
    .badge-skeptic { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 9px; padding: 1px 5px; margin-left: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

    .footer { border-top: 1px solid #ddd; padding-top: 16px; margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; }

    .print-btn { position: fixed; top: 20px; right: 20px; background: #0d0d0f; color: white; border: none; padding: 10px 20px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; }
    .print-btn:hover { background: #333; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>

  <div class="header">
    <h1>NU<span>CLAVE</span></h1>
    <div class="meta">
      <span>Decision Document</span>
      <span>Phase: ${escapeHtml(arena.phase)}</span>
      <span>Mode: ${escapeHtml(arena.mode)}</span>
      <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
    <div class="title">${escapeHtml(arena.title)}</div>
    ${arena.description ? `<div class="desc">${escapeHtml(arena.description)}</div>` : ''}
  </div>

  <div class="stats">
    <div class="stat"><div class="num">${contributions.length}</div><div class="label">Contributions</div></div>
    <div class="stat"><div class="num">${Object.keys(byType).length}</div><div class="label">Categories</div></div>
    <div class="stat"><div class="num">${totalAgree}</div><div class="label">Total Agrees</div></div>
    <div class="stat"><div class="num">${totalCritical}</div><div class="label">Critical Flags</div></div>
  </div>

  ${phaseHistory.length > 0 ? `
  <div class="section" style="margin-bottom:20px;">
    <h2 style="font-size:14px;font-weight:700;margin-bottom:10px;">Phase Timing</h2>
    <table>
      <tr><th>Phase</th><th style="width:100px">Planned</th><th style="width:100px">Actual</th><th style="width:100px">Overtime</th></tr>
      ${phaseHistory.map((p) => `
        <tr>
          <td style="text-transform:capitalize">${escapeHtml(p.phase)}</td>
          <td class="num">${p.plannedSeconds ? formatMins(p.plannedSeconds) : '—'}</td>
          <td class="num">${formatMins(p.timeSpentSeconds)}</td>
          <td class="num" ${p.overtime > 0 ? 'style="color:#dc2626;font-weight:600"' : ''}>${p.overtime > 0 ? '+' + formatMins(p.overtime) : '—'}</td>
        </tr>
      `).join('')}
      <tr style="border-top:2px solid #1a1a1a;font-weight:600">
        <td>Total</td>
        <td class="num">${phaseHistory.some((p) => p.plannedSeconds) ? formatMins(phaseHistory.reduce((s, p) => s + (p.plannedSeconds ?? 0), 0)) : '—'}</td>
        <td class="num">${formatMins(totalSessionTime)}</td>
        <td class="num" ${phaseHistory.reduce((s, p) => s + p.overtime, 0) > 0 ? 'style="color:#dc2626;font-weight:600"' : ''}>${phaseHistory.reduce((s, p) => s + p.overtime, 0) > 0 ? '+' + formatMins(phaseHistory.reduce((s, p) => s + p.overtime, 0)) : '—'}</td>
      </tr>
    </table>
  </div>
  ` : ''}

  <div class="executive">
    <h2>Executive Summary</h2>
    ${topItems.length > 0 ? `<p><strong>Top consensus items:</strong></p><ul>${topItems.map((c) => `<li>${escapeHtml(c.content)} <em>(${c.signals.agree} agrees)</em></li>`).join('')}</ul>` : ''}
    ${blockers.length > 0 ? `<p style="margin-top:10px"><strong>Blockers (${blockers.length}):</strong></p><ul>${blockers.map((c) => `<li>${escapeHtml(c.content)}</li>`).join('')}</ul>` : ''}
    ${questions.length > 0 ? `<p style="margin-top:10px"><strong>Open questions (${questions.length}):</strong></p><ul>${questions.map((c) => `<li>${escapeHtml(c.content)}</li>`).join('')}</ul>` : ''}
  </div>

  ${sectionsHtml}

  <div class="footer">
    Generated by <strong>Nuclave</strong> — Collective Intelligence Platform — nuclave.com
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch {
    return errorPage('An unexpected error occurred while building the document.', 500);
  }
}

function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
