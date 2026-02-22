"use client";

import * as React from "react";

/** GeoJSON Feature for the map (polygon real o rectángulo desde bbox). */
type MapFeature = {
  type: "Feature";
  geometry:
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] };
  bbox: [number, number, number, number];
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Postali/1.0 (https://gomflo.dev/postal)";

/** Builds search string like Nominatim: "asentamiento, ciudad, estado" (countrycodes=mx en la petición). */
function buildQuery(asentamiento: string, ciudad: string, estado: string): string {
  const col = String(asentamiento ?? "").trim();
  const city = String(ciudad ?? "").trim();
  const state = String(estado ?? "").trim();
  const parts = [col, city, state].filter(Boolean);
  if (parts.length === 0) return "";
  return parts.join(", ");
}

/** Convierte boundingbox [south, north, west, east] de Nominatim en polígono rectangular. */
function bboxToFeature(bbox: string[]): MapFeature | null {
  if (bbox.length < 4) return null;
  const [s, n, w, e] = bbox.map(Number);
  if (Number.isNaN(s + n + w + e)) return null;
  const coords: number[][][] = [
    [
      [w, s],
      [e, s],
      [e, n],
      [w, n],
      [w, s],
    ],
  ];
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: coords },
    bbox: [w, s, e, n],
  };
}

/** Normaliza la geometría de Nominatim (geojson puede ser Geometry o Feature) a MapFeature. */
function normaliseNominatimGeojson(
  geojson: unknown,
  bbox: string[] | undefined
): MapFeature | null {
  if (!geojson || typeof geojson !== "object") return null;
  const obj = geojson as Record<string, unknown>;
  const bboxNum: [number, number, number, number] | undefined =
    bbox && bbox.length >= 4
      ? [Number(bbox[2]), Number(bbox[0]), Number(bbox[3]), Number(bbox[1])]
      : undefined;

  const makeFeature = (geometry: MapFeature["geometry"]): MapFeature | null =>
    bboxNum ? { type: "Feature", geometry, bbox: bboxNum } : null;

  if (obj.type === "Feature" && obj.geometry) {
    const g = obj.geometry as Record<string, unknown>;
    if (g.type === "Polygon" && Array.isArray(g.coordinates))
      return makeFeature(g as MapFeature["geometry"]);
    if (g.type === "MultiPolygon" && Array.isArray(g.coordinates))
      return makeFeature(g as MapFeature["geometry"]);
    return null;
  }
  if (obj.type === "Polygon" && Array.isArray(obj.coordinates))
    return makeFeature(obj as MapFeature["geometry"]);
  if (obj.type === "MultiPolygon" && Array.isArray(obj.coordinates))
    return makeFeature(obj as MapFeature["geometry"]);
  return null;
}

type SettlementMapProps = {
  asentamiento: string;
  ciudad: string;
  estado: string;
  municipio: string;
};

export function SettlementMap({
  asentamiento,
  ciudad,
  estado,
  municipio,
}: SettlementMapProps) {
  const [MapLeaflet, setMapLeaflet] = React.useState<
    React.ComponentType<{
      boundaryGeojson: MapFeature;
      asentamientoNombre: string;
    }> | null
  >(null);
  const [feature, setFeature] = React.useState<MapFeature | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "error">("loading");

  const query = React.useMemo(
    () => buildQuery(asentamiento, ciudad, estado),
    [asentamiento, ciudad, estado]
  );

  React.useEffect(() => {
    import("./SettlementMapLeaflet").then((mod) =>
      setMapLeaflet(() => mod.SettlementMapLeaflet)
    );
  }, []);

  React.useEffect(() => {
    if (!query) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "mx",
      polygon_geojson: "1",
    });
    fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    })
      .then((r) => r.json())
      .then((data) => {
        const first = Array.isArray(data) ? data[0] : null;
        if (!first) {
          setStatus("error");
          return;
        }
        const bbox = first.boundingbox as string[] | undefined;
        const geojson = first.geojson;
        const polygonFeature = normaliseNominatimGeojson(geojson, bbox);
        if (polygonFeature) {
          setFeature(polygonFeature);
          setStatus("ok");
          return;
        }
        if (bbox) {
          const fallback = bboxToFeature(bbox);
          if (fallback) {
            setFeature(fallback);
            setStatus("ok");
            return;
          }
        }
        setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [query]);

  if (status === "error") {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Mapa no disponible para esta ubicación.
      </p>
    );
  }

  if (status === "loading" || !feature) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm"
        style={{ height: "320px" }}
        aria-hidden
      >
        Cargando mapa…
      </div>
    );
  }

  if (!MapLeaflet) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm"
        style={{ height: "320px" }}
        aria-hidden
      >
        Cargando mapa…
      </div>
    );
  }

  return (
    <section aria-labelledby="map-heading" className="mt-6">
      <h2 id="map-heading" className="text-muted-foreground text-sm font-medium mb-2">
        Ubicación
      </h2>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <MapLeaflet
          boundaryGeojson={feature}
          asentamientoNombre={asentamiento}
        />
      </div>
      <p className="text-muted-foreground text-xs mt-2">
        Área aproximada según búsqueda: {query}. Tiles ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          OpenStreetMap
        </a>
      </p>
    </section>
  );
}
