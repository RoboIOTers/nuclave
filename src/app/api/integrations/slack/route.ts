import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts } from '@/lib/store';

/**
 * POST /api/integrations/slack
 * Send arena summary to a Slack webhook URL.
 * Body: { arenaId: string, webhookUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { arenaId, webhookUrl } = await request.json();

    if (!arenaId || !webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'arenaId and webhookUrl are required' },
        { status: 400 }
      );
    }

    const arena = await getArena(arenaId);
    if (!arena) {
      return NextResponse.json(
        { success: false, error: 'Arena not found' },
        { status: 404 }
      );
    }

    const rawContribs = await getContributions(arenaId);
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

    const typeEmoji: Record<string, string> = {
      benefit: ':white_check_mark:',
      risk: ':warning:',
      feature: ':bulb:',
      blocker: ':octagonal_sign:',
      checklist: ':ballot_box_with_check:',
      question: ':question:',
      decision: ':triangular_flag_on_post:',
      wildcard: ':sparkles:',
    };

    // Build Slack blocks
    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Nuclave: ${arena.title}` },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Phase:* ${arena.phase} | *Contributions:* ${contributions.length} | *Mode:* ${arena.mode}`,
        },
      },
      { type: 'divider' },
    ];

    for (const [type, items] of Object.entries(byType)) {
      const emoji = typeEmoji[type] ?? ':speech_balloon:';
      const sorted = items.sort((a, b) => b.signals.agree - a.signals.agree);
      const top = sorted.slice(0, 3);

      const lines = top.map(
        (c) => `${emoji} ${c.content} _(+${c.signals.agree} -${c.signals.challenge})_`
      );

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${type.charAt(0).toUpperCase() + type.slice(1)}* (${items.length})\n${lines.join('\n')}`,
        },
      });
    }

    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nuclave.com'}/arena/${arenaId}|View full arena> | <${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nuclave.com'}/join/${arena.joinCode}|Join session>`,
        },
      }
    );

    // Send to Slack
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!slackRes.ok) {
      const err = await slackRes.text();
      return NextResponse.json(
        { success: false, error: `Slack webhook failed: ${err}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { sent: true } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to send to Slack' },
      { status: 500 }
    );
  }
}
