"use client";

import { ContentRow } from "./ContentRow";
import type { Contenido } from "@/lib/types";

interface RecommendationRowProps {
  recommendations: Contenido[];
  loading?: boolean;
  onContentClick: (content: Contenido) => void;
}

export function RecommendationRow({
  recommendations,
  loading = false,
  onContentClick,
}: RecommendationRowProps) {
  if (!loading && recommendations.length === 0) return null;

  return (
    <ContentRow
      title="Recomendados para vos"
      contents={recommendations.slice(0, 10)}
      loading={loading}
      onContentClick={onContentClick}
      emptyMessage="No hay recomendaciones disponibles en este momento."
    />
  );
}
