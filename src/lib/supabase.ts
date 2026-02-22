import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) {
    throw new Error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY");
  }
  client = createClient(url, key);
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as Record<string, unknown>)[prop as string];
  },
});

export type PostalCodeRow = {
  id: string;
  codigo_postal: string;
  asentamiento: string;
  tipo_asentamiento: string;
  municipio: string;
  estado: string;
  ciudad: string;
  codigo_postal_oficina: string | null;
  clave_estado: string;
  clave_oficina: string | null;
  clave_codigo_postal: string | null;
  clave_tipo_asentamiento: string | null;
  clave_municipio: string | null;
  id_asentamiento: string | null;
  zona: string | null;
  clave_ciudad: string | null;
};
