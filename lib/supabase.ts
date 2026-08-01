import { createClient } from "@supabase/supabase-js";

// POC: la URL y la anon key de Supabase son valores públicos (viajan al navegador
// en cualquier app cliente de Supabase), así que se incluyen como fallback para
// que el despliegue funcione sin configurar variables en Vercel.
// Se pueden sobreescribir con NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const FALLBACK_URL = "https://itnmhhhqymgsegnntemk.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_EmD-j7cm9koq_TSI97uRPg_DdzrrbY2";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const supabase = createClient(url, key);

export type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};
