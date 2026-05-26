"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Film, Tv, List, Loader2 } from "lucide-react";
import { apiRequest, getSelectedProfile, getAssetUrl } from "@/lib/api";
import type { Contenido, MiListaItem } from "@/lib/types";

export default function MiListaPage() {
  const [miLista, setMiLista] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const profile = getSelectedProfile();

  const fetchMiLista = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    try {
      // HU8: GET /perfiles/{id}/mi-lista — respects infantil restriction via perfil_id on the backend
      const lista = await apiRequest<MiListaItem[]>(`/perfiles/${profile.id}/mi-lista`);
      setMiLista(lista.filter((item) => item.contenido).map((item) => item.contenido as Contenido));
    } catch {
      setMiLista([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchMiLista();
  }, [fetchMiLista]);

  // HU8: remove item from Mi Lista
  const handleRemove = async (contenidoId: number) => {
    if (!profile?.id) return;
    setRemovingId(contenidoId);
    try {
      await apiRequest(`/perfiles/${profile.id}/mi-lista/${contenidoId}`, { method: "DELETE" });
      setMiLista((prev) => prev.filter((c) => c.id !== contenidoId));
    } catch {
      // Keep item in list if removal failed
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 md:px-8 lg:px-16">
      <h1 className="text-3xl font-bold text-foreground mb-6">Mi lista</h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MiListaSkeleton key={i} />
          ))}
        </div>
      ) : miLista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <List size={48} className="text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Tu lista esta vacia</h2>
          <p className="text-muted-foreground max-w-sm">
            Agrega peliculas y series desde su pagina de detalle para verlas mas tarde.
          </p>
          <Link
            href="/inicio"
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Explorar catalogo
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {miLista.length} titulo{miLista.length !== 1 ? "s" : ""} guardado{miLista.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {miLista.map((contenido) => (
              <MiListaCard
                key={contenido.id}
                contenido={contenido}
                removing={removingId === contenido.id}
                onRemove={() => handleRemove(contenido.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiListaCard({
  contenido,
  removing,
  onRemove,
}: {
  contenido: Contenido;
  removing: boolean;
  onRemove: () => void;
}) {
  const portadaUrl = getAssetUrl(contenido.portada_url);

  return (
    <div className="group relative">
      <Link href={`/contenido/${contenido.id}`} className="block">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
          {portadaUrl ? (
            <img
              src={portadaUrl}
              alt={contenido.titulo}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {contenido.tipo === "pelicula" ? (
                <Film size={40} className="text-muted-foreground" />
              ) : (
                <Tv size={40} className="text-muted-foreground" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {contenido.clasificacion_edad && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded font-medium">
              {contenido.clasificacion_edad}
            </div>
          )}
        </div>
        <p className="mt-1.5 text-xs text-foreground font-medium truncate">{contenido.titulo}</p>
        <p className="text-xs text-muted-foreground">
          {contenido.tipo === "pelicula" ? "Pelicula" : "Serie"}
          {contenido.anio ? ` · ${contenido.anio}` : ""}
        </p>
      </Link>

      {/* HU8: Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        disabled={removing}
        aria-label={`Quitar ${contenido.titulo} de Mi lista`}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        {removing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <X size={14} />
        )}
      </button>
    </div>
  );
}

function MiListaSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="aspect-[2/3] rounded-lg bg-secondary" />
      <div className="h-3 rounded bg-secondary w-3/4" />
      <div className="h-2.5 rounded bg-secondary w-1/2" />
    </div>
  );
}
