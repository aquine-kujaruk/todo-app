import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// El workflow usa esta ruta como comprobación tras el deploy.
export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_configured",
        detail:
          "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las Environment Variables del proyecto en Vercel.",
      },
      { status: 503 }
    );
  }

  const { count, error } = await getSupabase()
    .from("todos")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { ok: false, reason: "database_unreachable", detail: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, todos: count });
}
