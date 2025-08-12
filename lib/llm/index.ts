// lib/llm/index.ts
export interface LLMClient {
  generateMealJSON(input: { prompt: string }): Promise<string>; // returns raw JSON text
}

import { OpenAIClient } from './providers/openai';
import { GeminiClient } from './providers/gemini';

export function createLLM(provider: 'openai'|'gemini' = 'openai'): LLMClient {
  return provider === 'gemini' ? new GeminiClient() : new OpenAIClient();
}