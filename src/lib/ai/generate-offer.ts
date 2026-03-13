import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateSectionFull } from "./generate-section";
import type { TemplateSection } from "@/types/template";
import type { OfferSectionContent } from "@/types/offer";

/**
 * Generate all sections of an offer sequentially.
 * Each section is generated considering previously generated sections for coherence.
 */
export async function generateFullOffer(params: {
  offerId: string;
  templateName: string;
  templateSections: TemplateSection[];
  metadata: Record<string, string | number>;
  onSectionStart?: (sectionKey: string) => void;
  onSectionComplete?: (sectionKey: string, content: string) => void;
}): Promise<OfferSectionContent[]> {
  const supabase = createServiceRoleClient();
  const generatedSections: OfferSectionContent[] = [];
  const previousSections: Array<{ title: string; content: string }> = [];

  // Update offer status to generating
  await supabase
    .from("offers")
    .update({ status: "generating" })
    .eq("id", params.offerId);

  // Sort sections by order
  const sortedSections = [...params.templateSections].sort(
    (a, b) => a.order - b.order
  );

  for (const section of sortedSections) {
    params.onSectionStart?.(section.key);

    try {
      const content = await generateSectionFull({
        templateName: params.templateName,
        section,
        metadata: params.metadata,
        offerId: params.offerId,
        previousSections,
      });

      const sectionContent: OfferSectionContent = {
        sectionKey: section.key,
        title: section.title,
        content,
        status: "generated",
        generatedAt: new Date().toISOString(),
      };

      generatedSections.push(sectionContent);
      previousSections.push({ title: section.title, content });

      // Update in DB after each section
      await supabase
        .from("offers")
        .update({ sections: generatedSections })
        .eq("id", params.offerId);

      params.onSectionComplete?.(section.key, content);
    } catch (error) {
      const sectionContent: OfferSectionContent = {
        sectionKey: section.key,
        title: section.title,
        content: `Error generating section: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: "pending",
      };
      generatedSections.push(sectionContent);
    }
  }

  // Update offer status to review
  await supabase
    .from("offers")
    .update({ status: "review", sections: generatedSections })
    .eq("id", params.offerId);

  return generatedSections;
}
