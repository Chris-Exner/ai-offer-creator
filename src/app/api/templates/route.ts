import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform snake_case to camelCase
  const templates = (data ?? []).map(transformTemplate);
  return NextResponse.json(templates);
}

function transformTemplate(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    version: row.version,
    isDefault: row.is_default,
    metadataSchema: row.metadata_schema,
    sections: row.sections,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
