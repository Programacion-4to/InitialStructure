"use client";

import { useState, useEffect } from "react";
import { ContentRow } from "@/components/ContentRow";
import { apiRequest } from "@/lib/api";
import type { Contenido } from "@/lib/types";

export default function PeliculasPage() {
  const [peliculas, setPeliculas] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPeliculas() {
      try {
        const contenidos = await apiRequest<Contenido[]>("/contenidos");
        const filtered = contenidos.filter((c) => c.tipo === "pelicula");
        setPeliculas(filtered);
      } catch (error) {
        console.error("Error fetching peliculas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPeliculas();
  }, []);

  return (
    <div className="pt-24 pb-12">
      <h1 className="text-3xl font-bold text-foreground px-4 md:px-8 lg:px-16 mb-6">
        Peliculas
      </h1>
      <ContentRow
        title=""
        contents={peliculas}
        loading={loading}
        linkPrefix="/contenido"
        emptyMessage="No hay peliculas disponibles en este momento. Intentar mas tarde."
      />
    </div>
  );
}
