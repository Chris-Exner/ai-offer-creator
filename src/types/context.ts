export interface ContextDocument {
  id: string;
  offerId: string;
  filename: string;
  fileType: "pdf" | "docx" | "txt" | "email";
  rawText: string;
  createdAt: string;
}

export interface ContextChunk {
  id: string;
  documentId: string;
  offerId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  metadata: Record<string, string>;
  createdAt: string;
}
