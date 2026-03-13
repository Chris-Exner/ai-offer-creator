import { getOpenAIClient } from "./client";
import { CONTEXT_ANALYSIS_SYSTEM_PROMPT } from "./prompts";
import type { ParsedContext } from "@/types/offer";

/**
 * Analyze raw context text and extract structured information.
 */
export async function analyzeContext(
  contextText: string
): Promise<ParsedContext> {
  const openai = getOpenAIClient();

  // Truncate if too long (max ~12k tokens worth of text)
  const truncated = contextText.slice(0, 36000);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: CONTEXT_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze the following context documents:\n\n${truncated}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from context analysis");
  }

  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary ?? "",
    extractedEntities: parsed.extractedEntities ?? {},
    keyPoints: parsed.keyPoints ?? [],
  };
}
