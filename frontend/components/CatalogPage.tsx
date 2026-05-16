"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { SearchFilters, type FilterState } from "./SearchFilters";
import { ContentGrid } from "./ContentGrid";
import { searchContenidos, getSelectedProfile } from "@/lib/api";
import type { Contenido } from "@/lib/types";

interface CatalogPageProps {
  onContentClick: (content: Contenido) => void;
  /** Optional pre-set filter for tipo */
  initialTipo?: string;
}

export function CatalogPage({ onContentClick, initialTipo = "" }: CatalogPageProps) {
  const [filters, setFilters] = useState<FilterState>({
    q: "",
    genero: "",
    tipo: initialTipo,
    ordenar: "",
  });
  const [contents, setContents] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profile = getSelectedProfile();

  const fetchContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchContenidos({
        q: filters.q || undefined,
        tipo: filters.tipo || undefined,
        genero: filters.genero || undefined,
        ordenar: filters.ordenar || undefined,
        perfil_id: profile?.id,
      });
      setContents(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el catalogo"
      );
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [filters, profile?.id]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(fetchContents, 300);
    return () => clearTimeout(timer);
  }, [fetchContents]);

  // Update tipo when initialTipo changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, tipo: initialTipo }));
  }, [initialTipo]);

  return (
    <div className="pt-24 pb-12 px-4 md:px-8 lg:px-16">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        {initialTipo === "pelicula"
          ? "Peliculas"
          : initialTipo === "serie"
            ? "Series"
            : "Catalogo"}
      </h1>

      <SearchFilters filters={filters} onChange={setFilters} />

      <div className="mt-8">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-primary text-lg mb-4">{error}</p>
            <button
              onClick={fetchContents}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <ContentGrid
            contents={contents}
            loading={loading}
            onContentClick={onContentClick}
            emptyMessage={
              filters.q || filters.genero || filters.tipo
                ? "No se encontraron resultados para los filtros seleccionados."
                : "No hay contenido disponible en este momento."
            }
          />
        )}
      </div>
    </div>
  );
}
