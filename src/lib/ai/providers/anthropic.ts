import type { AIProvider, CompletionOptions } from '../types';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.anthropic.com/v1';
  private readonly model = 'claude-sonnet-4-20250514';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === 'text'
    );
    return textBlock?.text ?? '';
  }

  async embed(_text: string): Promise<number[]> {
    // Anthropic doesn't have an embedding API — delegate to OpenAI or local
    throw new Error(
      'Anthropic does not provide embeddings. Configure EMBEDDING_PROVIDER=openai or EMBEDDING_PROVIDER=ollama'
    );
  }

  async embedBatch(_texts: string[]): Promise<number[][]> {
    throw new Error(
      'Anthropic does not provide embeddings. Configure EMBEDDING_PROVIDER=openai or EMBEDDING_PROVIDER=ollama'
    );
  }
}
