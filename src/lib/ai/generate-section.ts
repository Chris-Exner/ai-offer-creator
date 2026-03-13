import { getOpenAIClient } from "./client";
import { buildSectionGenerationPrompt } from "./prompts";
import {
  retrieveRelevantChunks,
  formatRetrievedContext,
} from "@/lib/rag/retriever";
import type { TemplateSection } from "@/types/template";

/**
 * Generate content for a single offer section using RAG.
 * Returns a ReadableStream for server-sent events.
 */
export async function generateSection(params: {
  templateName: string;
  section: TemplateSection;
  metadata: Record<string, string | number>;
  offerId: string;
  previousSections: Array<{ title: string; content: string }>;
}): Promise<ReadableStream<Uint8Array>> {
  // RAG: retrieve relevant chunks for this section
  const query = `${params.section.title}: ${params.section.description}`;
  const relevantChunks = await retrieveRelevantChunks({
    query,
    offerId: params.offerId,
    topK: 8,
  });
  const retrievedContext = formatRetrievedContext(relevantChunks);

  // Build the prompt
  const systemPrompt = buildSectionGenerationPrompt({
    templateName: params.templateName,
    sectionTitle: params.section.title,
    sectionPromptHint: params.section.promptHint,
    maxWords: params.section.maxWords,
    metadata: params.metadata,
    retrievedContext,
    previousSections: params.previousSections,
  });

  // Stream the response
  const openai = getOpenAIClient();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate the "${params.section.title}" section now.`,
      },
    ],
    temperature: 0.7,
    max_tokens: params.section.maxWords ? params.section.maxWords * 3 : 2000,
    stream: true,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Generate content for a single section and return the full text (non-streaming).
 */
export async function generateSectionFull(params: {
  templateName: string;
  section: TemplateSection;
  metadata: Record<string, string | number>;
  offerId: string;
  previousSections: Array<{ title: string; content: string }>;
}): Promise<string> {
  const query = `${params.section.title}: ${params.section.description}`;
  const relevantChunks = await retrieveRelevantChunks({
    query,
    offerId: params.offerId,
    topK: 8,
  });
  const retrievedContext = formatRetrievedContext(relevantChunks);

  const systemPrompt = buildSectionGenerationPrompt({
    templateName: params.templateName,
    sectionTitle: params.section.title,
    sectionPromptHint: params.section.promptHint,
    maxWords: params.section.maxWords,
    metadata: params.metadata,
    retrievedContext,
    previousSections: params.previousSections,
  });

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate the "${params.section.title}" section now.`,
      },
    ],
    temperature: 0.7,
    max_tokens: params.section.maxWords ? params.section.maxWords * 3 : 2000,
  });

  return response.choices[0]?.message?.content ?? "";
}
