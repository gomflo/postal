"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";

const base = typeof import.meta.env !== "undefined" ? (import.meta.env.BASE_URL ?? "") : "";
const baseSlash = base.endsWith("/") ? base : `${base}/`;
import type { PostalCodeRow } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettlementMap } from "@/components/SettlementMap";

type DetailViewProps = {
  /** Datos ya cargados en el servidor (SSR). Si se pasan, no se hace fetch en cliente. */
  row?: PostalCodeRow | null;
  /** ID para cargar en cliente (solo si no se pasa `row`). Mantiene compatibilidad con rutas antiguas. */
  initialId?: string | null;
};

function DetailContent({ row }: { row: PostalCodeRow }) {
  const items: { label: string; value: string | null }[] = [
    { label: "Código postal", value: row.codigo_postal },
    { label: "Asentamiento", value: row.asentamiento },
    { label: "Tipo de asentamiento", value: row.tipo_asentamiento },
    { label: "Municipio", value: row.municipio },
    { label: "Estado", value: row.estado },
    { label: "Ciudad", value: row.ciudad },
    { label: "Zona", value: row.zona },
    { label: "Clave estado", value: row.clave_estado },
    { label: "Clave municipio", value: row.clave_municipio },
  ].filter((x) => x.value != null && x.value !== "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{row.asentamiento}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {row.codigo_postal} — {row.municipio}, {row.estado}
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {items.map(({ label, value }) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground text-sm font-medium">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <SettlementMap
        asentamiento={row.asentamiento}
        ciudad={row.ciudad ?? ""}
        estado={row.estado}
        municipio={row.municipio}
      />
      <p className="mt-6 text-center">
        <a
          href={baseSlash}
          className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Buscar otro código postal
        </a>
      </p>
    </div>
  );
}

export function DetailView({ row: serverRow, initialId }: DetailViewProps) {
  const [row, setRow] = React.useState<PostalCodeRow | null>(serverRow ?? null);
  const [loading, setLoading] = React.useState(!!initialId && !serverRow);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (serverRow) return;
    const q = initialId ?? new URLSearchParams(window.location.search).get("id");
    if (!q) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from("postal_codes")
      .select("*")
      .eq("id", q)
      .single()
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          setRow(null);
          return;
        }
        setRow(data);
        if (data) {
          document.title = `${data.asentamiento} — ${data.codigo_postal} | Postali`;
        }
      });
  }, [initialId, serverRow]);

  if (serverRow || row) {
    return <DetailContent row={(serverRow ?? row)!} />;
  }

  const hasIdFromUrl =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("id");
  if (!initialId && !serverRow && !hasIdFromUrl) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">
          Código postal no especificado.
        </p>
        <a
          href={baseSlash}
          className="text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !row) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-destructive mb-4">
          {error ?? "No se encontró el registro."}
        </p>
        <a
          href={baseSlash}
          className="text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return null;
}
