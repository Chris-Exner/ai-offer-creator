import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("offers")
    .select("*, templates(name, slug, category)")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offers = (data ?? []).map((row: any) => ({
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    status: row.status,
    metadata: row.metadata,
    contextParsed: row.context_parsed,
    sections: row.sections,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    template: row.templates,
  }));

  return NextResponse.json(offers);
}

export async function POST(request: Request) {
  const { templateId, title } = await request.json();

  if (!templateId) {
    return NextResponse.json(
      { error: "templateId is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("offers")
    .insert({
      template_id: templateId,
      title: title ?? "New Offer",
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
