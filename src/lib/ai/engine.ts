import { getCompletionProvider, getEmbeddingProvider } from './index';
import type {
  ClassificationResult,
  SummaryResult,
  SkepticResult,
} from './types';
import type { ContributionType } from '@/types/arena';

const SYSTEM_PROMPT = `You are the Nuclave AI engine — a structural intelligence system for collaborative brainstorming. You analyze, classify, deduplicate, and summarize group contributions. You are precise, concise, and always respond in valid JSON.`;

/**
 * Classify a contribution's type based on its content.
 * Returns the AI-suggested type and confidence.
 */
export async function classifyContribution(
  content: string,
  userSelectedType: ContributionType
): Promise<ClassificationResult> {
  const ai = getCompletionProvider();
  const prompt = `Classify this brainstorming contribution. The user tagged it as "${userSelectedType}".

Contribution: "${content}"

Available types: benefit, risk, feature, blocker, checklist, question, decision, wildcard

Respond with JSON only:
{"suggestedType": "<type>", "confidence": <0-1>, "reasoning": "<brief reason>"}`;

  const response = await ai.complete(prompt, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 200,
  });

  return JSON.parse(response);
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate embedding for a contribution.
 */
export async function embedContribution(content: string): Promise<number[]> {
  const embedder = getEmbeddingProvider();
  return embedder.embed(content);
}

/**
 * Generate a live summary of all contributions in an arena.
 */
export async function generateSummary(
  contributions: Array<{
    id: string;
    type: ContributionType;
    content: string;
    signals: { agree: number; critical: number; challenge: number };
  }>
): Promise<SummaryResult> {
  const ai = getCompletionProvider();

  const contributionList = contributions
    .map(
      (c) =>
        `[${c.type.toUpperCase()}] (agree:${c.signals.agree} critical:${c.signals.critical} challenge:${c.signals.challenge}) ${c.content}`
    )
    .join('\n');

  const prompt = `Analyze these ${contributions.length} brainstorming contributions and generate a structured summary.

CONTRIBUTIONS:
${contributionList}

Generate a JSON summary with these fields:
- consensusItems: items with high agreement (strings, max 5)
- contestedItems: items with significant split signals (strings, max 5)
- unresolvedQuestions: open questions that need answers (strings)
- criticalBlockers: items flagged as critical (strings)
- topIdeasByType: top 3 ideas per contribution type (object: type -> string[])
- narrativeSummary: 2-3 sentence plain language summary of where the group stands

Respond with valid JSON only.`;

  const response = await ai.complete(prompt, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.4,
    maxTokens: 2048,
  });

  return JSON.parse(response);
}

/**
 * Generate a Skeptic AI counter-contribution for a high-consensus item.
 */
export async function generateSkepticResponse(
  contribution: {
    id: string;
    type: ContributionType;
    content: string;
    consensusScore: number;
  },
  arenaContext: string
): Promise<SkepticResult> {
  const ai = getCompletionProvider();

  const counterTypeMap: Partial<Record<ContributionType, ContributionType>> = {
    benefit: 'risk',
    risk: 'benefit',
    feature: 'question',
    blocker: 'feature',
  };
  const counterType = counterTypeMap[contribution.type] ?? 'question';

  const prompt = `You are the Skeptic AI — your job is to prevent groupthink by constructively challenging high-consensus ideas.

Arena context: ${arenaContext}

This contribution has reached ${contribution.consensusScore}% consensus:
[${contribution.type.toUpperCase()}] "${contribution.content}"

Generate a thoughtful counter-point as a "${counterType}" type contribution. Frame it as a question, not an assertion. Be specific and constructive, not contrarian for its own sake.

Respond with JSON:
{"counterType": "${counterType}", "content": "<your counter-contribution>", "targetContributionId": "${contribution.id}"}`;

  const response = await ai.complete(prompt, {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.8,
    maxTokens: 300,
  });

  return JSON.parse(response);
}
