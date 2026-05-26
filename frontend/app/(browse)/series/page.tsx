"use client";

import { useState, useEffect } from "react";
import { ContentRow } from "@/components/ContentRow";
import { apiRequest } from "@/lib/api";
import type { Contenido } from "@/lib/types";

export default function SeriesPage() {
  const [series, setSeries] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeries() {
      try {
        const contenidos = await apiRequest<Contenido[]>("/contenidos");
        const filtered = contenidos.filter((c) => c.tipo === "serie");
        setSeries(filtered);
      } catch (error) {
        console.error("Error fetching series:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSeries();
  }, []);

  return (
    <div className="pt-24 pb-12">
      <h1 className="text-3xl font-bold text-foreground px-4 md:px-8 lg:px-16 mb-6">
        Series
      </h1>
      <ContentRow
        title=""
        contents={series}
        loading={loading}
        linkPrefix="/contenido"
        emptyMessage="No hay series disponibles en este momento. Intentar mas tarde."
      />
    </div>
  );
}
