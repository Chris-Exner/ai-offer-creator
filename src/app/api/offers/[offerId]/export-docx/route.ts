import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateOfferDocx } from "@/lib/export/docx-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("offers")
    .select("*, templates(*)")
    .eq("id", offerId)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Offer not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const offer = {
    title: data.title,
    metadata: data.metadata || {},
    sections: data.sections || [],
  };

  const buffer = await generateOfferDocx(offer);

  const clientName = String(offer.metadata.client_name || "Kunde").replace(
    /[^a-zA-Z0-9äöüÄÖÜß\-_ ]/g,
    ""
  );
  const date = String(
    offer.metadata.offer_date || new Date().toISOString().split("T")[0]
  );
  const filename = `Angebot-${clientName}-${date}.docx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
