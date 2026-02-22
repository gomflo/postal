/**
 * Genera un slug URL-safe a partir de un texto (ej. nombre de ciudad).
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Slug para la URL del asentamiento: asentamiento + código postal (ej. "san-jose-44100").
 */
export function slugForAsentamiento(asentamiento: string, codigo_postal: string): string {
  return `${slugify(asentamiento)}-${codigo_postal}`;
}
