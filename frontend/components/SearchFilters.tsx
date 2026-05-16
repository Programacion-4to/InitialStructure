"use client";

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { listGeneros } from "@/lib/api";
import type { Genero } from "@/lib/types";

export interface FilterState {
  q: string;
  genero: string;
  tipo: string;
  ordenar: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    listGeneros()
      .then(setGeneros)
      .catch(() => setGeneros([]));
  }, []);

  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const hasActiveFilters =
    filters.genero !== "" || filters.tipo !== "" || filters.ordenar !== "";

  const clearAll = () => {
    onChange({ q: "", genero: "", tipo: "", ordenar: "" });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Buscar por titulo..."
            className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground text-sm"
          />
          {filters.q && (
            <button
              onClick={() => update({ q: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar busqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            hasActiveFilters
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-foreground border-border hover:bg-secondary/80"
          }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
          {/* Genero */}
          <select
            value={filters.genero}
            onChange={(e) => update({ genero: e.target.value })}
            className="px-3 py-2 bg-secondary text-foreground rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los generos</option>
            {generos.map((g) => (
              <option key={g.id} value={g.nombre}>
                {g.nombre}
              </option>
            ))}
          </select>

          {/* Tipo */}
          <select
            value={filters.tipo}
            onChange={(e) => update({ tipo: e.target.value })}
            className="px-3 py-2 bg-secondary text-foreground rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Peliculas y series</option>
            <option value="pelicula">Peliculas</option>
            <option value="serie">Series</option>
          </select>

          {/* Orden */}
          <select
            value={filters.ordenar}
            onChange={(e) => update({ ordenar: e.target.value })}
            className="px-3 py-2 bg-secondary text-foreground rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sin orden</option>
            <option value="anio_desc">Mas recientes primero</option>
            <option value="anio_asc">Mas antiguos primero</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="px-3 py-2 text-sm text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
