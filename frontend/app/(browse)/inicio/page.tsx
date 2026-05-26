"use client";

import { useState, useEffect, useCallback } from "react";
import { Hero } from "@/components/Hero";
import { ContentRow } from "@/components/ContentRow";
import { ContinuarViendoRow } from "@/components/ContinuarViendoRow";
import { apiRequest, getSelectedProfile, getRecomendaciones, getTopContenidos } from "@/lib/api";
import type { Contenido, MiListaItem, ContinuarViendoItem } from "@/lib/types";

const mockContenidos: Contenido[] = [
  {
    id: 1,
    titulo: "Pelicula de Ejemplo",
    descripcion: "Una emocionante pelicula llena de aventuras y momentos inolvidables.",
    tipo: "pelicula",
    anio: 2024,
    clasificacion: "PG-13",
    generos: [{ id: 1, nombre: "Accion" }, { id: 2, nombre: "Aventura" }],
  },
  {
    id: 2,
    titulo: "Serie Dramatica",
    descripcion: "Una serie que te mantendra al borde de tu asiento con cada episodio.",
    tipo: "serie",
    anio: 2023,
    clasificacion: "TV-MA",
    generos: [{ id: 3, nombre: "Drama" }, { id: 4, nombre: "Suspenso" }],
  },
];

export default function InicioPage() {
  const [allContent, setAllContent] = useState<Contenido[]>([]);
  const [topContent, setTopContent] = useState<Contenido[]>([]);
  const [recomendaciones, setRecomendaciones] = useState<Contenido[]>([]);
  const [miLista, setMiLista] = useState<Contenido[]>([]);
  const [continuarViendo, setContinuarViendo] = useState<ContinuarViendoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const contenidos = await apiRequest<Contenido[]>("/contenidos").catch(() => []);
      setAllContent(contenidos.length > 0 ? contenidos : mockContenidos);

      // HU10: Get top 10 most watched content
      const top = await getTopContenidos().catch(() => []);
      setTopContent(top);

      const profile = getSelectedProfile();
      if (profile && profile.id > 0) {
        // HU10: Get personalized recommendations based on watched genres
        const recs = await getRecomendaciones(profile.id).catch(() => []);
        setRecomendaciones(recs);

        // HU8: mi lista
        const lista = await apiRequest<MiListaItem[]>(`/perfiles/${profile.id}/mi-lista`).catch(() => []);
        setMiLista(lista.filter((item) => item.contenido).map((item) => item.contenido as Contenido));

        // HU7: continuar viendo — returns up to 10 unfinished items, ordered by last watched
        const continuar = await apiRequest<ContinuarViendoItem[]>(
          `/perfiles/${profile.id}/continuar`
        ).catch(() => []);
        setContinuarViendo(continuar);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setAllContent(mockContenidos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const peliculas = allContent.filter((c) => c.tipo === "pelicula");
  const series = allContent.filter((c) => c.tipo === "serie");

  return (
    <>
      <Hero />

      <div className="-mt-20 relative z-10">
        {/* HU7: Continuar viendo — only shown when there are unfinished items */}
        {continuarViendo.length > 0 && (
          <ContinuarViendoRow items={continuarViendo} />
        )}

        {/* HU10: Top 10 most watched */}
        {topContent.length > 0 && (
          <ContentRow
            title="Top 10 en TITOFLIX"
            contents={topContent.slice(0, 10)}
            loading={loading}
            linkPrefix="/contenido"
            emptyMessage="No hay contenido destacado disponible."
          />
        )}

        {/* HU10: Personalized recommendations */}
        {recomendaciones.length > 0 && (
          <ContentRow
            title="Recomendado para ti"
            contents={recomendaciones}
            loading={loading}
            linkPrefix="/contenido"
            emptyMessage="No hay recomendaciones disponibles."
          />
        )}

        <ContentRow
          title="Contenido principal"
          contents={allContent}
          loading={loading}
          linkPrefix="/contenido"
          emptyMessage="No hay peliculas o series disponibles en este momento. Intentar mas tarde."
        />

        <ContentRow
          title="Peliculas"
          contents={peliculas}
          loading={loading}
          linkPrefix="/contenido"
          emptyMessage="No hay peliculas disponibles en este momento. Intentar mas tarde."
        />

        <ContentRow
          title="Series"
          contents={series}
          loading={loading}
          linkPrefix="/contenido"
          emptyMessage="No hay series disponibles en este momento. Intentar mas tarde."
        />

        {/* HU8: Mi lista row on home */}
        {miLista.length > 0 && (
          <ContentRow
            title="Mi lista"
            contents={miLista}
            loading={false}
            linkPrefix="/contenido"
          />
        )}
      </div>
    </>
  );
}
