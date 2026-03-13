import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string;
  metadata: Record<string, string>;
  similarity: number;
}

/**
 * Retrieve the most relevant context chunks for a given query.
 * Uses cosine similarity search via pgvector.
 */
export async function retrieveRelevantChunks(params: {
  query: string;
  offerId: string;
  topK?: number;
  threshold?: number;
}): Promise<RetrievedChunk[]> {
  const topK = params.topK ?? 8;
  const threshold = params.threshold ?? 0.3;

  // Embed the query
  const queryEmbedding = await generateEmbedding(params.query);

  // Call the Supabase RPC function for similarity search
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("match_context_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_offer_id: params.offerId,
    match_threshold: threshold,
    match_count: topK,
  });

  if (error) {
    throw new Error(`Similarity search failed: ${error.message}`);
  }

  return (data ?? []).map((row: { id: string; content: string; metadata: Record<string, string>; similarity: number }) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata ?? {},
    similarity: row.similarity,
  }));
}

/**
 * Build a context string from retrieved chunks, formatted for the AI prompt.
 */
export function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "No relevant context found.";

  return chunks
    .map(
      (chunk, i) =>
        `[Context ${i + 1} (relevance: ${(chunk.similarity * 100).toFixed(0)}%)]\n${chunk.content}`
    )
    .join("\n\n");
}
