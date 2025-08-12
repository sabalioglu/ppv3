// lib/retrieval/providers/supabase.ts
import type { RetrievalClient, RetrievalDoc } from '../types';
import { supabase } from '@/lib/supabase';

// Expects a table 'documents' with columns: id (uuid/text), text (text), meta (jsonb)
// Optionally you can create an FTS index and use text search.
export class SupabaseVecClient implements RetrievalClient {
  async upsert(_docs: RetrievalDoc[]): Promise<void> {
    // Prefer server-side ingestion for mobile. Placeholder only.
    return;
  }
  async search(query: string, k=5): Promise<RetrievalDoc[]> {
    try {
      // naive ilike fallback (replace with RPC/embedding search if available)
      const { data, error } = await supabase
        .from('documents')
        .select('id, text, meta')
        .ilike('text', `%${query}%`)
        .limit(k);
      if (error || !data) return [];
      return data.map((d:any)=>({ id:String(d.id), text:String(d.text||''), meta:d.meta||{} }));
    } catch { return []; }
  }
}