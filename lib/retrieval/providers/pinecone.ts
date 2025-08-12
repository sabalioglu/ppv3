// lib/retrieval/providers/pinecone.ts
import type { RetrievalClient, RetrievalDoc } from '../types';

const HOST = process.env.EXPO_PUBLIC_PINECONE_INDEX_HOST || ''; // e.g. https://your-index-xxxx.svc.aped-...pinecone.io
const KEY  = process.env.EXPO_PUBLIC_PINECONE_API_KEY || '';

export class PineconeClient implements RetrievalClient {
  async upsert(_docs: RetrievalDoc[]): Promise<void> { return; } // ingestion server-side
  async search(query: string, k=5): Promise<RetrievalDoc[]> {
    if (!HOST || !KEY) return [];
    // Requires an embedding. In a pure client we assume server does embed+query.
    const resp = await fetch(`${HOST}/query`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Api-Key':KEY},
      body: JSON.stringify({ topK:k, includeMetadata:true, text: query })
    }).catch(()=>null);
    if (!resp || !resp.ok) return [];
    const data = await resp.json().catch(()=>({}));
    return (data?.matches||[]).map((m:any)=>({ id:String(m.id), text:String(m.metadata?.text||''), meta:m.metadata||{} }));
  }
}