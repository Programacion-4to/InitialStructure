"use client";

import { useState, useEffect, useCallback } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ContentRow } from "@/components/ContentRow";
import { ContentDetail } from "@/components/ContentDetail";
import { VideoPlayer } from "@/components/VideoPlayer";
import { CatalogPage } from "@/components/CatalogPage";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import { RecommendationRow } from "@/components/RecommendationRow";
import { TopContentRow } from "@/components/TopContentRow";
import {
  isAuthenticated,
  getSelectedProfile,
  searchContenidos,
  getMiLista,
  getContinuarViendo,
  getContenido,
  upsertVista,
} from "@/lib/api";
import type { Contenido, Perfil, Vista } from "@/lib/types";

type AppView = "login" | "profile-select" | "home" | "player";
type Section = "inicio" | "catalogo" | "peliculas" | "series" | "mi-lista";

export default function Home() {
  const [view, setView] = useState<AppView>("login");
  const [activeSection, setActiveSection] = useState<Section>("inicio");
  const [selectedContent, setSelectedContent] = useState<Contenido | null>(null);
  const [selectedVista, setSelectedVista] = useState<Vista | null>(null);
  const [playerData, setPlayerData] = useState<{
    url: string;
    title: string;
    contenido_id?: number;
    episodio_id?: number;
  } | null>(null);
  const [playerStartTime, setPlayerStartTime] = useState<number>(0);

  // Content state
  const [allContent, setAllContent] = useState<Contenido[]>([]);
  const [miLista, setMiLista] = useState<Contenido[]>([]);
  const [continuarViendo, setContinuarViendo] = useState<Vista[]>([]);
  const [recommendations, setRecommendations] = useState<Contenido[]>([]);
  const [contenidoMap, setContenidoMap] = useState<Map<number, Contenido>>(new Map());
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const profile = getSelectedProfile();
      if (profile) {
        setView("home");
      } else {
        setView("profile-select");
      }
    } else {
      setView("login");
    }
  }, []);

  // Fetch content
  const fetchContent = useCallback(async () => {
    setLoading(true);
    const profile = getSelectedProfile();
    try {
      // Fetch all content with profile filtering (infantil restriction)
      const contenidos = await searchContenidos({
        perfil_id: profile?.id,
      }).catch(() => []);
      setAllContent(contenidos);

      // Build contenido map for quick lookup
      const map = new Map<number, Contenido>();
      for (const c of contenidos) {
        map.set(c.id, c);
      }
      setContenidoMap(map);

      if (profile && profile.id > 0) {
        // Fetch Mi Lista
        const lista = await getMiLista(profile.id).catch(() => []);
        setMiLista(lista);

        // Fetch Continuar Viendo
        const continuar = await getContinuarViendo(profile.id).catch(() => []);
        setContinuarViendo(continuar.filter((v) => !v.terminado));

        // Recommendations: use search with profile_id (backend applies infantil filter)
        // For now we use the general catalog minus already-watched items
        const watchedIds = new Set(continuar.filter((v) => v.terminado).map((v) => v.contenido_id));
        const recs = contenidos.filter((c) => !watchedIds.has(c.id)).slice(0, 10);
        setRecommendations(recs);
      }
    } catch {
      setAllContent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch content when entering home
  useEffect(() => {
    if (view === "home") {
      fetchContent();
    }
  }, [view, fetchContent]);

  // Filter content by type
  const peliculas = allContent.filter((c) => c.tipo === "pelicula");
  const series = allContent.filter((c) => c.tipo === "serie");

  // Handlers
  const handleLoginSuccess = () => {
    setView("profile-select");
  };

  const handleProfileSelect = (_profile: Perfil) => {
    setView("home");
  };

  const handleLogout = () => {
    setView("login");
    setActiveSection("inicio");
    setSelectedContent(null);
    setPlayerData(null);
    setContinuarViendo([]);
    setMiLista([]);
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section as Section);
  };

  const handleContentClick = (content: Contenido) => {
    setSelectedContent(content);
    setSelectedVista(null);
  };

  const handleContinueClick = async (contenidoId: number, vista: Vista) => {
    // Find or fetch the content
    let content = contenidoMap.get(contenidoId);
    if (!content) {
      try {
        content = await getContenido(contenidoId);
      } catch {
        return;
      }
    }
    setSelectedContent(content);
    setSelectedVista(vista);
  };

  const handleCloseDetail = () => {
    setSelectedContent(null);
    setSelectedVista(null);
  };

  const handlePlay = (
    streamUrl: string,
    title: string,
    vistaInfo?: { contenido_id?: number; episodio_id?: number }
  ) => {
    setSelectedContent(null);
    setSelectedVista(null);
    setPlayerData({
      url: streamUrl,
      title,
      contenido_id: vistaInfo?.contenido_id,
      episodio_id: vistaInfo?.episodio_id,
    });
    setPlayerStartTime(Date.now());
    setView("player");
  };

  const handleBackFromPlayer = async () => {
    // Save progress when leaving player
    const profile = getSelectedProfile();
    if (profile && playerData && playerStartTime) {
      const secondsWatched = Math.floor((Date.now() - playerStartTime) / 1000);
      if (secondsWatched > 5) {
        try {
          await upsertVista(profile.id, {
            contenido_id: playerData.contenido_id ?? null,
            episodio_id: playerData.episodio_id ?? null,
            segundos_vistos: secondsWatched,
            terminado: false,
          });
        } catch {
          // silently fail
        }
      }
    }
    setPlayerData(null);
    setPlayerStartTime(0);
    setView("home");
    // Refresh content to update continuar viendo
    fetchContent();
  };

  // Render based on view
  if (view === "login") {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === "profile-select") {
    return <ProfileSelector onProfileSelect={handleProfileSelect} />;
  }

  if (view === "player" && playerData) {
    return (
      <VideoPlayer
        streamUrl={playerData.url}
        title={playerData.title}
        onBack={handleBackFromPlayer}
      />
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-background">
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main>
        {/* ─── HOME / INICIO ─── */}
        {activeSection === "inicio" && (
          <>
            <Hero
              onExplore={() => handleNavigate("catalogo")}
              onMiLista={() => handleNavigate("mi-lista")}
            />

            <div className="-mt-20 relative z-10">
              {/* Continuar viendo */}
              {continuarViendo.length > 0 && (
                <ContinueWatchingRow
                  vistas={continuarViendo}
                  contenidoMap={contenidoMap}
                  onContentClick={handleContinueClick}
                />
              )}

              {/* Top 10 */}
              <TopContentRow onContentClick={handleContentClick} />

              {/* Peliculas */}
              <ContentRow
                title="Peliculas"
                contents={peliculas}
                loading={loading}
                onContentClick={handleContentClick}
                emptyMessage="No hay peliculas disponibles en este momento."
              />

              {/* Series */}
              <ContentRow
                title="Series"
                contents={series}
                loading={loading}
                onContentClick={handleContentClick}
                emptyMessage="No hay series disponibles en este momento."
              />

              {/* Mi Lista */}
              {miLista.length > 0 && (
                <ContentRow
                  title="Mi lista"
                  contents={miLista}
                  loading={false}
                  onContentClick={handleContentClick}
                />
              )}

              {/* Recomendaciones */}
              <RecommendationRow
                recommendations={recommendations}
                loading={loading}
                onContentClick={handleContentClick}
              />
            </div>
          </>
        )}

        {/* ─── CATALOGO (full search & filters) ─── */}
        {activeSection === "catalogo" && (
          <CatalogPage onContentClick={handleContentClick} />
        )}

        {/* ─── PELICULAS ─── */}
        {activeSection === "peliculas" && (
          <CatalogPage
            onContentClick={handleContentClick}
            initialTipo="pelicula"
          />
        )}

        {/* ─── SERIES ─── */}
        {activeSection === "series" && (
          <CatalogPage
            onContentClick={handleContentClick}
            initialTipo="serie"
          />
        )}

        {/* ─── MI LISTA ─── */}
        {activeSection === "mi-lista" && (
          <div className="pt-24 pb-12 px-4 md:px-8 lg:px-16">
            <h1 className="text-3xl font-bold text-foreground mb-6">
              Mi lista
            </h1>
            {miLista.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-lg">
                  Tu lista esta vacia. Agrega peliculas y series para verlas
                  mas tarde.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {miLista.map((content) => (
                  <button
                    key={content.id}
                    onClick={() => handleContentClick(content)}
                    className="text-left"
                  >
                    <div className="aspect-[2/3] rounded-lg bg-secondary flex items-center justify-center border border-border hover:border-muted-foreground transition-all">
                      <span className="text-muted-foreground text-4xl font-bold">
                        {content.titulo.charAt(0)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground truncate">
                      {content.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {content.anio} - {content.tipo}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Content Detail Modal */}
      {selectedContent && (
        <ContentDetail
          content={selectedContent}
          onClose={handleCloseDetail}
          onPlay={handlePlay}
          vista={selectedVista}
        />
      )}
    </div>
  );
}
