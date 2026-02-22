"use client";

import * as React from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";

type GeoFeature = {
  type: "Feature";
  geometry:
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] };
  bbox?: [number, number, number, number];
};

function getBounds(feature: GeoFeature): [[number, number], [number, number]] {
  if (feature.bbox && feature.bbox.length >= 4) {
    const [minLon, minLat, maxLon, maxLat] = feature.bbox;
    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  }
  const g = feature.geometry;
  const rings: number[][] = g.type === "Polygon" ? g.coordinates : (g.coordinates?.flat() ?? []);
  const coords = rings[0] ?? [];
  if (coords.length === 0) return [[19.4, -99.15], [19.45, -99.1]];
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
  }
  return [[minLat, minLon], [maxLat, maxLon]];
}

function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  React.useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
  }, [map, bounds]);
  return null;
}

export type SettlementMapLeafletProps = {
  boundaryGeojson: GeoFeature;
  asentamientoNombre: string;
};

export function SettlementMapLeaflet({
  boundaryGeojson,
  asentamientoNombre,
}: SettlementMapLeafletProps) {
  const bounds = React.useMemo(
    () => getBounds(boundaryGeojson),
    [boundaryGeojson]
  );

  const style = React.useCallback(() => ({
    weight: 1.5,
    opacity: 0.6,
    color: "#374151",
    fillColor: "#6b7280",
    fillOpacity: 0.08,
  }), []);

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: "320px", width: "100%", borderRadius: "var(--radius)" }}
      scrollWheelZoom={true}
      aria-label={`Mapa del asentamiento ${asentamientoNombre}`}
      className="z-0"
    >
      <TileLayer attribution={TILE_ATTR} url={TILE_URL} />
      <FitBounds bounds={bounds} />
      <GeoJSON data={boundaryGeojson} style={style} />
    </MapContainer>
  );
}
