/** URL base del sitio (origen + base path). */
export const SITE_BASE = "https://gomflo.dev/postal";

/** Recorta texto a maxLen caracteres, añadiendo "…" si se trunca. */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

/** Longitud recomendada meta description (SERP). */
export const META_DESC_MAX = 160;

/** Longitud recomendada title (SERP). */
export const TITLE_MAX = 60;
