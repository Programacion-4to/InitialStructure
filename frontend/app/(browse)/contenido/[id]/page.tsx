"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Plus, Check, Star, Loader2, Film, Tv } from "lucide-react";
import { apiRequest, getSelectedProfile, getBackendUrl, getAssetUrl, getCalificacion, setCalificacion } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "@/components/BrandLogo";
import { StarRating } from "@/components/StarRating";
import type { Contenido, Temporada, Episodio, PlaybackResponse, MiListaItem, VideoVariant, Profile, Vista } from "@/lib/types";

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, profile, account } = useAuth();
  const contentId = Number(params.id);

  const [content, setContent] = useState<Contenido | null>(null);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [selectedTemporada, setSelectedTemporada] = useState<Temporada | null>(null);
  const [loading, setLoading] = useState(true);
  const [playLoading, setPlayLoading] = useState<string | null>(null);
  const [inMiLista, setInMiLista] = useState(false);
  const [miListaLoading, setMiListaLoading] = useState(false);
  const [selectedMovieQuality, setSelectedMovieQuality] = useState("");
  const [selectedEpisodeQualities, setSelectedEpisodeQualities] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentProfileData, setCurrentProfileData] = useState<Profile | null>(null);
  
  // HU9: Calificacion state
  const [userRating, setUserRating] = useState<number>(0);
  const [hasWatched, setHasWatched] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (account?.is_admin) {
      router.replace("/admin");
      return;
    }

    if (!profile) {
      router.replace("/perfiles");
      return;
    }
  }, [isAuthenticated, authLoading, account, profile, router]);

  // Fetch current profile data to check if infantil
  useEffect(() => {
    if (!profile || !account) return;
    
    apiRequest<Profile[]>(`/cuentas/${account.id}/perfiles`)
      .then((profiles) => {
        const current = profiles.find((p) => p.id === profile.id);
        if (current) {
          setCurrentProfileData(current);
        }
      })
      .catch(() => {});
  }, [profile, account]);

  // Fetch content
  useEffect(() => {
    if (!contentId || !isAuthenticated) return;

    async function fetchContent() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<Contenido>(`/contenidos/${contentId}`);
        setContent(data);

        // Check infantil restriction (HU4)
        if (currentProfileData?.es_infantil && data.clasificacion_edad !== "ATP") {
          setError("Este contenido no esta disponible para perfiles infantiles.");
        }

        if (data.tipo === "serie") {
          const tempData = await apiRequest<Temporada[]>(`/contenidos/${contentId}/temporadas`);
          setTemporadas(tempData);
          if (tempData.length > 0) {
            setSelectedTemporada(tempData[0]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el contenido");
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [contentId, isAuthenticated, currentProfileData]);

  // Fetch episodios when temporada changes
  useEffect(() => {
    if (selectedTemporada) {
      apiRequest<Episodio[]>(`/temporadas/${selectedTemporada.id}/episodios`)
        .then((data) => setEpisodios(data))
        .catch(() => setEpisodios([]));
    }
  }, [selectedTemporada]);

  // Check if content is in Mi Lista
  useEffect(() => {
    if (profile && content) {
      apiRequest<MiListaItem[]>(`/perfiles/${profile.id}/mi-lista`)
        .then((data) => {
          const found = data.some((item) => item.contenido_id === content.id);
          setInMiLista(found);
        })
        .catch(() => {});
    }
  }, [content, profile]);

  // HU9: Check if user has watched this content and load their rating
  useEffect(() => {
    if (!profile || !content) return;

    // Check if user has started watching
    apiRequest<Vista[]>(`/perfiles/${profile.id}/vistas`)
      .then((vistas) => {
        const watched = vistas.some(
          (v) => v.contenido_id === content.id || (content.tipo === "serie" && v.contenido_id === content.id)
        );
        setHasWatched(watched);
      })
      .catch(() => {});

    // Load user's existing rating
    getCalificacion(profile.id, content.id)
      .then((cal) => {
        if (cal) {
          setUserRating(cal.puntaje);
          setHasWatched(true); // If they rated, they must have watched
        }
      })
      .catch(() => {});
  }, [profile, content]);

  const movieQualities = qualityOptions(content?.video_variants);
  const portadaUrl = content ? getAssetUrl(content.portada_url) : null;

  const handlePlayMovie = async () => {
    if (!content) return;

    // HU4: Restriction check
    if (currentProfileData?.es_infantil && content.clasificacion_edad !== "ATP") {
      setError("Este contenido no esta disponible para perfiles infantiles.");
      return;
    }

    setPlayLoading("movie");
    try {
      const quality = selectedMovieQuality || movieQualities[0] || "";
      const params = new URLSearchParams();
      if (quality) params.set("quality", quality);
      if (currentProfileData?.id) params.set("perfil_id", String(currentProfileData.id));
      const path = `/contenidos/${content.id}/playback${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiRequest<PlaybackResponse>(path);
      const streamUrl = getBackendUrl(data.stream_url);
      router.push(
        `/reproducir?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(content.titulo)}&contenido_id=${content.id}`
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes("403")) {
        setError("Este contenido no esta disponible para perfiles infantiles.");
      } else {
        console.error("Error getting playback URL:", err);
      }
    } finally {
      setPlayLoading(null);
    }
  };

  const handlePlayEpisode = async (episodio: Episodio) => {
    if (!content || !selectedTemporada) return;

    // HU4: Restriction check
    if (currentProfileData?.es_infantil && content.clasificacion_edad !== "ATP") {
      setError("Este contenido no esta disponible para perfiles infantiles.");
      return;
    }

    setPlayLoading(`ep-${episodio.id}`);
    try {
      const qualities = qualityOptions(episodio.video_variants);
      const quality = selectedEpisodeQualities[episodio.id] || qualities[0] || "";
      const params = new URLSearchParams();
      if (quality) params.set("quality", quality);
      if (currentProfileData?.id) params.set("perfil_id", String(currentProfileData.id));
      const path = `/episodios/${episodio.id}/playback${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiRequest<PlaybackResponse>(path);
      const streamUrl = getBackendUrl(data.stream_url);
      const title = `${content.titulo} - T${selectedTemporada.numero} E${episodio.numero}: ${episodio.titulo}`;
      router.push(
        `/reproducir?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}&episodio_id=${episodio.id}&contenido_id=${content.id}`
      );
    } catch (err) {
      if (err instanceof Error && err.message.includes("403")) {
        setError("Este contenido no esta disponible para perfiles infantiles.");
      } else {
        console.error("Error getting playback URL:", err);
      }
    } finally {
      setPlayLoading(null);
    }
  };

  const handleToggleMiLista = async () => {
    if (!profile || !content) return;
    
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
    } catch (err) {
      console.error("Error toggling Mi Lista:", err);
    } finally {
      setMiListaLoading(false);
    }
  };

  // HU9: Handle rating change
  const handleRatingChange = async (newRating: number) => {
    if (!profile || !content || !hasWatched) return;
    
    setRatingLoading(true);
    try {
      await setCalificacion(profile.id, content.id, newRating);
      setUserRating(newRating);
    } catch (err) {
      console.error("Error setting rating:", err);
    } finally {
      setRatingLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <BrandLogo size="lg" />
        <p className="text-muted-foreground">{error || "Contenido no encontrado"}</p>
        <Link href="/inicio" className="text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-background to-transparent">
        <Link
          href="/inicio"
          className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={24} />
          <span className="font-medium">Volver</span>
        </Link>
      </header>

      {/* Hero with poster/background */}
      <div className="relative h-[50vh] md:h-[60vh]">
        {portadaUrl ? (
          <img
            src={portadaUrl}
            alt={content.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            {content.tipo === "pelicula" ? (
              <Film size={120} className="text-muted-foreground" />
            ) : (
              <Tv size={120} className="text-muted-foreground" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Title overlay */}
        <div className="absolute bottom-8 left-4 right-4 md:left-8 md:right-8 lg:left-16 lg:right-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">{content.titulo}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 lg:px-16 pb-12 -mt-8 relative z-10">
        {/* Error message for infantil restriction */}
        {error && (
          <div className="mb-6 rounded-lg border border-primary/60 bg-primary/10 px-4 py-3 text-sm text-primary">
            {error}
          </div>
        )}

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
          {content.clasificacion_edad && (
            <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
              {content.clasificacion_edad}
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
          <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
            {content.descripcion}
          </p>
        )}

        {/* HU9: User rating section */}
        {hasWatched && !error && (
          <div className="mb-6 p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Tu calificacion:</span>
              <div className="flex items-center gap-2">
                <StarRating
                  value={userRating}
                  onChange={handleRatingChange}
                  readOnly={ratingLoading}
                  size={28}
                />
                {ratingLoading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              </div>
            </div>
            {userRating > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Has calificado este contenido con {userRating} estrella{userRating !== 1 ? "s" : ""}.
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {content.tipo === "pelicula" && !error && (
            <>
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
            </>
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
        {content.tipo === "serie" && !error && (
          <div>
            {/* Temporadas tabs */}
            {temporadas.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Temporadas</h3>
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
            {episodios.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground mb-4">Episodios</h3>
                {episodios.map((episodio) => (
                  <div
                    key={episodio.id}
                    className="flex items-center justify-between gap-3 p-4 bg-card rounded-lg hover:bg-card/80 transition-colors"
                  >
                    {getAssetUrl(episodio.thumbnail_url) && (
                      <img
                        src={getAssetUrl(episodio.thumbnail_url) || ""}
                        alt=""
                        className="h-16 w-28 flex-shrink-0 rounded-md object-cover"
                      />
                    )}
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
                      className="ml-2 w-10 h-10 flex-shrink-0 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
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
