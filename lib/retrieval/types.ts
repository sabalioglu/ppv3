// lib/retrieval/types.ts
export type RetrievalDoc = { id: string; text: string; meta?: Record<string, any> };

export interface RetrievalClient {
  upsert(docs: RetrievalDoc[]): Promise<void>;
  search(query: string, k?: number): Promise<RetrievalDoc[]>;
}