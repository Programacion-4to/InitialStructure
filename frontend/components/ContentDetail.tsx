"use client";

import { useState, useEffect } from "react";
import { X, Play, Plus, Check, Star, Loader2, Film, Tv } from "lucide-react";
import { apiRequest, getSelectedProfile, getBackendUrl, getAssetUrl } from "@/lib/api";
import type { Contenido, Temporada, Episodio, PlaybackResponse, MiListaItem, VideoVariant } from "@/lib/types";

interface ContentDetailProps {
  content: Contenido;
  onClose: () => void;
  onPlay: (streamUrl: string, title: string) => void;
}

export function ContentDetail({ content, onClose, onPlay }: ContentDetailProps) {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<Temporada | null>(null);
  const [loading, setLoading] = useState(false);
  const [playLoading, setPlayLoading] = useState<string | null>(null);
  const [inMiLista, setInMiLista] = useState(false);
  const [miListaLoading, setMiListaLoading] = useState(false);
  const [selectedMovieQuality, setSelectedMovieQuality] = useState("");
  const [selectedEpisodeQualities, setSelectedEpisodeQualities] = useState<Record<number, string>>({});

  const profile = getSelectedProfile();

  // Fetch temporadas for series
  useEffect(() => {
    if (content.tipo === "serie") {
      setLoading(true);
      apiRequest<Temporada[]>(`/contenidos/${content.id}/temporadas`)
        .then((data) => {
          setTemporadas(data);
          if (data.length > 0) {
            setSelectedTemporada(data[0]);
          }
        })
        .catch(() => setTemporadas([]))
        .finally(() => setLoading(false));
    }
  }, [content]);

  // Fetch episodios when temporada changes
  useEffect(() => {
    if (selectedTemporada) {
      setLoading(true);
      apiRequest<Episodio[]>(`/temporadas/${selectedTemporada.id}/episodios`)
        .then((data) => setEpisodios(data))
        .catch(() => setEpisodios([]))
        .finally(() => setLoading(false));
    }
  }, [selectedTemporada]);

  // Check if content is in Mi Lista
  useEffect(() => {
    if (profile) {
      apiRequest<MiListaItem[]>(`/perfiles/${profile.id}/mi-lista`)
        .then((data) => {
          const found = data.some((item) => item.contenido_id === content.id);
          setInMiLista(found);
        })
        .catch(() => {});
    }
  }, [content, profile]);

  const movieQualities = qualityOptions(content.video_variants);
  const portadaUrl = getAssetUrl(content.portada_url);

  const handlePlayMovie = async () => {
    setPlayLoading("movie");
    try {
      const quality = selectedMovieQuality || movieQualities[0] || "";
      const params = new URLSearchParams();
      if (quality) params.set("quality", quality);
      if (profile?.id) params.set("perfil_id", String(profile.id));
      const path = `/contenidos/${content.id}/playback${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiRequest<PlaybackResponse>(path);
      const streamUrl = getBackendUrl(data.stream_url);
      onPlay(streamUrl, content.titulo);
    } catch (error) {
      console.error("Error getting playback URL:", error);
    } finally {
      setPlayLoading(null);
    }
  };

  const handlePlayEpisode = async (episodio: Episodio) => {
    setPlayLoading(`ep-${episodio.id}`);
    try {
      const qualities = qualityOptions(episodio.video_variants);
      const quality = selectedEpisodeQualities[episodio.id] || qualities[0] || "";
      const params = new URLSearchParams();
      if (quality) params.set("quality", quality);
      if (profile?.id) params.set("perfil_id", String(profile.id));
      const path = `/episodios/${episodio.id}/playback${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiRequest<PlaybackResponse>(path);
      const streamUrl = getBackendUrl(data.stream_url);
      onPlay(streamUrl, `${content.titulo} - T${selectedTemporada?.numero} E${episodio.numero}: ${episodio.titulo}`);
    } catch (error) {
      console.error("Error getting playback URL:", error);
    } finally {
      setPlayLoading(null);
    }
  };

  const handleToggleMiLista = async () => {
    if (!profile) return;
    
    setMiListaLoading(true);
    try {
      if (inMiLista) {
        await apiRequest(`/perfiles/${profile.id}/mi-lista/${content.id}`, { method: "DELETE" });
        setInMiLista(false);
      } else {
        await apiRequest(`/perfiles/${profile.id}/mi-lista`, {
          method: "POST",
          body: JSON.stringify({ contenido_id: content.id }),
        });
        setInMiLista(true);
      }
    } catch (error) {
      console.error("Error toggling Mi Lista:", error);
    } finally {
      setMiListaLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Cerrar"
        >
          <X size={24} className="text-foreground" />
        </button>

        {/* Header with poster/background */}
        <div className="relative h-64 md:h-80">
          {portadaUrl ? (
            <img
              src={portadaUrl}
              alt={content.titulo}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              {content.tipo === "pelicula" ? (
                <Film size={80} className="text-muted-foreground" />
              ) : (
                <Tv size={80} className="text-muted-foreground" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          
          {/* Title overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{content.titulo}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-20rem)]">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            {content.anio && (
              <span className="text-muted-foreground">{content.anio}</span>
            )}
            {content.clasificacion && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">
                {content.clasificacion}
              </span>
            )}
            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
              {content.tipo === "pelicula" ? "Pelicula" : "Serie"}
            </span>
            {content.promedio_calificacion !== undefined && content.promedio_calificacion > 0 && (
              <span className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />
                {content.promedio_calificacion.toFixed(1)}
              </span>
            )}
          </div>

          {/* Genres */}
          {content.generos && content.generos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {content.generos.map((genero) => (
                <span
                  key={genero.id}
                  className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                >
                  {genero.nombre}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {content.descripcion && (
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {content.descripcion}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mb-6">
            {content.tipo === "pelicula" && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePlayMovie}
                  disabled={playLoading === "movie"}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {playLoading === "movie" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                  Reproducir
                </button>
                {movieQualities.length > 0 && (
                  <select
                    className="rounded-lg border border-border bg-secondary px-3 py-3 text-sm font-semibold text-secondary-foreground outline-none focus:ring-2 focus:ring-primary"
                    value={selectedMovieQuality || movieQualities[0]}
                    onChange={(event) => setSelectedMovieQuality(event.target.value)}
                    aria-label="Calidad de pelicula"
                  >
                    {movieQualities.map((quality) => (
                      <option key={quality} value={quality}>
                        {quality}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <button
              onClick={handleToggleMiLista}
              disabled={miListaLoading}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50"
            >
              {miListaLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : inMiLista ? (
                <Check size={20} />
              ) : (
                <Plus size={20} />
              )}
              {inMiLista ? "En Mi lista" : "Mi lista"}
            </button>
          </div>

          {/* Series: Temporadas and Episodios */}
          {content.tipo === "serie" && (
            <div>
              {/* Temporadas tabs */}
              {temporadas.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Temporadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {temporadas.map((temporada) => (
                      <button
                        key={temporada.id}
                        onClick={() => setSelectedTemporada(temporada)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTemporada?.id === temporada.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        Temporada {temporada.numero}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Episodios list */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : episodios.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Episodios</h3>
                  {episodios.map((episodio) => (
                    <div
                      key={episodio.id}
                      className="flex items-center justify-between gap-3 p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      {getAssetUrl(episodio.thumbnail_url) ? (
                        <img
                          src={getAssetUrl(episodio.thumbnail_url) || ""}
                          alt=""
                          className="h-16 w-28 flex-shrink-0 rounded-md object-cover"
                        />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            E{episodio.numero}
                          </span>
                          <h4 className="font-medium text-foreground truncate">
                            {episodio.titulo}
                          </h4>
                        </div>
                        {episodio.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {episodio.descripcion}
                          </p>
                        )}
                      </div>
                      {qualityOptions(episodio.video_variants).length > 0 && (
                        <select
                          className="rounded-md border border-border bg-background px-2 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                          value={
                            selectedEpisodeQualities[episodio.id] ||
                            qualityOptions(episodio.video_variants)[0]
                          }
                          onChange={(event) =>
                            setSelectedEpisodeQualities((current) => ({
                              ...current,
                              [episodio.id]: event.target.value,
                            }))
                          }
                          aria-label={`Calidad de ${episodio.titulo}`}
                        >
                          {qualityOptions(episodio.video_variants).map((quality) => (
                            <option key={quality} value={quality}>
                              {quality}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => handlePlayEpisode(episodio)}
                        disabled={playLoading === `ep-${episodio.id}`}
                        className="ml-4 w-10 h-10 flex-shrink-0 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {playLoading === `ep-${episodio.id}` ? (
                          <Loader2 size={20} className="animate-spin text-primary-foreground" />
                        ) : (
                          <Play size={20} fill="white" className="text-primary-foreground ml-0.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : temporadas.length > 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay episodios disponibles para esta temporada.
                </p>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay temporadas disponibles para esta serie.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function qualityOptions(variants: VideoVariant[] | undefined): string[] {
  return [...(variants || [])]
    .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality))
    .map((variant) => variant.quality);
}

function qualityRank(quality: string): number {
  return { FHD: 1, QHD: 2, "4K": 3 }[quality] || 0;
}
