import { z } from "zod";

export const ParsedContextSchema = z.object({
  summary: z.string(),
  extractedEntities: z.record(z.string(), z.string()),
  keyPoints: z.array(z.string()),
});

export const OfferSectionContentSchema = z.object({
  sectionKey: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.enum(["pending", "generating", "generated", "edited"]),
  generatedAt: z.string().datetime().optional(),
  editedAt: z.string().datetime().optional(),
});

export const OfferSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  title: z.string(),
  status: z.enum(["draft", "generating", "review", "finalized"]),
  metadata: z.record(z.string(), z.union([z.string(), z.number()])),
  contextParsed: ParsedContextSchema.nullable(),
  sections: z.array(OfferSectionContentSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ParsedContext = z.infer<typeof ParsedContextSchema>;
export type OfferSectionContent = z.infer<typeof OfferSectionContentSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type OfferStatus = Offer["status"];
