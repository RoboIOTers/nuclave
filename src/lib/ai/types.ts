import type { ContributionType } from '@/types/arena';

export interface AIProvider {
  readonly name: string;

  /** Generate text completion */
  complete(prompt: string, options?: CompletionOptions): Promise<string>;

  /** Generate embedding vector for text */
  embed(text: string): Promise<number[]>;

  /** Batch embed multiple texts */
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface ClassificationResult {
  suggestedType: ContributionType;
  confidence: number;
  reasoning: string;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  similarity: number;
  matchingContributionId?: string;
  clusterId?: string;
}

export interface SummaryResult {
  consensusItems: string[];
  contestedItems: string[];
  unresolvedQuestions: string[];
  criticalBlockers: string[];
  topIdeasByType: Record<string, string[]>;
  narrativeSummary: string;
}

export interface SkepticResult {
  counterType: ContributionType;
  content: string;
  targetContributionId: string;
}
