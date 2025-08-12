// lib/llm/index.ts
export interface LLMClient {
  generateMealJSON(input: { prompt: string }): Promise<string>; // returns raw JSON text
}

export function createLLM(provider: 'openai'|'gemini' = 'openai'): LLMClient {
  if (provider === 'gemini') {
    // @ts-ignore
    return new (require('./providers/gemini').GeminiClient)();
  }
  // @ts-ignore
  return new (require('./providers/openai').OpenAIClient)();
}