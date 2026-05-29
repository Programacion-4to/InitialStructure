"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { ContentCard, ContentCardSkeleton } from "./ContentCard";
import type { Contenido } from "@/lib/types";

interface ContentRowProps {
  title: string;
  contents: Contenido[];
  loading?: boolean;
  onContentClick?: (content: Contenido) => void;
  linkPrefix?: string;
  emptyMessage?: string;
}

export function ContentRow({
  title,
  contents,
  loading = false,
  onContentClick,
  linkPrefix,
  emptyMessage = "No hay contenido disponible en este momento.",
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-6">
      <div className="px-4 md:px-8 lg:px-16">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
          {title}
        </h2>
      </div>

      <div className="relative group/row">
        {/* Scroll buttons */}
        {!loading && contents.length > 4 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-background"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-background"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight size={24} className="text-foreground" />
            </button>
          </>
        )}

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-16 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))
          ) : contents.length > 0 ? (
            // Content cards
            contents.map((content) => (
              linkPrefix ? (
                <Link key={content.id} href={`${linkPrefix}/${content.id}`}>
                  <ContentCard content={content} />
                </Link>
              ) : (
                <ContentCard
                  key={content.id}
                  content={content}
                  onClick={() => onContentClick?.(content)}
                />
              )
            ))
          ) : (
            // Empty state
            <div className="w-full py-12 text-center">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
