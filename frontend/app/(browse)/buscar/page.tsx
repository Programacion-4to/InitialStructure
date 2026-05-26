"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Film, Tv } from "lucide-react";
import Link from "next/link";
import { apiRequest, buildContentSearchUrl, getSelectedProfile } from "@/lib/api";
import { getAssetUrl } from "@/lib/api";
import type { Contenido, Genero } from "@/lib/types";
import { ContentCardSkeleton } from "@/components/ContentCard";

const ORDER_OPTIONS = [
  { value: "", label: "Relevancia" },
  { value: "anio_desc", label: "Mas recientes" },
  { value: "anio_asc", label: "Mas antiguos" },
  { value: "titulo_asc", label: "Titulo A-Z" },
] as const;

export default function BuscarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [tipo, setTipo] = useState<"" | "pelicula" | "serie">(
    (searchParams.get("tipo") as "" | "pelicula" | "serie") || ""
  );
  const [generoId, setGeneroId] = useState(searchParams.get("genero") || "");
  const [ordenar, setOrdenar] = useState(searchParams.get("ordenar") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [results, setResults] = useState<Contenido[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load generos for filter dropdown
  useEffect(() => {
    apiRequest<Genero[]>("/generos")
      .then(setGeneros)
      .catch(() => setGeneros([]));
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(
    async (q: string, t: string, g: string, o: string) => {
      setLoading(true);
      setSearched(true);
      try {
        const profile = getSelectedProfile();
        const url = buildContentSearchUrl({
          q: q || undefined,
          tipo: (t as "pelicula" | "serie") || undefined,
          genero: g || undefined,
          ordenar: (o as "anio_desc" | "anio_asc" | "titulo_asc") || undefined,
          perfil_id: profile?.id,
        });
        const data = await apiRequest<Contenido[]>(url);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Sync URL params → state on mount / back-navigation
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const t = searchParams.get("tipo") || "";
    const g = searchParams.get("genero") || "";
    const o = searchParams.get("ordenar") || "";
    setQuery(q);
    setTipo(t as "" | "pelicula" | "serie");
    setGeneroId(g);
    setOrdenar(o);
    if (q || t || g || o) {
      doSearch(q, t, g, o);
    }
  }, [searchParams, doSearch]);

  // Debounce text input
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams(value, tipo, generoId, ordenar);
    }, 400);
  };

  const pushParams = (q: string, t: string, g: string, o: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (t) params.set("tipo", t);
    if (g) params.set("genero", g);
    if (o) params.set("ordenar", o);
    router.push(`/buscar?${params.toString()}`);
  };

  const handleFilterApply = () => {
    setFiltersOpen(false);
    pushParams(query, tipo, generoId, ordenar);
  };

  const clearAll = () => {
    setQuery("");
    setTipo("");
    setGeneroId("");
    setOrdenar("");
    setResults([]);
    setSearched(false);
    router.push("/buscar");
    inputRef.current?.focus();
  };

  const hasFilters = tipo || generoId || ordenar;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="px-4 md:px-8 lg:px-16">
        {/* Search bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-2xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar peliculas, series..."
              className="w-full bg-secondary border border-border rounded-xl pl-11 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar busqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
              hasFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {[tipo, generoId, ordenar].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="mb-6 p-4 bg-card border border-border rounded-xl flex flex-wrap gap-4 items-end">
            {/* Tipo */}
            <label className="grid gap-1.5 text-xs text-muted-foreground font-medium">
              Tipo
              <div className="flex gap-2">
                {(["", "pelicula", "serie"] as const).map((t) => (
                  <button
                    key={t || "todos"}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      tipo === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-foreground border-border hover:bg-secondary/80"
                    }`}
                  >
                    {t === "" ? "Todos" : t === "pelicula" ? "Pelicula" : "Serie"}
                  </button>
                ))}
              </div>
            </label>

            {/* Genero */}
            <label className="grid gap-1.5 text-xs text-muted-foreground font-medium min-w-[160px]">
              Genero
              <select
                value={generoId}
                onChange={(e) => setGeneroId(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos los generos</option>
                {generos.map((g) => (
                  <option key={g.id} value={g.nombre}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </label>

            {/* Ordenar */}
            <label className="grid gap-1.5 text-xs text-muted-foreground font-medium min-w-[160px]">
              Ordenar por
              <select
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              >
                {ORDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleFilterApply}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : searched ? (
          results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {results.length} resultado{results.length !== 1 ? "s" : ""}
                {query ? ` para "${query}"` : ""}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {results.map((item) => (
                  <SearchResultCard key={item.id} item={item} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <Search size={48} className="text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Sin resultados</h2>
              <p className="text-muted-foreground max-w-sm">
                No encontramos nada que coincida con tu busqueda. Intenta con otros terminos o filtros.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Limpiar busqueda
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Search size={48} className="text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Busca peliculas y series</h2>
            <p className="text-muted-foreground max-w-sm">
              Escribi el titulo o usa los filtros para encontrar lo que queres ver.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ item }: { item: Contenido }) {
  const portadaUrl = getAssetUrl(item.portada_url);

  return (
    <Link href={`/contenido/${item.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
        {portadaUrl ? (
          <img
            src={portadaUrl}
            alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.tipo === "pelicula" ? (
              <Film size={40} className="text-muted-foreground" />
            ) : (
              <Tv size={40} className="text-muted-foreground" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
          <p className="text-white text-xs font-medium truncate">{item.titulo}</p>
        </div>
        {item.clasificacion_edad && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-medium">
            {item.clasificacion_edad}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground truncate">{item.titulo}</p>
      <p className="text-xs text-muted-foreground/60">
        {item.tipo === "pelicula" ? "Pelicula" : "Serie"}
        {item.anio ? ` · ${item.anio}` : ""}
      </p>
    </Link>
  );
}
