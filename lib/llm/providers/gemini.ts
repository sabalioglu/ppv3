// lib/llm/providers/gemini.ts
import type { LLMClient } from '../index';

const API_URL = process.env.EXPO_PUBLIC_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export class GeminiClient implements LLMClient {
  async generateMealJSON({ prompt }: { prompt: string }): Promise<string> {
    if (!API_KEY) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');

    const resp = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + '\n\nReturn ONLY valid JSON.' }] }],
        generationConfig: { temperature: 0.7, topP: 0.9, topK: 40, maxOutputTokens: 1400 }
      })
    });
    if (!resp.ok) throw new Error(`Gemini error ${resp.status}`);
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty completion');
    return String(text).replace(/```json/g,'').replace(/```/g,'').trim();
  }
}