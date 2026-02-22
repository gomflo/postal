-- Índices recomendados para postal_codes (Supabase / Postgres).
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase para acelerar
-- las consultas por clave_estado y ciudad (build estático y listados).

-- Listado de ciudades por estado y listado de colonias por ciudad
CREATE INDEX IF NOT EXISTS idx_postal_codes_clave_ciudad
  ON postal_codes (clave_estado, ciudad);

-- Orden por asentamiento al pedir colonias (evita sort en disco)
CREATE INDEX IF NOT EXISTS idx_postal_codes_clave_ciudad_asentamiento
  ON postal_codes (clave_estado, ciudad, asentamiento);
