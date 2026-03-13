import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    templateId: data.template_id,
    title: data.title,
    status: data.status,
    metadata: data.metadata,
    contextParsed: data.context_parsed,
    sections: data.sections,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    template: data.templates,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await params;
  const body = await request.json();

  const supabase = createServiceRoleClient();
  const updates: Record<string, unknown> = {};

  if (body.metadata !== undefined) updates.metadata = body.metadata;
  if (body.status !== undefined) updates.status = body.status;
  if (body.title !== undefined) updates.title = body.title;
  if (body.sections !== undefined) updates.sections = body.sections;
  if (body.contextParsed !== undefined)
    updates.context_parsed = body.contextParsed;

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("offers")
    .update(updates)
    .eq("id", offerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
