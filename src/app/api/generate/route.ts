import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { analyzeContext } from "@/lib/ai/analyze-context";
import { generateFullOffer } from "@/lib/ai/generate-offer";
import { getOfferContextText } from "@/lib/rag/store";
import type { TemplateSection } from "@/types/template";

export async function POST(request: Request) {
  try {
    const { offerId, sectionKey } = await request.json();

    if (!offerId) {
      return NextResponse.json(
        { error: "offerId is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Load the offer
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*, templates(*)")
      .eq("id", offerId)
      .single();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    const template = offer.templates;

    // Step 1: Analyze context if not already done
    if (!offer.context_parsed) {
      const contextText = await getOfferContextText(offerId);
      if (contextText) {
        const parsed = await analyzeContext(contextText);
        await supabase
          .from("offers")
          .update({ context_parsed: parsed })
          .eq("id", offerId);
        offer.context_parsed = parsed;
      }
    }

    // Step 2: Generate sections
    const sections = template.sections as TemplateSection[];

    if (sectionKey) {
      // Regenerate a single section
      const section = sections.find(
        (s: TemplateSection) => s.key === sectionKey
      );
      if (!section) {
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 }
        );
      }

      const { generateSectionFull } = await import(
        "@/lib/ai/generate-section"
      );

      const existingSections = (offer.sections ?? []) as Array<{
        sectionKey: string;
        title: string;
        content: string;
      }>;
      const previousSections = existingSections
        .filter((s) => {
          const templateSection = sections.find(
            (ts: TemplateSection) => ts.key === s.sectionKey
          );
          return templateSection && templateSection.order < section.order;
        })
        .map((s) => ({ title: s.title, content: s.content }));

      const content = await generateSectionFull({
        templateName: template.name,
        section,
        metadata: offer.metadata ?? {},
        offerId,
        previousSections,
      });

      // Update the specific section in the offer
      const updatedSections = existingSections.map((s) =>
        s.sectionKey === sectionKey
          ? {
              ...s,
              content,
              status: "generated",
              generatedAt: new Date().toISOString(),
            }
          : s
      );

      await supabase
        .from("offers")
        .update({ sections: updatedSections })
        .eq("id", offerId);

      return NextResponse.json({ sectionKey, content });
    }

    // Generate all sections
    const generatedSections = await generateFullOffer({
      offerId,
      templateName: template.name,
      templateSections: sections,
      metadata: offer.metadata ?? {},
    });

    return NextResponse.json({ sections: generatedSections });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
