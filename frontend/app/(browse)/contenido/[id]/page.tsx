"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Plus, Check, Star, Loader2, Film, Tv, Download } from "lucide-react";
import { apiRequest, deleteCalificacion, getBackendUrl, getAssetUrl, getCalificacion, setCalificacion } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BrandLogo } from "@/components/BrandLogo";
import { StarRating } from "@/components/StarRating";
import type { Contenido, Temporada, Episodio, PlaybackResponse, VideoVariant, Profile, Vista, Descarga } from "@/lib/types";

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
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [downloadUsage, setDownloadUsage] = useState(0);
  const [selectedMovieQuality, setSelectedMovieQuality] = useState("");
  const [selectedEpisodeQualities, setSelectedEpisodeQualities] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentProfileData, setCurrentProfileData] = useState<Profile | null>(null);
  
  // HU9: Calificacion state
  const [userRating, setUserRating] = useState<number>(0);
  const [hasWatched, setHasWatched] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [vistas, setVistas] = useState<Vista[]>([]);

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
        apiRequest<Contenido[]>(`/perfiles/${profile.id}/mi-lista`)
        .then((data) => {
          const found = data.some((item) => item.id === content.id);
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
        setVistas(vistas);
        const watched = vistas.some((v) => v.contenido_id === content.id);
        setHasWatched(watched);
      })
      .catch(() => setVistas([]));

    // Load user's existing rating
    getCalificacion(profile.id, content.id)
      .then((cal) => {
        if (cal) {
          setUserRating(cal.puntaje);
          setHasWatched(true); // If they rated, they must have watched
        } else {
          setUserRating(0);
        }
      })
      .catch(() => {});
  }, [profile, content]);

  const movieQualities = qualityOptions(content?.video_variants);
  const availableMovieQualities = filterQualitiesForPlan(movieQualities, account?.plan);
  const downloadLimit = DOWNLOAD_LIMITS[account?.plan || "basico"];
  const portadaUrl = content ? getAssetUrl(content.portada_url) : null;
  const averageRating = content?.promedio_calificaciones ?? content?.promedio_calificacion;

  const refreshDownloadUsage = useCallback(async () => {
    if (!profile) return;
    try {
      const descargas = await apiRequest<Descarga[]>(`/perfiles/${profile.id}/descargas`);
      setDownloadUsage(descargas.length);
    } catch {
      setDownloadUsage(0);
    }
  }, [profile]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshDownloadUsage();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshDownloadUsage]);

  const handlePlayMovie = async (startAt = 0) => {
    if (!content) return;

    // HU4: Restriction check
    if (currentProfileData?.es_infantil && content.clasificacion_edad !== "ATP") {
      setError("Este contenido no esta disponible para perfiles infantiles.");
      return;
    }

    setPlayLoading("movie");
    try {
      const quality = selectedMovieQuality || availableMovieQualities[0] || "";
      const params = new URLSearchParams();
      if (quality) params.set("quality", quality);
      if (profile?.id) params.set("perfil_id", String(profile.id));
      const path = `/contenidos/${content.id}/playback${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiRequest<PlaybackResponse>(path);
      const streamUrl = getBackendUrl(data.stream_url);
      const playerParams = new URLSearchParams({
        url: streamUrl,
        title: content.titulo,
        contenido_id: String(content.id),
      });
      playerParams.set("t", String(Math.max(0, startAt)));
      router.push(`/reproducir?${playerParams.toString()}`);
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

  const handlePlayEpisode = async (episodio: Episodio, startAt = 0) => {
    if (!content || !selectedTemporada) return;

    // HU4: Restriction check
    if (currentProfileData?.es_infantil && content.clasificacion_edad !== "ATP") {
      setError("Este contenido no esta disponible para perfiles infantiles.");
      return;
    }

    setPlayLoading(`ep-${episodio.id}`);
    try {
      const qualities = qualityOptions(episodio.video_variants);
      const availableQualities = filterQualitiesForPlan(qualities, account?.plan);
      const quality = selectedEpisodeQualities[episodio.id] || availableQualities[0] || "";
      const params = new URLSearchParams();
      if (quality) params.set("quality", quality);
      if (profile?.id) params.set("perfil_id", String(profile.id));
      const path = `/episodios/${episodio.id}/playback${params.toString() ? `?${params.toString()}` : ""}`;
      const data = await apiRequest<PlaybackResponse>(path);
      const streamUrl = getBackendUrl(data.stream_url);
      const title = `${content.titulo} - T${selectedTemporada.numero} E${episodio.numero}: ${episodio.titulo}`;
      const playerParams = new URLSearchParams({
        url: streamUrl,
        title,
        episodio_id: String(episodio.id),
        contenido_id: String(content.id),
      });
      playerParams.set("t", String(Math.max(0, startAt)));
      router.push(`/reproducir?${playerParams.toString()}`);
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
      const updated = await apiRequest<Contenido>(`/contenidos/${content.id}`).catch(() => null);
      if (updated) {
        setContent(updated);
      }
    } catch (err) {
      console.error("Error setting rating:", err);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleDownloadMovie = async () => {
    if (!profile || !content) return;
    const quality = selectedMovieQuality || availableMovieQualities[0] || "";
    await handleDownload({
      key: "movie",
      payload: { contenido_id: content.id },
      downloadPath: `/contenidos/${content.id}/download${quality ? `?quality=${encodeURIComponent(quality)}` : ""}`,
      fallbackFilename: `${content.titulo}-${quality || "video"}`,
    });
  };

  const handleDownloadEpisode = async (episodio: Episodio) => {
    if (!profile || !content) return;
    const availableQualities = filterQualitiesForPlan(qualityOptions(episodio.video_variants), account?.plan);
    const quality = selectedEpisodeQualities[episodio.id] || availableQualities[0] || "";
    await handleDownload({
      key: `ep-${episodio.id}`,
      payload: { episodio_id: episodio.id },
      downloadPath: `/episodios/${episodio.id}/download${quality ? `?quality=${encodeURIComponent(quality)}` : ""}`,
      fallbackFilename: `${content.titulo}-T${selectedTemporada?.numero || 1}-E${episodio.numero}-${quality || "video"}`,
    });
  };

  const handleDownload = async ({
    key,
    payload,
    downloadPath,
    fallbackFilename,
  }: {
    key: string;
    payload: { contenido_id?: number; episodio_id?: number };
    downloadPath: string;
    fallbackFilename: string;
  }) => {
    if (!profile) return;

    setDownloadLoading(key);
    setDownloadMessage(null);
    try {
      const descarga = await apiRequest<Descarga>(`/perfiles/${profile.id}/descargas`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const ticketPath = buildDownloadTicketPath(downloadPath, profile.id, descarga.id);
      const ticket = await apiRequest<{ download_url: string }>(ticketPath);
      startBrowserDownload(ticket.download_url, fallbackFilename);
      await refreshDownloadUsage();
      setDownloadMessage({ type: "ok", text: "Descarga iniciada." });
    } catch (err) {
      setDownloadMessage({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudo iniciar la descarga.",
      });
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleDeleteRating = async () => {
    if (!profile || !content || userRating <= 0) return;

    setRatingLoading(true);
    try {
      await deleteCalificacion(profile.id, content.id);
      setUserRating(0);
      const updated = await apiRequest<Contenido>(`/contenidos/${content.id}`).catch(() => null);
      if (updated) {
        setContent(updated);
      }
    } catch (err) {
      setUserRating(0);
      console.error("Error deleting rating:", err);
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
          {averageRating !== undefined && averageRating > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              <Star size={14} fill="currentColor" />
              {averageRating.toFixed(1)}
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
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  Has calificado este contenido con {userRating} estrella{userRating !== 1 ? "s" : ""}.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteRating}
                  disabled={ratingLoading}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  Eliminar calificacion
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {content.tipo === "pelicula" && !error && (
            <>
              {(() => {
                const vista = vistas.find((item) => item.contenido_id === content.id);
                const canResume = Boolean(vista && !vista.terminado && vista.segundos_vistos > 0);
                return canResume ? (
                  <button
                    onClick={() => handlePlayMovie(vista?.segundos_vistos || 0)}
                    disabled={playLoading === "movie"}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {playLoading === "movie" ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Play size={20} fill="currentColor" />
                    )}
                    Continuar
                  </button>
                ) : null;
              })()}
              <button
                onClick={() => handlePlayMovie(0)}
                disabled={playLoading === "movie"}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                {playLoading === "movie" ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Play size={20} fill="currentColor" />
                )}
                {vistas.some((item) => item.contenido_id === content.id && item.segundos_vistos > 0 && !item.terminado)
                  ? "Desde cero"
                  : "Reproducir"}
              </button>
              {availableMovieQualities.length > 0 && (
                <select
                  className="rounded-lg border border-border bg-secondary px-3 py-3 text-sm font-semibold text-secondary-foreground outline-none focus:ring-2 focus:ring-primary"
                  value={availableMovieQualities.includes(selectedMovieQuality) ? selectedMovieQuality : availableMovieQualities[0]}
                  onChange={(event) => setSelectedMovieQuality(event.target.value)}
                  aria-label="Calidad de pelicula"
                >
                  {availableMovieQualities.map((quality) => (
                    <option key={quality} value={quality}>
                      {quality}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={handleDownloadMovie}
                disabled={downloadLoading === "movie" || downloadLimit === 0}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50"
              >
                {downloadLoading === "movie" ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
                Descargar
              </button>
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
        {!error && (
          <div className="mb-8 min-h-6 text-sm">
            <span className="text-muted-foreground">
              Descargas del plan: {downloadUsage}/{downloadLimit}
            </span>
            {downloadLimit === 0 && (
              <span className="ml-2 text-primary">Mejora tu plan para descargar.</span>
            )}
            {downloadMessage && (
              <p className={downloadMessage.type === "ok" ? "mt-2 text-green-500" : "mt-2 text-destructive"}>
                {downloadMessage.text}
              </p>
            )}
          </div>
        )}

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
                {episodios.map((episodio) => {
                  const vista = vistas.find((item) => item.episodio_id === episodio.id);
                  const canResume = Boolean(vista && !vista.terminado && vista.segundos_vistos > 0);
                  return (
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
                    {filterQualitiesForPlan(qualityOptions(episodio.video_variants), account?.plan).length > 0 && (
                      <select
                        className="rounded-md border border-border bg-background px-2 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                        value={
                          filterQualitiesForPlan(qualityOptions(episodio.video_variants), account?.plan).includes(selectedEpisodeQualities[episodio.id])
                            ? selectedEpisodeQualities[episodio.id]
                            : filterQualitiesForPlan(qualityOptions(episodio.video_variants), account?.plan)[0]
                        }
                        onChange={(event) =>
                          setSelectedEpisodeQualities((current) => ({
                            ...current,
                            [episodio.id]: event.target.value,
                          }))
                        }
                        aria-label={`Calidad de ${episodio.titulo}`}
                      >
                        {filterQualitiesForPlan(qualityOptions(episodio.video_variants), account?.plan).map((quality) => (
                          <option key={quality} value={quality}>
                            {quality}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="ml-2 flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadEpisode(episodio)}
                        disabled={downloadLoading === `ep-${episodio.id}` || downloadLimit === 0}
                        className="w-10 h-10 flex-shrink-0 bg-background rounded-full flex items-center justify-center hover:bg-background/80 transition-colors disabled:opacity-50"
                        aria-label={`Descargar ${episodio.titulo}`}
                      >
                        {downloadLoading === `ep-${episodio.id}` ? (
                          <Loader2 size={18} className="animate-spin text-foreground" />
                        ) : (
                          <Download size={18} className="text-foreground" />
                        )}
                      </button>
                      {canResume && (
                        <button
                          type="button"
                          onClick={() => handlePlayEpisode(episodio, vista?.segundos_vistos || 0)}
                          disabled={playLoading === `ep-${episodio.id}`}
                          className="rounded-md bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                        >
                          Continuar
                        </button>
                      )}
                      <button
                        onClick={() => handlePlayEpisode(episodio, 0)}
                        disabled={playLoading === `ep-${episodio.id}`}
                        className={canResume
                          ? "rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                          : "w-10 h-10 flex-shrink-0 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                        }
                      >
                        {playLoading === `ep-${episodio.id}` ? (
                          <Loader2 size={20} className="animate-spin text-primary-foreground" />
                        ) : canResume ? (
                          "Desde cero"
                        ) : (
                          <Play size={20} fill="white" className="text-primary-foreground ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  );
                })}
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

function filterQualitiesForPlan(qualities: string[], plan: string | undefined): string[] {
  const maxRank = { basico: 1, estandar: 2, premium: 3 }[plan || "basico"] || 1;
  return qualities.filter((quality) => qualityRank(quality) <= maxRank);
}

function buildDownloadTicketPath(downloadPath: string, profileId: number, descargaId: number): string {
  const [path, query = ""] = downloadPath.split("?");
  const params = new URLSearchParams(query);
  params.set("perfil_id", String(profileId));
  params.set("descarga_id", String(descargaId));
  return `${path}-ticket?${params.toString()}`;
}

function startBrowserDownload(downloadUrl: string, fallbackFilename: string): void {
  const link = document.createElement("a");
  link.href = getBackendUrl(downloadUrl);
  link.download = fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const DOWNLOAD_LIMITS: Record<"basico" | "estandar" | "premium", number> = {
  basico: 0,
  estandar: 10,
  premium: 30,
};
