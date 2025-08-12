// lib/retrieval/index.ts
import type { RetrievalClient } from './types';

// provider selector via env
export function getRetrieval(): RetrievalClient {
  const provider = (process.env.EXPO_PUBLIC_RETRIEVAL_PROVIDER || '').toLowerCase();
  if (provider === 'qdrant') {
    // @ts-ignore
    return new (require('./providers/qdrant').QdrantClient)();
  }
  if (provider === 'pinecone') {
    // @ts-ignore
    return new (require('./providers/pinecone').PineconeClient)();
  }
  if (provider === 'supabase') {
    // @ts-ignore
    return new (require('./providers/supabase').SupabaseVecClient)();
  }
  // default noop
  // @ts-ignore
  return new (require('./providers/noop').NoopRetrieval)();
}