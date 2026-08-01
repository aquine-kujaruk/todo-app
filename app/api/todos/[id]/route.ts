import { NextResponse } from "next/server";
import { getSupabase, type Todo } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const isDone = (body as { is_done?: unknown })?.is_done;
  if (typeof isDone !== "boolean") {
    return NextResponse.json(
      { error: "is_done debe ser booleano" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("todos")
    .update({ is_done: isDone })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Todo);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const { error } = await getSupabase().from("todos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
