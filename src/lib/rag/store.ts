import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TextChunk } from "./chunker";

/**
 * Store a context document and return its ID.
 */
export async function storeContextDocument(params: {
  offerId: string;
  filename: string;
  fileType: string;
  rawText: string;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("context_documents")
    .insert({
      offer_id: params.offerId,
      filename: params.filename,
      file_type: params.fileType,
      raw_text: params.rawText,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to store document: ${error.message}`);
  return data.id;
}

/**
 * Store chunks with their embeddings in the vector store.
 */
export async function storeChunksWithEmbeddings(params: {
  documentId: string;
  offerId: string;
  chunks: TextChunk[];
  embeddings: number[][];
}): Promise<void> {
  const supabase = createServiceRoleClient();

  const rows = params.chunks.map((chunk, i) => ({
    document_id: params.documentId,
    offer_id: params.offerId,
    content: chunk.content,
    embedding: JSON.stringify(params.embeddings[i]),
    chunk_index: chunk.chunkIndex,
    metadata: chunk.metadata,
  }));

  // Insert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("context_chunks").insert(batch);
    if (error) throw new Error(`Failed to store chunks: ${error.message}`);
  }
}

/**
 * Delete all context documents and chunks for an offer.
 */
export async function deleteOfferContext(offerId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  // Cascade delete: chunks are deleted when documents are deleted
  const { error } = await supabase
    .from("context_documents")
    .delete()
    .eq("offer_id", offerId);
  if (error) throw new Error(`Failed to delete context: ${error.message}`);
}

/**
 * Get all raw text for an offer's context documents.
 */
export async function getOfferContextText(offerId: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("context_documents")
    .select("filename, raw_text")
    .eq("offer_id", offerId)
    .order("created_at");

  if (error) throw new Error(`Failed to get context: ${error.message}`);

  return (data ?? [])
    .map((doc: { filename: string; raw_text: string }) => `--- ${doc.filename} ---\n${doc.raw_text}`)
    .join("\n\n");
}
