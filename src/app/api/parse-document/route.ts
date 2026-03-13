import { NextResponse } from "next/server";
import { parseDocument, detectFileType } from "@/lib/parsers";
import { splitTextIntoChunks } from "@/lib/rag/chunker";
import {
  storeContextDocument,
  storeChunksWithEmbeddings,
} from "@/lib/rag/store";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;
    const offerId = formData.get("offerId") as string;

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId is required" },
        { status: 400 }
      );
    }

    let rawText: string;
    let filename: string;
    let fileType: string;

    if (file) {
      // Parse uploaded file
      const buffer = Buffer.from(await file.arrayBuffer());
      const detectedType = detectFileType(file.name);
      rawText = await parseDocument(buffer, detectedType);
      filename = file.name;
      fileType = detectedType;
    } else if (pastedText) {
      // Handle pasted text
      rawText = pastedText.trim();
      filename = "pasted_text";
      fileType = "txt";
    } else {
      return NextResponse.json(
        { error: "Either file or text is required" },
        { status: 400 }
      );
    }

    if (!rawText || rawText.length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the file" },
        { status: 400 }
      );
    }

    // Store the document (always works — just text in Postgres)
    const documentId = await storeContextDocument({
      offerId,
      filename,
      fileType,
      rawText,
    });

    // Chunk the text
    const chunks = splitTextIntoChunks(rawText, {
      metadata: { filename, fileType },
    });

    // Try to generate embeddings — if OpenAI key is missing/invalid, skip gracefully
    let embeddingsStored = false;
    let embeddingError: string | null = null;

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-placeholder") {
      try {
        const { generateEmbeddings } = await import("@/lib/rag/embeddings");
        const embeddings = await generateEmbeddings(
          chunks.map((c) => c.content)
        );

        await storeChunksWithEmbeddings({
          documentId,
          offerId,
          chunks,
          embeddings,
        });
        embeddingsStored = true;
      } catch (err) {
        embeddingError =
          err instanceof Error ? err.message : "Embedding generation failed";
        console.warn("Embedding generation skipped:", embeddingError);
      }
    } else {
      embeddingError = "OpenAI API key not configured — embeddings skipped";
      console.warn(embeddingError);
    }

    return NextResponse.json({
      documentId,
      filename,
      fileType,
      textLength: rawText.length,
      chunkCount: chunks.length,
      embeddingsStored,
      embeddingWarning: embeddingError,
    });
  } catch (error) {
    console.error("Document parse error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to parse document",
      },
      { status: 500 }
    );
  }
}
