"use client";

import { useState, useEffect } from "react";
import { ContentRow } from "./ContentRow";
import { getTopContenidos, listGeneros } from "@/lib/api";
import type { Contenido, Genero } from "@/lib/types";

interface TopContentRowProps {
  onContentClick: (content: Contenido) => void;
}

export function TopContentRow({ onContentClick }: TopContentRowProps) {
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [selectedGenero, setSelectedGenero] = useState("");
  const [topContent, setTopContent] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGeneros()
      .then(setGeneros)
      .catch(() => setGeneros([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    getTopContenidos(selectedGenero || undefined)
      .then(setTopContent)
      .catch(() => setTopContent([]))
      .finally(() => setLoading(false));
  }, [selectedGenero]);

  return (
    <section className="py-6">
      <div className="px-4 md:px-8 lg:px-16 flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">
          {selectedGenero
            ? `Top ${selectedGenero}`
            : "Top 10 de la plataforma"}
        </h2>
        <select
          value={selectedGenero}
          onChange={(e) => setSelectedGenero(e.target.value)}
          className="px-3 py-1.5 bg-secondary text-foreground rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary w-fit"
        >
          <option value="">Todos los generos</option>
          {generos.map((g) => (
            <option key={g.id} value={g.nombre}>
              {g.nombre}
            </option>
          ))}
        </select>
      </div>

      <ContentRow
        title=""
        contents={topContent}
        loading={loading}
        onContentClick={onContentClick}
        emptyMessage="No hay contenido top disponible."
      />
    </section>
  );
}
