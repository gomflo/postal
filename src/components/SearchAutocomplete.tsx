"use client";

import * as React from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PostalCodeRow } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const CP_LENGTH = 5; // Código postal México
const LIMIT = 15;

function isPostalCodeQuery(q: string): boolean {
  const t = q.trim();
  return t.length === CP_LENGTH && /^\d{5}$/.test(t);
}

type SearchResult = Pick<
  PostalCodeRow,
  "id" | "asentamiento" | "tipo_asentamiento" | "municipio" | "estado" | "ciudad" | "codigo_postal"
>;

export function SearchAutocomplete() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [lastSearchedQuery, setLastSearchedQuery] = React.useState<string | null>(null);
  const listId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const search = React.useCallback(async (q: string) => {
    const trimmed = q.trim();
    const byCp = isPostalCodeQuery(q);
    const minLen = byCp ? CP_LENGTH : MIN_QUERY_LENGTH;
    if (!trimmed || trimmed.length < minLen) {
      setResults([]);
      setError(null);
      setLastSearchedQuery(null);
      return;
    }
    setLoading(true);
    setResults([]);
    setError(null);
    const qb = supabase
      .from("postal_codes")
      .select("id, asentamiento, tipo_asentamiento, municipio, estado, ciudad, codigo_postal");
    const { data, error: err } = byCp
      ? await qb.eq("codigo_postal", trimmed).limit(LIMIT)
      : await qb
          .textSearch("asentamiento_tsv", trimmed, {
            type: "plain",
            config: "simple",
          })
          .limit(LIMIT);
    setLoading(false);
    setLastSearchedQuery(trimmed);
    if (err) {
      setError(err.message);
      setResults([]);
      return;
    }
    setResults(data ?? []);
  }, []);

  React.useEffect(() => {
    const trimmed = query.trim();
    const byCp = isPostalCodeQuery(query);
    const minLen = byCp ? CP_LENGTH : MIN_QUERY_LENGTH;
    if (!trimmed || trimmed.length < minLen) {
      setResults([]);
      setError(null);
      setLastSearchedQuery(null);
      return;
    }
    const t = setTimeout(() => {
      search(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, search]);

  const showDropdown =
    query.length >= MIN_QUERY_LENGTH || isPostalCodeQuery(query);
  const hasContentToShow = loading || results.length > 0 || !!error;
  const minLenForQuery = isPostalCodeQuery(query) ? CP_LENGTH : MIN_QUERY_LENGTH;
  const showNoResults =
    !loading &&
    !error &&
    results.length === 0 &&
    query.trim().length >= minLenForQuery &&
    lastSearchedQuery !== null &&
    query.trim() === lastSearchedQuery;
  const isOpen =
    open && showDropdown && (hasContentToShow || showNoResults);

  React.useEffect(() => {
    setOpen(showDropdown);
  }, [showDropdown]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [results, loading, error]);

  // Hacer scroll al ítem seleccionado al navegar con teclado
  React.useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= results.length) return;
    const option = document.getElementById(`${listId}-item-${selectedIndex}`);
    option?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex, results.length, listId]);

  const itemCount = results.length;
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < itemCount - 1 ? i + 1 : i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      window.location.href = `/detalle/${results[selectedIndex].id}`;
    }
  };

  return (
    <div className="relative w-full">
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <label htmlFor="search-colonia" className="sr-only">
              Buscar por colonia o código postal
            </label>
            <div
              className={cn(
                "flex h-[52px] items-center gap-3 rounded-xl border border-input bg-background px-4 shadow-sm transition-[border-color,box-shadow]",
                "focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-[3px]"
              )}
            >
              <Search
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <Input
                ref={inputRef}
                id="search-colonia"
                type="search"
                autoComplete="off"
                spellCheck={false}
                aria-label="Buscar por colonia o código postal"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-activedescendant={
                  results[selectedIndex]
                    ? `${listId}-item-${selectedIndex}`
                    : undefined
                }
                placeholder="Colonia o código postal (ej. Del Valle, 03100)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => showDropdown && setOpen(true)}
                className="h-8 min-h-0 flex-1 border-0 bg-transparent p-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {/* Espacio reservado para el botón de borrar evita que el contenedor cambie de altura al escribir */}
              <span className="flex size-8 shrink-0 items-center justify-center">
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Borrar búsqueda"
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                )}
              </span>
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={(e) => {
            if (inputRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
        >
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            className="max-h-[min(320px,55vh)] overflow-y-auto overscroll-behavior-contain py-1"
          >
            {loading && (
              <div
                className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                Buscando…
              </div>
            )}
            {!loading && error && (
              <div className="px-4 py-6 text-center text-sm text-destructive">
                {error}
              </div>
            )}
            {showNoResults && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <p className="font-medium">Sin resultados</p>
                <p className="mt-1 text-xs">
                  Prueba con otro nombre de colonia, municipio o código postal
                </p>
              </div>
            )}
            {!loading &&
              results.map((row, i) => (
                <a
                  key={row.id}
                  id={`${listId}-item-${i}`}
                  role="option"
                  aria-selected={i === selectedIndex}
                  href={`/detalle/${row.id}`}
                  className={cn(
                    "mx-2 flex cursor-pointer gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                    "min-h-[52px] touch-manipulation",
                    i === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/80 text-muted-foreground"
                    aria-hidden
                  >
                    <MapPin className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                    <span className="truncate font-medium leading-tight text-foreground">
                      {row.asentamiento}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {row.municipio}, {row.estado} — {row.codigo_postal}
                    </span>
                  </span>
                </a>
              ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
