import { z } from "zod";

export const MetadataFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["text", "date", "number", "currency", "textarea"]),
  required: z.boolean().default(true),
  placeholder: z.string().optional(),
  defaultValue: z.union([z.string(), z.number()]).optional(),
});

export const TemplateSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  promptHint: z.string(),
  order: z.number(),
  required: z.boolean().default(true),
  maxWords: z.number().optional(),
  subsections: z
    .array(
      z.object({
        key: z.string(),
        title: z.string(),
        promptHint: z.string(),
      })
    )
    .optional(),
});

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.enum([
    "software_development",
    "consulting",
    "marketing",
    "general",
  ]),
  version: z.number(),
  isDefault: z.boolean(),
  metadataSchema: z.array(MetadataFieldSchema),
  sections: z.array(TemplateSectionSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MetadataField = z.infer<typeof MetadataFieldSchema>;
export type TemplateSection = z.infer<typeof TemplateSectionSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type TemplateCategory = Template["category"];
