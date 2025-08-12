// lib/retrieval/providers/qdrant.ts
import type { RetrievalClient, RetrievalDoc } from '../types';

const URL = process.env.EXPO_PUBLIC_QDRANT_URL || '';
const KEY = process.env.EXPO_PUBLIC_QDRANT_API_KEY || '';
const COLLECTION = process.env.EXPO_PUBLIC_QDRANT_COLLECTION || 'docs';

export class QdrantClient implements RetrievalClient {
  async upsert(_docs: RetrievalDoc[]): Promise<void> {
    // For RN client apps we typically avoid writing directly to vector DB.
    // Keep this as a placeholder (ingestion should happen server-side).
    return;
  }
  async search(query: string, k=5): Promise<RetrievalDoc[]> {
    if (!URL) return [];
    // Expects a server endpoint that wraps Qdrant search
    const resp = await fetch(`${URL}/search`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization': KEY ? `Bearer ${KEY}` : ''},
      body: JSON.stringify({ collection: COLLECTION, query, top_k: k })
    }).catch(()=>null);
    if (!resp || !resp.ok) return [];
    const data = await resp.json().catch(()=>({}));
    return (data?.results||[]).map((r:any)=>({ id:String(r.id), text:String(r.text||''), meta:r.meta||{} }));
  }
}