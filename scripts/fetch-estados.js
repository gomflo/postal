/**
 * Obtiene los estados únicos de la tabla postal_codes en Supabase
 * y los guarda en src/data/estados.json para no volver a consultar.
 *
 * Uso: npm run fetch-estados
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  try {
    const env = readFileSync(join(root, ".env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}

loadEnv();

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("postal_codes")
  .select("estado, clave_estado")
  .order("estado");

if (error) {
  console.error("Supabase error:", error.message);
  process.exit(1);
}

// Agrupar por estado (quedarnos con uno por estado, ordenado)
const seen = new Set();
const estados = (data ?? []).filter((r) => {
  if (seen.has(r.estado)) return false;
  seen.add(r.estado);
  return true;
});

const outDir = join(root, "src", "data");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "estados.json");
writeFileSync(outPath, JSON.stringify(estados, null, 2), "utf8");

console.log(`Escritos ${estados.length} estados en ${outPath}`);
