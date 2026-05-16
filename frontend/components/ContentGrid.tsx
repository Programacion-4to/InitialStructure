"use client";

import { ContentCard, ContentCardSkeleton } from "./ContentCard";
import type { Contenido } from "@/lib/types";

interface ContentGridProps {
  contents: Contenido[];
  loading?: boolean;
  onContentClick: (content: Contenido) => void;
  emptyMessage?: string;
}

export function ContentGrid({
  contents,
  loading = false,
  onContentClick,
  emptyMessage = "No se encontraron resultados.",
}: ContentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {contents.map((content) => (
        <ContentCard
          key={content.id}
          content={content}
          onClick={() => onContentClick(content)}
        />
      ))}
    </div>
  );
}
