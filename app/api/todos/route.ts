import { NextResponse } from "next/server";
import { getSupabase, type Todo } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Todo[]);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title =
    typeof (body as { title?: unknown })?.title === "string"
      ? (body as { title: string }).title.trim()
      : "";

  if (!title || title.length > 500) {
    return NextResponse.json(
      { error: "El título debe tener entre 1 y 500 caracteres" },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabase()
    .from("todos")
    .insert({ title })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Todo, { status: 201 });
}
