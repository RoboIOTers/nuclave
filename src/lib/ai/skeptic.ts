import type { ContributionType } from '@/types/arena';

/**
 * Skeptic AI — generates counter-contributions to challenge high-consensus ideas.
 * Works without API keys using template-based responses.
 * When AI provider is configured, uses LLM for richer responses.
 */

interface SkepticInput {
  id: string;
  type: ContributionType;
  content: string;
  agreeCount: number;
}

interface SkepticOutput {
  type: ContributionType;
  content: string;
  parentContributionId: string;
}

const COUNTER_TYPE: Partial<Record<ContributionType, ContributionType>> = {
  benefit: 'risk',
  risk: 'benefit',
  feature: 'question',
  blocker: 'feature',
  decision: 'question',
};

const TEMPLATES: Record<string, string[]> = {
  benefit_to_risk: [
    'Counter-point: "{content}" — but have we considered the cost or complexity of maintaining this?',
    'While "{content}" sounds positive, what happens when this assumption breaks at scale?',
    'Playing devil\'s advocate: "{content}" — is this a short-term benefit that creates long-term debt?',
  ],
  risk_to_benefit: [
    'On the flip side of "{content}" — could this constraint actually force a simpler, better design?',
    'The risk "{content}" might be overstated. What evidence do we have that this will actually occur?',
    'What if we reframe this: "{content}" — is there a way to turn this risk into an advantage?',
  ],
  feature_to_question: [
    'Before building this: "{content}" — what problem does this solve for users, specifically?',
    'Regarding "{content}" — do we have data showing users actually need this, or is it assumed?',
    'If we ship "{content}", what do we NOT ship instead? What\'s the opportunity cost?',
  ],
  blocker_to_feature: [
    'What if the blocker "{content}" could be solved with a simpler workaround for now?',
    'Is "{content}" truly a blocker, or could we ship without it and address it in v2?',
    'Could we break "{content}" into smaller pieces — which part is the actual blocker vs. nice-to-have?',
  ],
  decision_to_question: [
    'Before deciding on "{content}" — what information are we still missing to make this call confidently?',
    'For "{content}" — have we explored a third option that might be better than either choice?',
    'What would need to be true for the opposite of "{content}" to be the right call?',
  ],
  generic: [
    'Have we stress-tested the assumption behind "{content}"?',
    'What\'s the strongest argument against "{content}"?',
    'If "{content}" turns out to be wrong, what\'s our fallback?',
  ],
};

function pickTemplate(fromType: ContributionType): string[] {
  const key = `${fromType}_to_${COUNTER_TYPE[fromType] ?? 'question'}`;
  return TEMPLATES[key] ?? TEMPLATES.generic;
}

/**
 * Generate a skeptic response using templates.
 * Returns null if the contribution shouldn't be challenged.
 */
export function generateSkepticLocal(input: SkepticInput): SkepticOutput | null {
  // Only challenge contributions with enough agreement
  if (input.agreeCount < 2) return null;

  // Don't challenge questions, checklists, or wildcards
  if (['question', 'checklist', 'wildcard'].includes(input.type)) return null;

  const templates = pickTemplate(input.type);
  const template = templates[Math.floor(Math.random() * templates.length)];
  const content = template.replace(/\{content\}/g, truncate(input.content, 80));
  const counterType = COUNTER_TYPE[input.type] ?? 'question';

  return {
    type: counterType,
    content,
    parentContributionId: input.id,
  };
}

/**
 * Generate a skeptic response using AI provider (richer, context-aware).
 */
export async function generateSkepticAI(
  input: SkepticInput,
  arenaTitle: string
): Promise<SkepticOutput | null> {
  if (input.agreeCount < 2) return null;
  if (['question', 'checklist', 'wildcard'].includes(input.type)) return null;

  try {
    const { getCompletionProvider } = await import('./index');
    const ai = getCompletionProvider();
    const counterType = COUNTER_TYPE[input.type] ?? 'question';

    const prompt = `You are the Skeptic AI in a brainstorming session about "${arenaTitle}".

A ${input.type} contribution has high agreement: "${input.content}"

Generate ONE thoughtful counter-point as a "${counterType}" type. Frame it as a question. Be specific, constructive, and concise (under 150 chars). Do not repeat the original contribution. Reply with just the counter-point text, nothing else.`;

    const response = await ai.complete(prompt, {
      temperature: 0.8,
      maxTokens: 200,
      systemPrompt: 'You are a concise, constructive devil\'s advocate. Always respond with a single sentence.',
    });

    return {
      type: counterType,
      content: response.trim(),
      parentContributionId: input.id,
    };
  } catch {
    // Fall back to template
    return generateSkepticLocal(input);
  }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
