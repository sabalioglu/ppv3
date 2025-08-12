// lib/middleware/citations.ts
import type { RetrievalDoc } from '@/lib/retrieval/types';

/**
 * Very light "citation enforcer".
 * Appends a references footer listing doc ids/filenames found during retrieval.
 * Use for Q&A/chat responses. Not needed for structured meal JSON.
 */
export function appendCitationsFooter(answer: string, docs: RetrievalDoc[]) {
  if (!docs?.length) return answer;
  const uniq = Object.values(docs.reduce((acc:any, d)=>{ acc[d.id]=d; return acc; }, {}));
  const refs = uniq.map((d:any,i:number)=>`[${i+1}] ${d.meta?.filename || d.id}`).join('\n');
  return `${answer}\n\n---\nReferences:\n${refs}`;
}