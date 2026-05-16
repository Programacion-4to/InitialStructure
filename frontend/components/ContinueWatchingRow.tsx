"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Film, Tv } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import type { Contenido, Vista } from "@/lib/types";

interface ContinueWatchingRowProps {
  vistas: Vista[];
  /** Map of contenido_id -> Contenido for resolving titles/thumbnails */
  contenidoMap: Map<number, Contenido>;
  onContentClick: (contenidoId: number, vista: Vista) => void;
}

export function ContinueWatchingRow({
  vistas,
  contenidoMap,
  onContentClick,
}: ContinueWatchingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (vistas.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-6">
      <div className="px-4 md:px-8 lg:px-16">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
          Seguir viendo
        </h2>
      </div>

      <div className="relative group">
        {vistas.length > 3 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight size={24} className="text-foreground" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-8 lg:px-16 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {vistas.slice(0, 10).map((vista) => {
            const cId = vista.contenido_id ?? 0;
            const content = contenidoMap.get(cId);
            const title = content?.titulo ?? `Contenido #${cId}`;

            return (
              <button
                key={vista.id}
                onClick={() => onContentClick(cId, vista)}
                className="group/card flex-shrink-0 w-60 md:w-72 focus:outline-none"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-card border border-border group-hover/card:border-muted-foreground transition-all">
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    {content?.tipo === "serie" ? (
                      <Tv size={36} className="text-muted-foreground" />
                    ) : (
                      <Film size={36} className="text-muted-foreground" />
                    )}
                  </div>
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play size={24} fill="white" className="text-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <ProgressBar
                    segundosVistos={vista.segundos_vistos}
                    duracionMin={content?.duracion_min}
                    terminado={vista.terminado}
                    compact
                  />
                </div>

                {/* Title */}
                <p className="mt-1 text-sm text-foreground truncate text-left group-hover/card:text-primary transition-colors">
                  {title}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
