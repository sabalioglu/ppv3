import OpenAI from 'openai';

// API key'i environment'dan çek
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. OpenAI features may not work.");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export default openai;
