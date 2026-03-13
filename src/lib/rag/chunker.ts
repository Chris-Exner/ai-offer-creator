/**
 * Recursive character text splitter.
 * Splits text into chunks of approximately `chunkSize` tokens (estimated),
 * with `chunkOverlap` tokens of overlap between consecutive chunks.
 */

const DEFAULT_CHUNK_SIZE = 1500; // ~500 tokens * ~3 chars/token
const DEFAULT_CHUNK_OVERLAP = 150; // ~50 tokens overlap
const SEPARATORS = ["\n\n", "\n", ". ", ", ", " ", ""];

export interface TextChunk {
  content: string;
  chunkIndex: number;
  metadata: Record<string, string>;
}

export function splitTextIntoChunks(
  text: string,
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
    metadata?: Record<string, string>;
  }
): TextChunk[] {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;
  const baseMetadata = options?.metadata ?? {};

  const chunks = recursiveSplit(text, SEPARATORS, chunkSize, chunkOverlap);

  return chunks.map((content, index) => ({
    content: content.trim(),
    chunkIndex: index,
    metadata: { ...baseMetadata },
  }));
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  chunkOverlap: number
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const separator = separators[0];
  const remainingSeparators = separators.slice(1);

  const parts = separator ? text.split(separator) : text.split("");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const part of parts) {
    const candidate = currentChunk
      ? currentChunk + separator + part
      : part;

    if (candidate.length > chunkSize && currentChunk) {
      chunks.push(currentChunk);

      // Overlap: keep the tail of the current chunk
      const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
      const overlap = currentChunk.slice(overlapStart);
      currentChunk = overlap + separator + part;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // If we only got one chunk and it's still too large, try the next separator
  if (chunks.length === 1 && chunks[0].length > chunkSize && remainingSeparators.length > 0) {
    return recursiveSplit(chunks[0], remainingSeparators, chunkSize, chunkOverlap);
  }

  // Recursively split any chunks that are still too large
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > chunkSize * 1.5 && remainingSeparators.length > 0) {
      result.push(...recursiveSplit(chunk, remainingSeparators, chunkSize, chunkOverlap));
    } else {
      result.push(chunk);
    }
  }

  return result.filter((c) => c.trim().length > 0);
}
