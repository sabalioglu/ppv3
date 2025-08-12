// lib/retrieval/providers/noop.ts
import type { RetrievalClient, RetrievalDoc } from '../types';
export class NoopRetrieval implements RetrievalClient {
  async upsert(_docs: RetrievalDoc[]): Promise<void> { return; }
  async search(_query: string, _k=5): Promise<RetrievalDoc[]> { return []; }
}