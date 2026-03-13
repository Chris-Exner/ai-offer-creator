export const CONTEXT_ANALYSIS_SYSTEM_PROMPT = `You are an expert business analyst. Analyze the following context documents provided for a business offer/proposal. Extract and structure the following information:

1. **summary**: A 2-3 sentence summary of what the project/engagement is about.
2. **extractedEntities**: Key entities found such as client name, project name, dates, budget mentions, technology mentions, people names, company names. Use snake_case keys.
3. **keyPoints**: A bullet list of 5-15 key facts, requirements, constraints, or preferences that should inform the offer content.

Return your analysis as a JSON object matching this exact structure:
{
  "summary": "string",
  "extractedEntities": { "key": "value" },
  "keyPoints": ["string"]
}

Only return valid JSON, nothing else.`;

export function buildSectionGenerationPrompt(params: {
  templateName: string;
  sectionTitle: string;
  sectionPromptHint: string;
  maxWords?: number;
  metadata: Record<string, string | number>;
  retrievedContext: string;
  previousSections: Array<{ title: string; content: string }>;
}): string {
  const metadataStr = Object.entries(params.metadata)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const previousStr =
    params.previousSections.length > 0
      ? `\nPREVIOUSLY GENERATED SECTIONS (maintain consistency):\n${params.previousSections
          .map((s) => `## ${s.title}\n${s.content.slice(0, 500)}...`)
          .join("\n\n")}`
      : "";

  return `You are an expert proposal writer creating a professional business offer.
You are writing the "${params.sectionTitle}" section of a "${params.templateName}" template.

SECTION INSTRUCTIONS:
${params.sectionPromptHint}
${params.maxWords ? `Target length: approximately ${params.maxWords} words.` : ""}

PROJECT METADATA:
${metadataStr}

RELEVANT CONTEXT (retrieved from provided documents):
${params.retrievedContext}
${previousStr}

Write the section content in Markdown format. Be specific, professional, and reference concrete details from the context. Do not include the section title as a heading — just write the content.`;
}
