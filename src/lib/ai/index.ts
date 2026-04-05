import type { AIProvider } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';

let completionProvider: AIProvider | null = null;
let embeddingProvider: AIProvider | null = null;

export function getCompletionProvider(): AIProvider {
  if (completionProvider) return completionProvider;

  const provider = process.env.AI_PROVIDER ?? 'anthropic';

  switch (provider) {
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
      completionProvider = new AnthropicProvider(key);
      break;
    }
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
      completionProvider = new OpenAIProvider(key);
      break;
    }
    case 'ollama': {
      const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
      completionProvider = new OllamaProvider(baseUrl);
      break;
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }

  return completionProvider;
}

export function getEmbeddingProvider(): AIProvider {
  if (embeddingProvider) return embeddingProvider;

  const provider = process.env.EMBEDDING_PROVIDER ?? 'openai';

  switch (provider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai');
      embeddingProvider = new OpenAIProvider(key);
      break;
    }
    case 'ollama': {
      const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
      embeddingProvider = new OllamaProvider(baseUrl);
      break;
    }
    default:
      throw new Error(`Unknown EMBEDDING_PROVIDER: ${provider}. Use "openai" or "ollama".`);
  }

  return embeddingProvider;
}

export { type AIProvider } from './types';
