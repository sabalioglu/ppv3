// lib/llm/providers/openai.ts
import type { LLMClient } from '../index';

const API_URL = process.env.EXPO_PUBLIC_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export class OpenAIClient implements LLMClient {
  async generateMealJSON({ prompt }: { prompt: string }): Promise<string> {
    if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');

    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role:'system', content:'You are a culturally-aware nutrition chef. Follow HARD rules first. Output VALID JSON only.' },
          { role:'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1400,
        response_format: { type: 'json_object' }
      })
    });
    if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`);
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty completion');
    return String(text).replace(/```json/g,'').replace(/```/g,'').trim();
  }
}