import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// "server-only" hace que el build falle si alguien importa este módulo desde un
// componente de cliente. Es la garantía de que la clave nunca acaba en el bundle.
//
// Las variables NO llevan prefijo NEXT_PUBLIC_, así que Next no las inlinea:
// solo existen en el proceso de la lambda, leídas de las Environment Variables
// del proyecto en Vercel.

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor."
    );
  }

  // El cliente se crea perezosamente para que el build no dependa del entorno:
  // las variables solo hacen falta cuando llega una petición.
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};
