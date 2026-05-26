"use client";

import { Play, Film, Tv } from "lucide-react";
import { getAssetUrl } from "@/lib/api";
import type { Contenido } from "@/lib/types";

interface ContentCardProps {
  content: Contenido;
  onClick?: () => void;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  const portadaUrl = getAssetUrl(content.portada_url);
  const cardClassName =
    "group flex-shrink-0 w-40 md:w-48 lg:w-56 focus:outline-none";

  const contentMarkup = (
    <>
      {/* Thumbnail */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card border border-border group-hover:border-muted-foreground transition-all duration-200">
        {portadaUrl ? (
          <img
            src={portadaUrl}
            alt={content.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            {content.tipo === "pelicula" ? (
              <Film size={48} className="text-muted-foreground" />
            ) : (
              <Tv size={48} className="text-muted-foreground" />
            )}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Play size={24} fill="white" className="text-white ml-1" />
          </div>
        </div>
        
        {/* Type badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/80 text-xs font-medium rounded">
          {content.tipo === "pelicula" ? "Pelicula" : "Serie"}
        </div>
        
        {/* Classification badge */}
        {content.clasificacion && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/80 text-primary-foreground text-xs font-medium rounded">
            {content.clasificacion}
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="mt-2 text-left">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {content.titulo}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {content.anio && (
            <span className="text-xs text-muted-foreground">{content.anio}</span>
          )}
          {content.generos && content.generos.length > 0 && (
            <span className="text-xs text-muted-foreground truncate">
              {content.generos.slice(0, 2).map((g) => g.nombre).join(", ")}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {contentMarkup}
      </button>
    );
  }

  return <article className={cardClassName}>{contentMarkup}</article>;
}

// Loading skeleton for content cards
export function ContentCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-40 md:w-48 lg:w-56">
      <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
      <div className="mt-2 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}
