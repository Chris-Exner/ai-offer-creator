import { parsePdf } from "./pdf-parser";
import { parseDocx } from "./docx-parser";
import { parseText } from "./text-parser";

export type SupportedFileType = "pdf" | "docx" | "txt" | "md";

/**
 * Parse a file buffer based on its type and return extracted text.
 */
export async function parseDocument(
  buffer: Buffer,
  fileType: SupportedFileType
): Promise<string> {
  switch (fileType) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "txt":
    case "md":
      return parseText(buffer.toString("utf-8"));
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Detect file type from filename extension.
 */
export function detectFileType(filename: string): SupportedFileType {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    case "txt":
      return "txt";
    case "md":
      return "md";
    default:
      return "txt";
  }
}
