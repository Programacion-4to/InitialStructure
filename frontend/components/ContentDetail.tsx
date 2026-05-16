"use client";

import { useState, useEffect } from "react";
import {
  X,
  Play,
  Plus,
  Check,
  Loader2,
  Film,
  Tv,
  Clock,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { RatingStars } from "./RatingStars";
import { ProgressBar } from "./ProgressBar";
import {
  getSelectedProfile,
  getBackendUrl,
  getTemporadas,
  getEpisodios,
  getPlayback,
  getEpisodioPlayback,
  getMiLista,
  addToMiLista,
  removeFromMiLista,
  upsertCalificacion,
  upsertVista,
  type ApiError,
} from "@/lib/api";
import type {
  Contenido,
  Temporada,
  Episodio,
  Vista,
} from "@/lib/types";

interface ContentDetailProps {
  content: Contenido;
  onClose: () => void;
  onPlay: (streamUrl: string, title: string, vista?: { contenido_id?: number; episodio_id?: number }) => void;
  /** Current vista for this content (from continuar viendo) */
  vista?: Vista | null;
}

export function ContentDetail({ content, onClose, onPlay, vista }: ContentDetailProps) {
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<Temporada | null>(null);
  const [loading, setLoading] = useState(false);
  const [playLoading, setPlayLoading] = useState<string | null>(null);
  const [inMiLista, setInMiLista] = useState(false);
  const [miListaLoading, setMiListaLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [infantilBlocked, setInfantilBlocked] = useState(false);

  const profile = getSelectedProfile();
  const isInfantil = profile?.es_infantil ?? false;

  // Check infantil restriction
  useEffect(() => {
    if (isInfantil && content.clasificacion_edad !== "ATP") {
      setInfantilBlocked(true);
    }
  }, [isInfantil, content.clasificacion_edad]);

  // Fetch temporadas for series
  useEffect(() => {
    if (content.tipo === "serie") {
      setLoading(true);
      getTemporadas(content.id)
        .then((data) => {
          setTemporadas(data);
          if (data.length > 0) setSelectedTemporada(data[0]);
        })
        .catch(() => setTemporadas([]))
        .finally(() => setLoading(false));
    }
  }, [content]);

  // Fetch episodios when temporada changes
  useEffect(() => {
    if (selectedTemporada) {
      setLoading(true);
      getEpisodios(selectedTemporada.id)
        .then(setEpisodios)
        .catch(() => setEpisodios([]))
        .finally(() => setLoading(false));
    }
  }, [selectedTemporada]);

  // Check if content is in Mi Lista
  useEffect(() => {
    if (profile) {
      getMiLista(profile.id)
        .then((data) => {
          setInMiLista(data.some((c) => c.id === content.id));
        })
        .catch(() => {});
    }
  }, [content, profile]);

  const handlePlayMovie = async () => {
    if (infantilBlocked) return;
    setPlayLoading("movie");
    try {
      const data = await getPlayback(content.id);
      const streamUrl = getBackendUrl(data.stream_url);
      onPlay(streamUrl, content.titulo, { contenido_id: content.id });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setInfantilBlocked(true);
      }
    } finally {
      setPlayLoading(null);
    }
  };

  const handlePlayEpisode = async (episodio: Episodio) => {
    if (infantilBlocked) return;
    setPlayLoading(`ep-${episodio.id}`);
    try {
      const data = await getEpisodioPlayback(episodio.id);
      const streamUrl = getBackendUrl(data.stream_url);
      onPlay(
        streamUrl,
        `${content.titulo} - T${selectedTemporada?.numero} E${episodio.numero}: ${episodio.titulo}`,
        { episodio_id: episodio.id }
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setInfantilBlocked(true);
      }
    } finally {
      setPlayLoading(null);
    }
  };

  const handleToggleMiLista = async () => {
    if (!profile) return;
    setMiListaLoading(true);
    try {
      if (inMiLista) {
        await removeFromMiLista(profile.id, content.id);
        setInMiLista(false);
      } else {
        await addToMiLista(profile.id, content.id);
        setInMiLista(true);
      }
    } catch {
      // silently fail
    } finally {
      setMiListaLoading(false);
    }
  };

  const handleRate = async (puntaje: number) => {
    if (!profile) return;
    setRatingError(null);
    try {
      await upsertCalificacion(profile.id, content.id, puntaje);
      setUserRating(puntaje);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al calificar";
      if (msg.toLowerCase().includes("empezaste") || msg.toLowerCase().includes("vista")) {
        setRatingError("Solo podes calificar contenidos que empezaste a ver.");
      } else {
        setRatingError(msg);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
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
          {content.storage_folder_id ? (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              {content.tipo === "pelicula" ? (
                <Film size={80} className="text-muted-foreground" />
              ) : (
                <Tv size={80} className="text-muted-foreground" />
              )}
            </div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              {content.titulo}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-20rem)]">
          {/* Infantil block */}
          {infantilBlocked && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg mb-4">
              <ShieldAlert size={24} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">
                Este contenido no esta disponible para perfiles infantiles.
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            {content.anio && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar size={14} />
                {content.anio}
              </span>
            )}
            <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">
              {content.clasificacion_edad}
            </span>
            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
              {content.tipo === "pelicula" ? "Pelicula" : "Serie"}
            </span>
            {content.duracion_min && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock size={14} />
                {content.duracion_min} min
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
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {content.descripcion}
            </p>
          )}

          {/* Progress bar (if user has vista) */}
          {vista && (
            <div className="mb-4">
              <ProgressBar
                segundosVistos={vista.segundos_vistos}
                duracionMin={content.duracion_min}
                terminado={vista.terminado}
              />
            </div>
          )}

          {/* Rating */}
          <div className="mb-4">
            <RatingStars
              value={userRating}
              average={content.promedio_calificaciones}
              onRate={handleRate}
              disabled={infantilBlocked}
            />
            {ratingError && (
              <p className="text-primary text-xs mt-1">{ratingError}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-6">
            {content.tipo === "pelicula" && (
              <button
                onClick={handlePlayMovie}
                disabled={playLoading === "movie" || infantilBlocked}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {playLoading === "movie" ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
                Reproducir
              </button>
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
              {inMiLista ? "Quitar de Mi Lista" : "Agregar a Mi Lista"}
            </button>
          </div>

          {/* Series: Temporadas and Episodios */}
          {content.tipo === "serie" && (
            <div>
              {temporadas.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Temporadas
                  </h3>
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

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    size={32}
                    className="animate-spin text-primary"
                  />
                </div>
              ) : episodios.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Episodios
                  </h3>
                  {episodios.map((episodio) => (
                    <div
                      key={episodio.id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            E{episodio.numero}
                          </span>
                          <h4 className="font-medium text-foreground truncate">
                            {episodio.titulo}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {episodio.duracion_min} min
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlayEpisode(episodio)}
                        disabled={
                          playLoading === `ep-${episodio.id}` ||
                          infantilBlocked
                        }
                        className="ml-4 w-10 h-10 flex-shrink-0 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {playLoading === `ep-${episodio.id}` ? (
                          <Loader2
                            size={20}
                            className="animate-spin text-primary-foreground"
                          />
                        ) : (
                          <Play
                            size={20}
                            fill="white"
                            className="text-primary-foreground ml-0.5"
                          />
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
