import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const arena = await getArena(id);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  const format = request.nextUrl.searchParams.get('format') ?? 'markdown';
  const rawContributions = await getContributions(id);
  const contributions = await Promise.all(
    rawContributions.map(async (c) => ({
      ...c,
      signals: await getSignalCounts(c.id),
    }))
  );

  if (format === 'json') {
    return new NextResponse(
      JSON.stringify({ arena, contributions }, null, 2),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="nuclave-${arena.joinCode}.json"`,
        },
      }
    );
  }

  // Markdown export
  const lines: string[] = [];
  lines.push(`# ${arena.title}`);
  lines.push('');
  if (arena.description) {
    lines.push(`> ${arena.description}`);
    lines.push('');
  }
  lines.push(`**Type:** ${arena.type} | **Mode:** ${arena.mode} | **Phase:** ${arena.phase}`);
  lines.push(`**Contributions:** ${contributions.length} | **Created:** ${arena.createdAt}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by type
  const byType: Record<string, typeof contributions> = {};
  for (const c of contributions) {
    if (!byType[c.type]) byType[c.type] = [];
    byType[c.type].push(c);
  }

  const typeLabels: Record<string, string> = {
    benefit: 'Benefits / Pros',
    risk: 'Risks / Cons',
    feature: 'Features / Ideas',
    blocker: 'Blockers / Critical',
    checklist: 'Checklist Items',
    question: 'Open Questions',
    decision: 'Decision Points',
    wildcard: 'Wild Cards',
  };

  for (const [type, items] of Object.entries(byType)) {
    lines.push(`## ${typeLabels[type] ?? type}`);
    lines.push('');
    for (const item of items) {
      const s = item.signals;
      const signalStr = `[+${s.agree} / !${s.critical} / ?${s.challenge}]`;
      lines.push(`- ${item.content} ${signalStr}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Exported from [Nuclave](https://nuclave.com) on ${new Date().toISOString()}*`);

  const markdown = lines.join('\n');

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="nuclave-${arena.joinCode}.md"`,
    },
  });
}
