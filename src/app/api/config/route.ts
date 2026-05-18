import { NextResponse } from 'next/server';

// Exposes non-secret server configuration to the client.
// Used by the arena creation flow so the privacy choice can name the
// actual AI provider instead of hardcoding "OpenAI".
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  ollama: 'a self-hosted Ollama model',
};

export async function GET() {
  const aiProvider = process.env.AI_PROVIDER ?? 'anthropic';

  return NextResponse.json({
    success: true,
    data: {
      aiProvider,
      aiProviderLabel: PROVIDER_LABELS[aiProvider] ?? aiProvider,
    },
  });
}
