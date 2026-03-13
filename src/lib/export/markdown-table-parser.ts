export type TextBlock = { type: "text"; content: string };
export type TableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};
export type ContentBlock = TextBlock | TableBlock;

/**
 * Parses markdown content into mixed blocks of text and tables.
 * Tables are detected by lines starting with `|`.
 */
export function parseMarkdownContent(markdown: string): ContentBlock[] {
  const lines = markdown.split("\n");
  const blocks: ContentBlock[] = [];
  let textBuffer: string[] = [];
  let tableLines: string[] = [];

  const flushText = () => {
    const text = textBuffer.join("\n").trim();
    if (text) blocks.push({ type: "text", content: text });
    textBuffer = [];
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      // Not a real table, treat as text
      textBuffer.push(...tableLines);
      tableLines = [];
      return;
    }

    const parsedRows = tableLines.map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    );

    // Find and remove the separator row (e.g., |---|---|)
    const separatorIdx = parsedRows.findIndex((row) =>
      row.every((cell) => /^[-:\s]+$/.test(cell))
    );

    if (separatorIdx === -1) {
      // No separator found, treat as text
      textBuffer.push(...tableLines);
      tableLines = [];
      return;
    }

    const headers = parsedRows[separatorIdx - 1] || parsedRows[0];
    const dataRows = parsedRows.slice(separatorIdx + 1).filter((row) =>
      row.some((cell) => cell.length > 0)
    );

    if (headers.length > 0 && dataRows.length > 0) {
      blocks.push({ type: "table", headers, rows: dataRows });
    }

    tableLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      if (tableLines.length === 0) flushText();
      tableLines.push(trimmed);
    } else {
      if (tableLines.length > 0) flushTable();
      textBuffer.push(line);
    }
  }

  // Flush remaining
  if (tableLines.length > 0) flushTable();
  flushText();

  return blocks;
}
