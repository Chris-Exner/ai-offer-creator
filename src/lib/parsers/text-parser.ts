/**
 * Parse plain text or email content.
 * Simply returns the text as-is with minimal cleanup.
 */
export function parseText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
