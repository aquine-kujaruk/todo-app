import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Ruta de servidor (lambda en Vercel): comprueba que el backend desplegado
// alcanza Supabase. El workflow la usa como health check tras el deploy.
export async function GET() {
  const { count, error } = await supabase
    .from("todos")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, database: "unreachable", error: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, database: "reachable", todos: count });
}
