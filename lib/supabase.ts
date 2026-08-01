import { createClient } from "@supabase/supabase-js";

// Los valores vienen de los secrets del repositorio: el workflow de GitHub Actions
// genera .env.production.local antes del build y Next.js los inlinea desde ahí.
// En local se leen de .env.local (ver .env.example).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "En local: copia .env.example a .env.local. " +
      "En CI: configúralos como secrets del repositorio."
  );
}

export const supabase = createClient(url, key);

export type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};
