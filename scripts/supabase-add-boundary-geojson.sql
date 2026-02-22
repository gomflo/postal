-- Add boundary GeoJSON column for settlement polygon (from open-mexico/mexico-geojson).
-- Run this in the Supabase SQL editor or via supabase db push.

ALTER TABLE postal_codes
ADD COLUMN IF NOT EXISTS boundary_geojson jsonb NULL;

COMMENT ON COLUMN postal_codes.boundary_geojson IS 'GeoJSON Feature (polygon) for this postal code area from mexico-geojson';
